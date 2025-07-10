import { PrismaClient } from '@prisma/client';
import { Post } from '../types/models';
const prisma = new PrismaClient();

export const postResolvers = {
  Query: {
    getPosts: async () => await prisma.post.findMany(),
    getPostById: async (_: any, { id }: { id: string }) => await prisma.post.findUnique({ where: { id } }),
  },
  Mutation: {
    createPost: async (_: any, { input }: any) => {
      return await prisma.post.create({ data: input });
    },
    updatePost: async (_: any, { input }: any) => {
      const { id, ...rest } = input;
      return await prisma.post.update({
        where: { id },
        data: rest,
      });
    },
    deletePost: async (_: any, { id }: { id: string }) => {
      await prisma.post.delete({ where: { id } });
      return true;
    }
  },
  Post: {
    user: (parent: Post) => prisma.user.findUnique({ where: { id: parent.userId } })
  }
};