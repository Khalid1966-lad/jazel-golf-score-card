// Database client with query logging
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Load .env file explicitly (overrides system env)
config({ override: true })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __schemaVersion?: string
}

// Force new client - increment version when schema changes
const SCHEMA_VERSION = 'v10'; // Increment this when schema changes

// Clear cached client if schema version changed
if (globalForPrisma.__schemaVersion !== SCHEMA_VERSION) {
  globalForPrisma.prisma = undefined
  globalForPrisma.__schemaVersion = SCHEMA_VERSION
}

// Use global prisma client in development to avoid multiple instances
export const db = globalForPrisma.prisma || new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Force restart: Wed Mar 18 22:00:00 UTC 2026
