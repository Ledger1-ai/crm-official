import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

let prismaInstance = globalForPrisma.prisma;

// Check if the current instance is stale (missing the new model)
if (prismaInstance && (!(prismaInstance as any).dashboardPreference || !(prismaInstance as any).navigationConfig)) {
  console.log("Resetting stale Prisma client (missing dashboardPreference or navigationConfig)");
  prismaInstance = undefined as any;
}

export const prismadb = prismaInstance || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismadb;
}
// End of file - Triggering reload for new models

