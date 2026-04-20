import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from the database directory since Next.js only auto-loads from project root
dotenv.config({ path: path.join(process.cwd(), 'database', '.env') });


const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
