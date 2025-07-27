import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

export { prisma }

// Helper function to handle Prisma errors
export function handlePrismaError(error: any): string {
  if (error.code === 'P2002') {
    return 'A record with this information already exists.'
  }
  if (error.code === 'P2025') {
    return 'Record not found.'
  }
  if (error.code === 'P2003') {
    return 'Invalid reference to related record.'
  }
  return 'Database operation failed. Please try again.'
} 