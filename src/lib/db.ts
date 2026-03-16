// Database client with query logging
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Load .env file explicitly (overrides system env)
config({ override: true })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force new client on schema change
const SCHEMA_VERSION = 'v2'; // Increment this when schema changes

export const db =
  (globalForPrisma.prisma && (globalForPrisma as any).__schemaVersion === SCHEMA_VERSION)
    ? globalForPrisma.prisma
    : new PrismaClient({
        log: ['query'],
      })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  ;(globalForPrisma as any).__schemaVersion = SCHEMA_VERSION
}