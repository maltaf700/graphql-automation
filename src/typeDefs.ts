import { gql } from "graphql-tag";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
  }

  type Query {
    hello: String
    users: [User]
  }
`;
