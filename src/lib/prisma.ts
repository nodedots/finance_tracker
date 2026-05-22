import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { PrismaClient } from '@/generated/prisma/client';
import path from 'path';
import BetterSqlite3 from 'better-sqlite3';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || '';
  
  // If it's a Turso URL (libsql:// or https://)
  if (databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://')) {
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter });
  }

  // Fallback to local SQLite using better-sqlite3
  const dbPath = path.resolve(process.cwd(), 'dev.db');
  const betterSqlite = new BetterSqlite3(dbPath);
  const adapter = new PrismaBetterSqlite3(betterSqlite);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
