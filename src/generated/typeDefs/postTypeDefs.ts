import gql from "graphql-tag";
    export const postTypeDefs = gql`
    type Post { id: ID! content: String! useId:ID! user : User}

    input CreatePostInput {
    content: String!
      useId:ID!
      user : User
    }

    input UpdatePostInput {
    id: ID!
    content: String!
      useId:ID!
      user : User
    }

    extend type Query {
    getPosts: [Post!]!
    getPostById(id: ID!): Post!
    }

    extend type Mutation {
    createPost(input: CreatePostInput!): Post!
    updatePost(input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!
    }
    `;