import { reviewsResolvers } from "./reviewsResolvers";

export const resolvers = {
  Query: {
    ...reviewsResolvers.Query
  },
  Mutation: {
    ...reviewsResolvers.Mutation
  }
};