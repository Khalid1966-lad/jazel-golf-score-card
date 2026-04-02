// Database client with query logging
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Load .env file explicitly (overrides system env)
config({ override: true })

// Create a fresh PrismaClient instance
// In development, we don't cache to ensure schema changes are picked up
const createPrismaClient = () => {
  return new PrismaClient({
    log: ['query'],
  })
}

// Export the database client
export const db = createPrismaClient()
