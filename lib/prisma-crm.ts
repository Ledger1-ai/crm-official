import { PrismaClient } from "@prisma/client";

/**
 * Prisma client for CRM data targeting a named database without changing .env.
 *
 * Priority of URL:
 * 1) CRM_DATABASE_URL (if provided)
 * 2) DATABASE_URL with an appended "/{PRISMA_DB_NAME}" if no db name is present
 *
 * This keeps auth/users on the default DB (used by lib/prisma.ts) while
 * CRM models (Lead Pools, Jobs, Candidates, etc.) live in a separate named DB.
 */
function computeCrmUrl(): string {
  const explicit = process.env.CRM_DATABASE_URL;
  if (explicit) return explicit;

  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error("Missing DATABASE_URL (or CRM_DATABASE_URL) for CRM Prisma client");
  }

  const dbName = process.env.PRISMA_DB_NAME || "BasaltCRM";
  try {
    const u = new URL(base);
    if (!u.pathname || u.pathname === "/") {
      u.pathname = `/${dbName}`;
    }
    return u.toString();
  } catch (_e) {
    // Fallback: if URL parsing fails (custom schemes), conservatively append if no '/' path
    if (base.includes("/")) return base;
    return `${base}/${dbName}`;
  }
}

const crmUrl = computeCrmUrl();

declare global {

  var cachedPrismaCrm: PrismaClient | undefined;
}

let prismaCrm: PrismaClient;
if (process.env.NODE_ENV === "production") {
  prismaCrm = new PrismaClient({
    datasources: { db: { url: crmUrl } },
  });
} else {
  if (!global.cachedPrismaCrm) {
    global.cachedPrismaCrm = new PrismaClient({
      datasources: { db: { url: crmUrl } },
    });
  }
  prismaCrm = global.cachedPrismaCrm;
}

export const prismadbCrm = prismaCrm;
