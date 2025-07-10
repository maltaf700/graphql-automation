import gql from "graphql-tag";
export const userTypeDefs = gql`
  type User { id: ID! name: String! age: Int! post:[Post!]!}

  input CreateUserInput {
      name: String!
      age: Int!
  }

  input UpdateUserInput {
      id: ID!
      name: String!
      age: Int!
  }

  extend type Query {
      getUsers: [User!]!
      getUserById(id: ID!): User!
  }

  extend type Mutation {
      createUser(input: CreateUserInput!): User!
      updateUser(input: UpdateUserInput!): User!
      deleteUser(id: ID!): Boolean!
  }
`;