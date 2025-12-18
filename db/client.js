import { PrismaClient } from '@prisma/client';

let prismaInstance = null;

if (process.env.DATABASE_URL) {
  // Singleton to avoid exhausting DB connections in Next API routes
  const globalForPrisma = globalThis;
  prismaInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.PRISMA_LOG_QUERIES ? ['query'] : ['warn', 'error'],
    });
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;
