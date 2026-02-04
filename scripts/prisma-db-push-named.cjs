#!/usr/bin/env node
/* 
Prisma Mongo: ensure a database name is present for db push without changing .env

- Reads DATABASE_URL from env
- If no path database is present (e.g. mongodb+srv://user:pass@host), appends "/{PRISMA_DB_NAME}" (default: "BasaltCRM")
- Preserves existing query string (?ssl=...&retryWrites=...)
- Spawns "npx prisma db push" with the adjusted DATABASE_URL for this process only
- Keeps your .env untouched to avoid impacting auth or other services reading a different default DB

Configure via env (optional):
  PRISMA_DB_NAME        -> database name to append (default: BasaltCRM)
*/

const { spawnSync } = require("child_process");
require("dotenv").config();

function withDbName(raw, dbName) {
  try {
    // Node's URL can parse mongodb/mongodb+srv/custom protocols
    const u = new URL(raw);
    // If no db path is provided (pathname === "/" or ""), append it
    if (!u.pathname || u.pathname === "/") {
      u.pathname = `/${dbName}`;
    }
    return u.toString();
  } catch (_e) {
    // Fallback: naive append (covers edge URI formats)
    if (raw.includes("/")) {
      // Likely already has path or non-standard; do not modify to avoid breaking
      return raw;
    }
    return `${raw}/${dbName}`;
  }
}

function main() {
  const base = process.env.DATABASE_URL;
  if (!base) {
    console.error("[prisma-db-push-named] DATABASE_URL is not set in env.");
    process.exit(1);
  }

  const dbName = process.env.PRISMA_DB_NAME || "BasaltCRM";
  const adjusted = withDbName(base, dbName);

  // Informative log without leaking credentials (mask user:pass if present)
  const masked = adjusted.replace(/\/\/([^@]+)@/, "//***:***@");
  console.log(`[prisma-db-push-named] Using DATABASE_URL for push: ${masked}`);
  console.log(`[prisma-db-push-named] Target database name: ${dbName}`);

  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["prisma", "db", "push"],
    {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: adjusted },
      shell: true,
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

main();
