import express from "express";
import http from "http";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import dotenv from "dotenv";
import pingRouter from "./routes/ping";
import fs from "fs";
import path from "path";

dotenv.config();

// ─── Ensure resolvers file exists ──────────────────────────────
const resolverDirPath = path.join(__dirname, "generated/resolvers");
const resolverFilePath = path.join(resolverDirPath, "rootResolver.ts");

if (!fs.existsSync(resolverDirPath)) {
  fs.mkdirSync(resolverDirPath, { recursive: true });
}

if (!fs.existsSync(resolverFilePath)) {
  const defaultContent = `export const resolvers = {
  Query: {},
  Mutation: {}
};`;
  fs.writeFileSync(resolverFilePath, defaultContent);
}

// ─── Ensure typeDefs file exists ───────────────────────────────
const typeDirPath = path.join(__dirname, "generated/typeDefs");
const typeFilePath = path.join(typeDirPath, "rootTypeDefs.ts");

if (!fs.existsSync(typeDirPath)) {
  fs.mkdirSync(typeDirPath, { recursive: true });
}

if (!fs.existsSync(typeFilePath)) {
  const defaultContent = `import gql from "graphql-tag";

export const rootTypeDefs = gql\`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
\`;

export const typeDefs = [rootTypeDefs];
`;
  fs.writeFileSync(typeFilePath, defaultContent);
}

// ─── Start Apollo Server ────────────────────────────────────────
async function startServer() {
  const IS_TS = __filename.endsWith(".ts");

  const resolverPath = path.resolve(
    __dirname,
    "./generated/resolvers/rootResolver.ts"
  );

  const typeDefsPath = path.resolve(
    __dirname,
    "./generated/typeDefs/rootTypeDefs.ts"
  );

  const { resolvers } = require(resolverPath);
  const { typeDefs } = require(typeDefsPath);

  const app = express();
  const httpServer = http.createServer(app);

  app.use(cors());
  app.use(express.json());
  app.use(pingRouter);

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({}),
    })
  );

  httpServer.listen(4000, () => {
    console.log("🚀 GraphQL: http://localhost:4000/graphql");
    console.log("🔗 REST:    http://localhost:4000/ping");
  });
}

startServer();
