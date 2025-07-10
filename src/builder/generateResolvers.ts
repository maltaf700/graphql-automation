import fs from "fs";
import path from "path";

export function generateResolvers(schema: string) {
  const models = schema.match(/type\s+\w+\s+\{[^}]*\}/g) || [];

  const resolversDir = path.join(
    process.cwd(),
    "src",
    "generated",
    "resolvers"
  );
  const typesDir = path.join(process.cwd(), "src", "generated", "types");

  if (!fs.existsSync(resolversDir))
    fs.mkdirSync(resolversDir, { recursive: true });
  if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir, { recursive: true });

  const modelMap: Record<string, string[]> = {};
  const typeInterfaces: string[] = [];

  for (const model of models) {
    const name = model.match(/type\s+(\w+)/)![1];
    const fields = model
      .match(/\{([^}]*)\}/)![1]
      .split(/(?<=!)\s+/)
      .map((line) => line.trim())
      .filter(Boolean);
    modelMap[name] = fields;
  }

  const importLines: string[] = [];
  const queryFields: string[] = [];
  const mutationFields: string[] = [];
  const typeResolvers: string[] = [];

  for (const [modelName, fields] of Object.entries(modelMap)) {
    const nameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);

    const idFieldNames = fields
      .filter((f) => f.match(/^\w+Id\s*:\s*ID!?/))
      .map((f) => f.split(":")[0].trim());

    const fieldResolvers: string[] = [];
    const tsFields: string[] = [];

    for (const field of fields) {
      const [fieldNameRaw, fieldTypeRaw] = field
        .split(":")
        .map((s) => s.trim());
      if (!fieldNameRaw || !fieldTypeRaw) continue;

      const baseType = fieldTypeRaw.replace(/[\[\]!]/g, "");
      const isArray = fieldTypeRaw.includes("[") && fieldTypeRaw.includes("]");

      const tsType = ["String", "ID"].includes(baseType)
        ? "string"
        : baseType === "Int" || baseType === "Float"
        ? "number"
        : baseType === "Boolean"
        ? "boolean"
        : isArray
        ? `${baseType}[]`
        : baseType;

      tsFields.push(`${fieldNameRaw}: ${tsType};`);

      const relatedId = `${fieldNameRaw}Id`;
      if (idFieldNames.includes(relatedId) && modelMap[baseType]) {
        fieldResolvers.push(
          `${fieldNameRaw}: (parent: ${modelName}) => prisma.${baseType.toLowerCase()}.findUnique({ where: { id: parent.${relatedId} } })`
        );
        continue;
      }

      const reverseId = `${nameLower}Id`;
      if (
        isArray &&
        modelMap[baseType] &&
        modelMap[baseType].some((f) => f.startsWith(`${reverseId}:`))
      ) {
        fieldResolvers.push(
          `${fieldNameRaw}: (parent: ${modelName}) => prisma.${baseType.toLowerCase()}.findMany({ where: { ${reverseId}: parent.id } })`
        );
      }
    }

    // Combine all types into a single file
    typeInterfaces.push(
      `export interface ${modelName} {\n  ${tsFields.join("\n  ")}\n}`
    );

    const resolverContent = `
import { PrismaClient } from '@prisma/client';
import { ${modelName} } from '../types/models';
const prisma = new PrismaClient();

export const ${nameLower}Resolvers = {
  Query: {
    get${modelName}s: async () => await prisma.${nameLower}.findMany(),
    get${modelName}ById: async (_: any, { id }: { id: string }) => await prisma.${nameLower}.findUnique({ where: { id } }),
  },
  Mutation: {
    create${modelName}: async (_: any, { input }: any) => {
      return await prisma.${nameLower}.create({ data: input });
    },
    update${modelName}: async (_: any, { input }: any) => {
      const { id, ...rest } = input;
      return await prisma.${nameLower}.update({
        where: { id },
        data: rest,
      });
    },
    delete${modelName}: async (_: any, { id }: { id: string }) => {
      await prisma.${nameLower}.delete({ where: { id } });
      return true;
    }
  }${
    fieldResolvers.length > 0
      ? `,
  ${modelName}: {
    ${fieldResolvers.join(",\n    ")}
  }`
      : ""
  }
};
`.trim();

    fs.writeFileSync(
      path.join(resolversDir, `${nameLower}Resolvers.ts`),
      resolverContent
    );

    importLines.push(
      `import { ${nameLower}Resolvers } from "./${nameLower}Resolvers";`
    );
    queryFields.push(`...${nameLower}Resolvers.Query`);
    mutationFields.push(`...${nameLower}Resolvers.Mutation`);
    if (fieldResolvers.length > 0) {
      typeResolvers.push(
        `${modelName}: { ...${nameLower}Resolvers.${modelName} }`
      );
    }
  }

  // ✅ Write all TypeScript interfaces to a single file
  const allTypes = typeInterfaces.join("\n\n");
  fs.writeFileSync(path.join(typesDir, `models.ts`), allTypes);

  // ✅ Root Resolver File
  const rootContent = `
${importLines.join("\n")}

export const resolvers = {
  Query: {
    ${queryFields.join(",\n    ")}
  },
  Mutation: {
    ${mutationFields.join(",\n    ")}
  }${typeResolvers.length > 0 ? `,\n  ${typeResolvers.join(",\n  ")}` : ""}
};
`.trim();

  fs.writeFileSync(path.join(resolversDir, `rootResolver.ts`), rootContent);
}
