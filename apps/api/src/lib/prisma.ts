// Re-export the shared Prisma client from packages/db
// This keeps all DB access going through the single shared instance.
export { prisma } from "@peak/database";