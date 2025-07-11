import gql from "graphql-tag";
    import { reviewsTypeDefs } from "./reviewsTypeDefs";
import { userTypeDefs } from "./userTypeDefs";
import { postTypeDefs } from "./postTypeDefs";

    export const rootTypeDefs = gql`
    type Query
    type Mutation
    `;

    export const typeDefs = [
    rootTypeDefs,
    reviewsTypeDefs,
  userTypeDefs,
  postTypeDefs
    ];