// Database client with query logging
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Load .env file explicitly (overrides system env)
config({ override: true })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use global prisma client in development to avoid multiple instances
export const db = globalForPrisma.prisma || new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
