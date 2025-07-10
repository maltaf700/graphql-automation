import { PrismaClient } from '@prisma/client';
import { Reviews } from '../types/models';
const prisma = new PrismaClient();

export const reviewsResolvers = {
  Query: {
    getReviewss: async () => await prisma.reviews.findMany(),
    getReviewsById: async (_: any, { id }: { id: string }) => await prisma.reviews.findUnique({ where: { id } }),
  },
  Mutation: {
    createReviews: async (_: any, { input }: any) => {
      return await prisma.reviews.create({ data: input });
    },
    updateReviews: async (_: any, { input }: any) => {
      const { id, ...rest } = input;
      return await prisma.reviews.update({
        where: { id },
        data: rest,
      });
    },
    deleteReviews: async (_: any, { id }: { id: string }) => {
      await prisma.reviews.delete({ where: { id } });
      return true;
    }
  }
};