import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export function buildPrismaModel(schema: string): string {
  const models = schema.match(/type\s+\w+\s+\{[^}]*\}/g) || [];

  const output = models.map((modelBlock) => {
    const modelName = modelBlock.match(/type\s+(\w+)/)![1];
    const fieldsBlock = modelBlock.match(/\{([\s\S]*?)\}/)![1];

    const lines = fieldsBlock
      .split(/(?<=!)\s+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const fieldNames = lines.map((line) => line.split(":")[0].trim());

    const finalFields: string[] = [];

    for (const line of lines) {
      const [fieldNameRaw, typeRaw] = line.split(":");
      if (!fieldNameRaw || !typeRaw) continue;

      const fieldName = fieldNameRaw.trim();
      const rawType = typeRaw.trim();

      const isArray = rawType.includes("[") && rawType.includes("]");
      const gqlType = rawType.replace(/[\[\]!]/g, "").trim();

      if (fieldName === "id") continue;

      // If ends in Id → treat as ObjectId
      if (fieldName.endsWith("Id")) {
        finalFields.push(`  ${fieldName} String @db.ObjectId`);
        continue;
      }

      // Scalar mapping
      const scalarMap: Record<string, string> = {
        ID: "String",
        String: "String",
        Int: "Int",
        Float: "Float",
        Boolean: "Boolean",
      };

      if (scalarMap[gqlType]) {
        finalFields.push(`  ${fieldName} ${scalarMap[gqlType]}`);
        continue;
      }

      // RELATION: has foreign key on same model
      const idField = `${fieldName}Id`;
      if (fieldNames.includes(idField)) {
        finalFields.push(
          `  ${fieldName} ${gqlType} @relation(fields: [${idField}], references: [id])`
        );
        continue;
      }

      // RELATION: one-to-many (we assume foreign key is on other model)
      if (isArray) {
        finalFields.push(`  ${fieldName} ${gqlType}[]`);
        continue;
      }

      // RELATION: many-to-one but no FK found
      finalFields.push(`  ${fieldName} ${gqlType} @relation`);
    }

    finalFields.unshift(
      `  id String @id @default(auto()) @map("_id") @db.ObjectId`
    );

    return `model ${modelName} {\n${finalFields.join("\n")}\n}`;
  });

  const fullSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("MONGO_URI")
}

${output.join("\n\n")}
`.trim();

  const prismaDir = path.join(process.cwd(), "prisma");
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }

  const prismaPath = path.join(prismaDir, "schema.prisma");
  fs.writeFileSync(prismaPath, fullSchema);

  // ✅ Automatically run `npx prisma generate`:

  execSync("npx prisma generate", { encoding: "utf8" });

  return fullSchema;
}
