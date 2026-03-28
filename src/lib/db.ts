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
// IMPORTANT: When adding new models, increment this version
const SCHEMA_VERSION = 'v13-achievements'; // Increment this when schema changes

// ALWAYS create a new client in development to ensure new models are available
// Clear cached client if schema version changed
if (globalForPrisma.__schemaVersion !== SCHEMA_VERSION) {
  if (globalForPrisma.prisma) {
    console.log('Schema version changed, creating new Prisma client');
  }
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

// Debug: Log available models
if (typeof window === 'undefined') {
  console.log('Prisma client models:', Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$')));
}
