import { PrismaClient } from '@prisma/client';

// Singleton do Prisma para ser reutilizado em toda a aplicação
export const db = new PrismaClient();
