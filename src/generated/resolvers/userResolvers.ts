import { PrismaClient } from '@prisma/client';
import { User } from '../types/models';
const prisma = new PrismaClient();

export const userResolvers = {
  Query: {
    getUsers: async () => await prisma.user.findMany(),
    getUserById: async (_: any, { id }: { id: string }) => await prisma.user.findUnique({ where: { id } }),
  },
  Mutation: {
    createUser: async (_: any, { input }: any) => {
      return await prisma.user.create({ data: input });
    },
    updateUser: async (_: any, { input }: any) => {
      const { id, ...rest } = input;
      return await prisma.user.update({
        where: { id },
        data: rest,
      });
    },
    deleteUser: async (_: any, { id }: { id: string }) => {
      await prisma.user.delete({ where: { id } });
      return true;
    }
  }
};