import fs from "fs";
import path from "path";

export const generateTypeDefs = (sdl: string) => {
  const models = sdl.match(/type\s+\w+\s+\{[^}]*\}/g) || [];

  const typeDefsDir = path.join(process.cwd(), "src", "generated", "typeDefs");
  if (!fs.existsSync(typeDefsDir))
    fs.mkdirSync(typeDefsDir, { recursive: true });

  const typeNames: string[] = [];

  models.forEach((model) => {
    const name = model.match(/type\s+(\w+)/)?.[1];
    if (!name) return;

    typeNames.push(name);

    const fieldBlock = model.match(/\{([^}]*)\}/)![1];

    const lines = fieldBlock
      .split(/(?<=!)\s+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.startsWith("id"));

    // Collect all xxxId field names
    const idFieldNames = lines
      .filter((line) => line.match(/^\w+Id\s*:\s*ID!?/))
      .map((line) => line.split(":")[0].trim());

    const inputFields = lines
      .filter((line) => {
        const [fieldNameRaw, typeRaw] = line.split(":").map((s) => s.trim());
        if (!fieldNameRaw || !typeRaw) return false;

        const baseType = typeRaw.replace(/[\[\]!]/g, "");
        const isArray = typeRaw.includes("[") && typeRaw.includes("]");

        // Skip arrays like `posts: [Post!]!`
        if (isArray) return false;

        // Skip relation if xxxId exists
        if (
          /^[A-Z]/.test(baseType) && // starts with uppercase → likely model type
          !["ID", "String", "Int", "Float", "Boolean"].includes(baseType)
        ) {
          const idField = `${fieldNameRaw}Id`;
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
\`;
`;

    fs.writeFileSync(
      path.join(typeDefsDir, `${name.toLowerCase()}TypeDefs.ts`),
      fileContent.trim()
    );
  });

  // ✅ Create rootTypeDefs.ts
  const imports = typeNames.map(
    (name) =>
      `import { ${name.toLowerCase()}TypeDefs } from "./${name.toLowerCase()}TypeDefs";`
  );
  const typeDefsArray = typeNames.map(
    (name) => `${name.toLowerCase()}TypeDefs`
  );

  const indexContent = `
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
    path.join(typeDefsDir, `rootTypeDefs.ts`),
    indexContent.trim()
  );
};
