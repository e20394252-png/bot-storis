import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | undefined;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    });
  }
  return prisma;
}
