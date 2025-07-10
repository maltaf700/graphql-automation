import { Request, Response, Router } from "express";
import { generateTypeDefs } from "../builder/generateTypeDefs";
import { generateResolvers } from "../builder/generateResolvers";
import { buildPrismaModel } from "../builder/generatePrisma";

const router = Router();

router.post("/ping", (req: Request, res: Response) => {
  const { schema } = req.body;
  if (!schema) return res.status(400).json({ error: "Missing Schema" });

  try {
    generateTypeDefs(schema);
    generateResolvers(schema);
    buildPrismaModel(schema);

    // ✅ Only send one response if all is good
    return res.json({ message: "Done" });
  } catch (error) {
    console.error("Schema generation error:", error);

    // ✅ Only send error response once
    return res.status(400).json({ error: "Schema Generation Failed" });
  }
});

export default router;
