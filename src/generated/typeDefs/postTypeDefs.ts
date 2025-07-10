import gql from "graphql-tag";
export const postTypeDefs = gql`
  type Post {id: ID! name:String! userId:ID! user:User!}

  input CreatePostInput {
      name:String!
      userId:ID!
  }

  input UpdatePostInput {
      id: ID!
      name:String!
      userId:ID!
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