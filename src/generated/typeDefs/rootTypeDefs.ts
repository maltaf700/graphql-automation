import gql from "graphql-tag";
import { userTypeDefs } from "./userTypeDefs";
import { postTypeDefs } from "./postTypeDefs";
import { reviewsTypeDefs } from "./reviewsTypeDefs";

export const rootTypeDefs = gql`
  type Query
  type Mutation
`;

export const typeDefs = [
  rootTypeDefs,
  userTypeDefs,
  postTypeDefs,
  reviewsTypeDefs
];