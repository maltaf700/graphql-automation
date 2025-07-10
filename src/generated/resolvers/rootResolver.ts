import { userResolvers } from "./userResolvers";
import { postResolvers } from "./postResolvers";
import { reviewsResolvers } from "./reviewsResolvers";

export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...postResolvers.Query,
    ...reviewsResolvers.Query
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...postResolvers.Mutation,
    ...reviewsResolvers.Mutation
  },
  User: { ...userResolvers.User },
  Post: { ...postResolvers.Post }
};