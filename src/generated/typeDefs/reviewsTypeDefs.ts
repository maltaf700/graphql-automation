import gql from "graphql-tag";
export const reviewsTypeDefs = gql`
  type Reviews { id: ID! name: String!}

  input CreateReviewsInput {
      name: String!
  }

  input UpdateReviewsInput {
      id: ID!
      name: String!
  }

  extend type Query {
      getReviewss: [Reviews!]!
      getReviewsById(id: ID!): Reviews!
  }

  extend type Mutation {
      createReviews(input: CreateReviewsInput!): Reviews!
      updateReviews(input: UpdateReviewsInput!): Reviews!
      deleteReviews(id: ID!): Boolean!
  }
`;