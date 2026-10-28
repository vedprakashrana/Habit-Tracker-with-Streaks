import { PrismaClient } from '@prisma/client';

// Global singleton PrismaClient instance
let prisma: PrismaClient | null = null;
let isPostgresConnected = false;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prisma;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = getPrisma();
    // Quick test query to verify Postgres connectivity
    await client.$queryRaw`SELECT 1`;
    isPostgresConnected = true;
    console.log('✅ [Database] Successfully connected to PostgreSQL via Prisma.');
    return true;
  } catch (err: any) {
    isPostgresConnected = false;
    console.log(
      'ℹ️ [Database] PostgreSQL is not currently running or reachable at DATABASE_URL.'
    );
    console.log(
      '💡 [Database] Running with resilient in-memory data store with complete seed dataset so HabitFlow works instantly.'
    );
    return false;
  }
}

export function isUsingPostgres(): boolean {
  return isPostgresConnected;
}
