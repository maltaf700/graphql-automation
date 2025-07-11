import fs from "fs";
import path from "path";

export const generateTypeDefs = (sdl: string) => {
  const models = sdl.match(/type\s+\w+\s+\{[^}]*\}/g) || [];

  const typeDefsDir = path.join(process.cwd(), "src", "generated", "typeDefs");
  if (!fs.existsSync(typeDefsDir)) {
    fs.mkdirSync(typeDefsDir, { recursive: true });
  }

  let typeNames: string[] = [];

  for (const model of models) {
    const name = model.match(/type\s+(\w+)/)?.[1];
    if (!name) continue;

    const filePath = path.join(typeDefsDir, `${name.toLowerCase()}TypeDefs.ts`);
    let updateNeeded = true;

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const gqlContentMatch = content.match(/gql`([\s\S]*?)`/);
      if (gqlContentMatch) {
        const gqlContent = gqlContentMatch[1];
        const fileTypeMatch = gqlContent.match(
          new RegExp(`type\\s+${name}\\s*\\{[\\s\\S]*?\\}`)
        );
        const schemaTypeMatch = model.match(
          new RegExp(`type\\s+${name}\\s*\\{([\\s\\S]*?)\\}`)
        );

        if (fileTypeMatch && schemaTypeMatch) {
          const fileFields = fileTypeMatch[0]
            .match(/\{([\s\S]*?)\}/)?.[1]
            .split(/(?<=!)\s+/)
            .map((line) => line.trim().split(":")[0])
            .filter(Boolean);

          const schemaFields = schemaTypeMatch[1]
            .split(/(?<=!)\s+/)
            .map((line) => line.trim().split(":")[0])
            .filter(Boolean);

          const fileIncludesAll = fileFields?.every((f) =>
            schemaFields.includes(f)
          );
          const schemaIncludesAll = schemaFields.every((f) =>
            fileFields?.includes(f)
          );
          if (fileIncludesAll && schemaIncludesAll) {
            updateNeeded = false;
          }
        }
      }
    }
    typeNames.push(name);
    if (!updateNeeded) {
      continue; // Nothing to update
    }

    // Keep track for rootTypeDefs.ts

    // Build input fields from model
    const fieldBlock = model.match(/\{([^}]*)\}/)![1];

    const lines = fieldBlock
      .split(/(?<=!)\s+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith("id"));

    const idFieldNames = lines
      .filter((line) => /^\w+Id\s*:\s*ID!?/.test(line))
      .map((line) => line.split(":")[0].trim());

    const inputFields = lines
      .filter((line) => {
        const [fieldName, typeRaw] = line.split(":").map((s) => s.trim());
        if (!fieldName || !typeRaw) return false;

        const baseType = typeRaw.replace(/[\[\]!]/g, "");
        const isArray = typeRaw.includes("[") && typeRaw.includes("]");

        if (isArray) return false;

        if (
          /^[A-Z]/.test(baseType) &&
          !["ID", "String", "Int", "Float", "Boolean"].includes(baseType)
        ) {
          const idField = `${fieldName}Id`;
          return !idFieldNames.includes(idField);
        }

        return true;
      })
      .join("\n      ");

    const fileContent = `import gql from "graphql-tag";
    export const ${name.toLowerCase()}TypeDefs = gql\`
    ${model}

    input Create${name}Input {
    ${inputFields}
    }

    input Update${name}Input {
    id: ID!
    ${inputFields}
    }

    extend type Query {
    get${name}s: [${name}!]!
    get${name}ById(id: ID!): ${name}!
    }

    extend type Mutation {
    create${name}(input: Create${name}Input!): ${name}!
    update${name}(input: Update${name}Input!): ${name}!
    delete${name}(id: ID!): Boolean!
    }
    \`;`;

    fs.writeFileSync(filePath, fileContent.trim());
  }
  //check if root types is alraeady exist and fetch the already imported file bcz its overwrite
  const rootfilPath = path.join(typeDefsDir, "rootTypeDefs.ts");
  if (fs.existsSync(rootfilPath)) {
    const rootfileContent = fs.readFileSync(rootfilPath, "utf-8");
    const data = rootfileContent.match(
      /export\s+const\s+typeDefs\s*=\s*\[([\s\S]*?)\]/m
    )?.[1];
    if (data) {
      const matches = [...data.matchAll(/\b(\w+)TypeDefs\b/g)];
      const result = matches.map((match) => {
        const prefix = match[1];
        return prefix.charAt(0).toUpperCase() + prefix.slice(1);
      });
      result.forEach((type) => typeNames.push(type));
    }

    typeNames = [...new Set(typeNames)];
    typeNames = typeNames.filter((type) => type !== "Root");
  }
  typeNames = [...new Set(typeNames)];
  // ✅ Generate rootTypeDefs.ts
  const imports = typeNames.map(
    (name) =>
      `import { ${name.toLowerCase()}TypeDefs } from "./${name.toLowerCase()}TypeDefs";`
  );

  const typeDefsArray = typeNames.map(
    (name) => `${name.toLowerCase()}TypeDefs`
  );

  const rootContent = `
    import gql from "graphql-tag";
    ${imports.join("\n")}

    export const rootTypeDefs = gql\`
    type Query
    type Mutation
    \`;

    export const typeDefs = [
    rootTypeDefs,
    ${typeDefsArray.join(",\n  ")}
    ];
    `;

  fs.writeFileSync(
    path.join(typeDefsDir, "rootTypeDefs.ts"),
    rootContent.trim()
  );
};
