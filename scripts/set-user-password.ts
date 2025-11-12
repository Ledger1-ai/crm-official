/**
 * One-off script to set a specific user's password in the current DATABASE_URL (ledger1crm).
 *
 * Defaults:
 *  - TARGET_EMAIL = founders@theutilitycompany.co
 *  - NEW_PASSWORD = Vishnu@123
 *
 * You can override via env when running:
 *   set TARGET_EMAIL="user@example.com" && set NEW_PASSWORD="StrongPass123!" && npx ts-node ./scripts/set-user-password.ts
 *
 * Notes:
 *  - Uses bcryptjs with 12 salt rounds (compatible with app's hashing/compare).
 *  - Normalizes email to lowercase before lookup (matches app behavior).
 *  - Performs UPDATE only; will error if user not found (to avoid accidental new record/id).
 */

import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
const { hash } = bcryptjs;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Provide it inline when running the script.");
}
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function main() {
  const emailRaw = process.env.TARGET_EMAIL || "founders@theutilitycompany.co";
  const newPasswordRaw = process.env.NEW_PASSWORD || "Vishnu@123";

  const email = String(emailRaw).trim().toLowerCase();
  const newPassword = String(newPasswordRaw).trim();

  if (!email || !newPassword) {
    throw new Error("TARGET_EMAIL and NEW_PASSWORD must be provided or use defaults.");
  }
  if (newPassword.length < 8) {
    throw new Error("NEW_PASSWORD must be at least 8 characters.");
  }

  const user = await prisma.users.findFirst({ where: { email } });
  if (!user) {
    throw new Error(`User not found for email: ${email}. Aborting update.`);
  }

  const hashed = await hash(newPassword, 12);
  await prisma.users.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  console.log(`Password updated for ${email} (user id: ${user.id}).`);
}

main()
  .catch((e) => {
    console.error("[set-user-password] Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
