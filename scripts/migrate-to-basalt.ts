/**
 * Consolidate Mongo data into the BasaltCRM database using Prisma with datasource overrides.
 *
 * This script:
 * - Connects to SOURCE and TARGET Mongo databases(same cluster, different DB names)
  * - Copies all Prisma - modeled collections from SOURCE(e.g., BasaltCRM_Legacy) into TARGET(BasaltCRM)
    * - Reconciles Users by email, preserving TARGET user IDs when duplicates exist and remapping references
      * - Preserves ObjectId values when inserting new records to maintain relational integrity
        *
 * IMPORTANT
        * - Run during a maintenance window or freeze writes to avoid divergence.
 * - BACKUP your databases before running.
 *
 * Environment variables(provide via CLI when running):
 * - SOURCE_DATABASE_URL(e.g., .../BasaltCRM_Legacy?...)
  * - TARGET_DATABASE_URL(e.g., .../ledger1crm?...)
  *
 * Example run on Windows(cmd.exe):
 * set SOURCE_DATABASE_URL = "mongodb+srv://user:pass@host/BasaltCRM_Legacy?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000" && ^
 * set TARGET_DATABASE_URL = "mongodb+srv://user:pass@host/ledger1crm?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000" && ^
 * npx ts - node./ scripts / migrate - to - ledger1crm.ts
  *
 * Safety features:
 * - Skips chat collections from SOURCE(chat_Sessions, chat_Messages) since they’re already in TARGET
  * - Upserts based on id for most models
    * - Users are upserted by email to avoid unique constraint failures, with mapping to keep TARGET IDs canonical
      */

import { PrismaClient } from "@prisma/client";

type AnyRecord = Record<string, any>;

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error("Missing required env: " + name);
  }
  return v;
}

// Datasource URLs
const SOURCE_URL = envOrThrow("SOURCE_DATABASE_URL");
const TARGET_URL = envOrThrow("TARGET_DATABASE_URL");

// Two Prisma clients bound to different DBs via datasource override
const source = new PrismaClient({ datasources: { db: { url: SOURCE_URL } } });
const target = new PrismaClient({ datasources: { db: { url: TARGET_URL } } });

// Models to migrate (skip chat models from SOURCE)
const MODELS_TO_COPY = [
  "crm_Accounts",
  "crm_Leads",
  "crm_Opportunities",
  "crm_campaigns",
  "crm_Opportunities_Sales_Stages",
  "crm_Opportunities_Type",
  "crm_Contacts",
  "crm_Contracts",
  "Boards",
  "Employees",
  "ImageUpload",
  "MyAccount",
  "Invoices",
  "invoice_States",
  "Documents",
  "Documents_Types",
  "Sections",
  "crm_Industry_Type",
  "modulStatus",
  "Tasks",
  "crm_Accounts_Tasks",
  "tasksComments",
  "TodoList",
  "system_Modules_Enabled",
  "secondBrain_notions",
  "openAi_keys",
  "systemServices",
  "gpt_models",
  "crm_Lead_Pools",
  "crm_Lead_Gen_Jobs",
  "crm_Lead_Source_Events",
  "crm_Lead_Candidates",
  "crm_Contact_Candidates",
  "crm_Lead_Pools_Leads",
  "crm_Contact_Candidate_Leads",
  // DO NOT COPY from SOURCE:
  // "chat_Sessions",
  // "chat_Messages",
];

// Fields referencing Users (string ObjectId or array of ObjectId)
const USER_REF_FIELDS_BY_MODEL: Record<string, (keyof AnyRecord)[]> = {
  crm_Accounts: ["assigned_to", "createdBy", "updatedBy", "watchers"],
  crm_Leads: ["assigned_to", "createdBy", "updatedBy"],
  crm_Opportunities: ["assigned_to", "created_by", "createdBy", "updatedBy", "last_activity_by"],
  crm_campaigns: [],
  crm_Opportunities_Sales_Stages: [],
  crm_Opportunities_Type: [],
  crm_Contacts: ["assigned_to", "created_by", "createdBy", "updatedBy", "last_activity_by"],
  crm_Contracts: ["assigned_to", "createdBy", "updatedBy"],
  Boards: ["user", "createdBy", "updatedBy", "watchers"],
  Employees: [],
  ImageUpload: [],
  MyAccount: [],
  Invoices: ["last_updated_by", "assigned_user_id"],
  invoice_States: [],
  Documents: ["created_by_user", "createdBy", "assigned_user", "updatedBy"],
  Documents_Types: [],
  Sections: [],
  crm_Industry_Type: [],
  modulStatus: [],
  Tasks: ["createdBy", "updatedBy", "user"],
  crm_Accounts_Tasks: ["createdBy", "updatedBy", "user"],
  tasksComments: ["user"],
  TodoList: ["user"],
  system_Modules_Enabled: [],
  secondBrain_notions: ["user"],
  openAi_keys: ["user"],
  systemServices: [],
  gpt_models: [],
  crm_Lead_Pools: ["user"],
  crm_Lead_Gen_Jobs: ["user"],
  crm_Lead_Source_Events: [],
  crm_Lead_Candidates: [],
  crm_Contact_Candidates: [],
  crm_Lead_Pools_Leads: [],
  crm_Contact_Candidate_Leads: [],
};

type UserDoc = {
  id: string;
  email: string;
  [k: string]: any;
};

function maskUrl(u: string): string {
  return u.replace(/\/\/([^@]+)@/, "//***:***@");
}

// Map of source user id -> target user id for duplicates by email
const userIdMap = new Map<string, string>();

/**
 * Rewrites any user reference fields within a document based on userIdMap.
 * For array fields (e.g., watchers), performs element-wise mapping.
 */
function remapUserRefs(model: string, doc: AnyRecord): AnyRecord {
  const fields = USER_REF_FIELDS_BY_MODEL[model] || [];
  for (const field of fields) {
    if (!(field in doc)) continue;
    const val = doc[field as string];
    if (val == null) continue;

    if (Array.isArray(val)) {
      const remapped = val.map((v) => {
        const mapped = userIdMap.get(v);
        return mapped ? mapped : v;
      });
      // Deduplicate while preserving order
      const seen = new Set<string>();
      doc[field as string] = remapped.filter((v) => {
        if (seen.has(v)) return false;
        seen.add(v);
        return true;
      });
    } else if (typeof val === "string") {
      const mapped = userIdMap.get(val);
      if (mapped) {
        doc[field as string] = mapped;
      }
    }
  }
  return doc;
}

/**
 * Upsert (by id) generic documents for a given model.
 * - Creates if missing (preserving id)
 * - Updates if present
 */
async function upsertById(model: string, items: AnyRecord[]) {
  const delegate: any = (target as any)[model];
  if (!delegate || typeof delegate.upsert !== "function") {
    throw new Error("Target Prisma delegate not found or unsupported for model: " + model);
  }

  for (const item of items) {
    const { id, ...rest } = item;
    // Remap user refs before upserting
    const patched = remapUserRefs(model, item);
    const { id: patchedId, ...patchedRest } = patched;

    await delegate
      .upsert({
        where: { id: patchedId },
        create: { id: patchedId, ...(patchedRest as AnyRecord) },
        update: { ...(patchedRest as AnyRecord) },
      })
      .catch((e: any) => {
        console.error("[ERROR] upsertById(" + model + ") id=" + patchedId + ":", e?.message ?? e);
        throw e;
      });
  }
}

/**
 * Copy a collection from SOURCE to TARGET by fetching all documents (batched),
 * optionally remapping user references using userIdMap.
 */
async function copyModel(model: string) {
  const delegate: any = (source as any)[model];
  if (!delegate || typeof delegate.findMany !== "function") {
    console.warn("[WARN] Source Prisma delegate missing for model: " + model + " (skipping)");
    return;
  }
  console.log("[COPY] " + model + " ...");

  const BATCH = 500;
  let cursorId: string | null = null;
  let copied = 0;

  while (true) {
    let batch: AnyRecord[] = [];
    if (cursorId) {
      batch = await delegate.findMany({
        take: BATCH,
        skip: 1,
        cursor: { id: cursorId },
        orderBy: { id: "asc" },
      });
    } else {
      batch = await delegate.findMany({
        take: BATCH,
        orderBy: { id: "asc" },
      });
    }

    if (!batch.length) break;

    // Upsert into target (preserving ids)
    await upsertById(model, batch);
    copied += batch.length;
    cursorId = batch[batch.length - 1].id;

    console.log("[COPY] " + model + " copied " + copied);
    if (batch.length < BATCH) break;
  }

  console.log("[DONE] " + model + " total copied: " + copied);
}

/**
 * Reconcile Users:
 * - Build TARGET index by email
 * - For each SOURCE user:
 *   - If email missing in TARGET: insert preserving id
 *   - If email exists with different id: keep TARGET id, update TARGET fields, and add mapping sourceId -> targetId
 */
async function reconcileUsers() {
  console.log("[USERS] Reconciling Users by email ...");

  // Build TARGET index by email
  const targetUsers: UserDoc[] = await (target as any).Users.findMany();
  const targetByEmail = new Map<string, UserDoc>();
  for (const u of targetUsers) {
    if (u.email) targetByEmail.set(u.email, u);
  }

  // Process SOURCE users
  const sourceUsers: UserDoc[] = await (source as any).Users.findMany();
  let inserted = 0;
  let updated = 0;

  for (const u of sourceUsers) {
    if (!u.email) {
      console.warn("[USERS] Skipping source user without email, id=" + u.id);
      continue;
    }
    const existing = targetByEmail.get(u.email);
    if (!existing) {
      // Insert preserving source id
      await (target as any).Users
        .create({ data: u })
        .catch((e: any) => {
          console.error("[ERROR] Users.create id=" + u.id + ":", e?.message ?? e);
          throw e;
        });
      targetByEmail.set(u.email, u);
      inserted++;
    } else {
      // Duplicate by email: keep TARGET id, update missing/nullable fields
      const patch: AnyRecord = {};
      const keysToMerge = [
        "name",
        "username",
        "avatar",
        "is_admin",
        "is_account_admin",
        "userLanguage",
        "userStatus",
        "password",
        "lastLoginAt",
        "account_name",
      ];
      for (const k of keysToMerge) {
        const src = (u as AnyRecord)[k];
        const dst = (existing as AnyRecord)[k];
        if (src !== undefined && (dst === undefined || dst === null)) {
          patch[k] = src;
        }
      }
      if (Object.keys(patch).length) {
        await (target as any).Users
          .update({
            where: { id: existing.id },
            data: patch,
          })
          .catch((e: any) => {
            console.error("[ERROR] Users.update id=" + existing.id + ":", e?.message ?? e);
            throw e;
          });
        updated++;
      }
      // Record mapping: sourceId -> targetId
      if (u.id !== existing.id) {
        userIdMap.set(u.id, existing.id);
      }
    }
  }

  console.log("[USERS] Inserted: " + inserted + ", Updated: " + updated + ", Mappings: " + userIdMap.size);
}

/**
 * Main execution
 */
async function main() {
  console.log("[START] Migrate to ledger1crm");
  console.log("[SOURCE]", maskUrl(SOURCE_URL));
  console.log("[TARGET]", maskUrl(TARGET_URL));

  // Step 1: Reconcile Users first, to build userIdMap for remapping references
  await reconcileUsers();

  // Step 2: Copy all other models, remapping any user references using userIdMap
  for (const model of MODELS_TO_COPY) {
    await copyModel(model);
  }

  console.log("[SUCCESS] Migration finished");
}

main()
  .catch((e) => {
    console.error("[FATAL] Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await source.$disconnect();
    await target.$disconnect();
  });
