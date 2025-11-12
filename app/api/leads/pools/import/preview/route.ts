import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadbCrm } from "@/lib/prisma-crm";
import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import { z } from "zod";

type CandidateNorm = {
  dedupeKey: string;
  domain?: string;
  companyName?: string;
  homepageUrl?: string;
  description?: string;
  industry?: string;
  techStack?: string[];
};

type ContactNorm = {
  dedupeKey: string; // email lowercased or synthesized
  candidateKey?: string; // candidate dedupeKey
  fullName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
};

const candidateSchema = z.object({
  dedupeKey: z.string().min(1),
  domain: z.string().optional(),
  companyName: z.string().optional(),
  homepageUrl: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  techStack: z.array(z.string()).optional(),
});

const contactSchema = z.object({
  dedupeKey: z.string().min(1),
  candidateKey: z.string().optional(),
  fullName: z.string().optional(),
  title: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().optional(),
});

// column mapping synonyms (lowercased)
const COLS = {
  companyName: ["company", "companyname", "org", "organization", "business", "account"],
  domain: ["domain", "website", "site", "companydomain", "company_domain"],
  homepageUrl: ["homepage", "url", "websiteurl", "companyurl", "company_url"],
  description: ["description", "about", "summary", "notes"],
  industry: ["industry", "sector"],
  techStack: ["techstack", "technology", "stack", "technologies"],
  fullName: ["name", "fullname", "contact", "person"],
  title: ["title", "role", "jobtitle", "position"],
  email: ["email", "emailaddress,contactemail", "contactemail"],
  phone: ["phone", "phonenumber", "contactphone", "mobile"],
  linkedinUrl: ["linkedin", "linkedinurl", "linkedin_profile"],
};

function lc(s: any): string {
  return typeof s === "string" ? s.trim() : "";
}
function getFromRow(row: Record<string, any>, keys: string[]): any {
  for (const k of keys) {
    for (const rk of Object.keys(row)) {
      if (rk.toLowerCase() === k) return row[rk];
    }
  }
  return undefined;
}

function normalizeRow(row: Record<string, any>): { candidate?: CandidateNorm; contact?: ContactNorm; usedCols: string[] } {
  const usedCols: string[] = [];

  const companyName = lc(getFromRow(row, COLS.companyName));
  if (companyName) usedCols.push("companyName");
  const domain = lc(getFromRow(row, COLS.domain)).toLowerCase();
  if (domain) usedCols.push("domain");
  const homepageUrl = lc(getFromRow(row, COLS.homepageUrl));
  if (homepageUrl) usedCols.push("homepageUrl");
  const description = lc(getFromRow(row, COLS.description));
  if (description) usedCols.push("description");
  const industry = lc(getFromRow(row, COLS.industry));
  if (industry) usedCols.push("industry");
  const techStackRaw = getFromRow(row, COLS.techStack);
  const techStack =
    typeof techStackRaw === "string"
      ? techStackRaw
          .split(/[;,]/)
          .map((s: string) => s.trim())
          .filter(Boolean)
      : Array.isArray(techStackRaw)
      ? techStackRaw.map((s: any) => String(s).trim()).filter(Boolean)
      : undefined;
  if (techStack && techStack.length) usedCols.push("techStack");

  // dedupeKey for candidate: prefer domain; else companyName|homepageUrl; else companyName
  let candidateKey = "";
  if (domain) candidateKey = domain;
  else if (companyName && homepageUrl) candidateKey = `${companyName.toLowerCase()}|${homepageUrl.toLowerCase()}`;
  else if (companyName) candidateKey = companyName.toLowerCase();

  const candidate =
    candidateKey
      ? {
          dedupeKey: candidateKey,
          domain: domain || undefined,
          companyName: companyName || undefined,
          homepageUrl: homepageUrl || undefined,
          description: description || undefined,
          industry: industry || undefined,
          techStack,
        }
      : undefined;

  const fullName = lc(getFromRow(row, COLS.fullName));
  if (fullName) usedCols.push("fullName");
  const title = lc(getFromRow(row, COLS.title));
  if (title) usedCols.push("title");
  const email = lc(getFromRow(row, COLS.email)).toLowerCase();
  if (email) usedCols.push("email");
  const phone = lc(getFromRow(row, COLS.phone));
  if (phone) usedCols.push("phone");
  const linkedinUrl = lc(getFromRow(row, COLS.linkedinUrl));
  if (linkedinUrl) usedCols.push("linkedinUrl");

  // contact dedupeKey: prefer email; else fullName|linkedin; else fullName|candidateKey
  let contactKey = "";
  if (email) contactKey = email;
  else if (fullName && linkedinUrl) contactKey = `${fullName.toLowerCase()}|${linkedinUrl.toLowerCase()}`;
  else if (fullName && candidateKey) contactKey = `${fullName.toLowerCase()}|${candidateKey}`;

  const contact =
    contactKey
      ? {
          dedupeKey: contactKey,
          candidateKey: candidateKey || undefined,
          fullName: fullName || undefined,
          title: title || undefined,
          email: email || undefined,
          phone: phone || undefined,
          linkedinUrl: linkedinUrl || undefined,
        }
      : undefined;

  return { candidate, contact, usedCols };
}

function bufferToRows(fileName: string | undefined, buffer: Buffer): Record<string, any>[] {
  const name = (fileName || "").toLowerCase();
  if (name.endsWith(".xlsx")) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, any>[];
    return rows;
  }
  // assume CSV
  const text = buffer.toString("utf8");
  const rows = parse(text, { columns: true, skip_empty_lines: true }) as Record<string, any>[];
  return rows;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const poolIdRaw = form.get("poolId");
    const newPoolName = (form.get("newPoolName") as string | null) || null;
    const newPoolDescription = (form.get("newPoolDescription") as string | null) || null;

    const poolId = poolIdRaw ? String(poolIdRaw) : "";
    const isNewPool = !poolId;

    if (!file || (!poolId && !newPoolName)) {
      return new NextResponse("Missing file and either poolId or newPoolName", { status: 400 });
    }

    // verify pool ownership only if using existing pool
    if (!isNewPool) {
      const pool = await (prismadbCrm as any).crm_Lead_Pools.findFirst({
        where: { id: poolId, user: session.user.id },
        select: { id: true },
      });
      if (!pool) {
        return new NextResponse("Lead Pool not found", { status: 404 });
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rows = bufferToRows((file as any).name, buffer);

    const usedColsSet = new Set<string>();
    const corruptRows: { index: number; errors: string[] }[] = [];

    // Detect duplicates within this import
    const seenCandidate = new Set<string>();
    const seenContact = new Set<string>();

    const creates = { candidates: [] as any[], contacts: [] as any[] };
    const updates = { candidates: [] as any[], contacts: [] as any[] };

    let validCandidates = 0;
    let validContacts = 0;
    let dupCandidates = 0;
    let dupContacts = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const { candidate, contact, usedCols } = normalizeRow(row);
      usedCols.forEach((c) => usedColsSet.add(c));

      const rowErrors: string[] = [];

      // Candidate
      if (candidate) {
        const parsed = candidateSchema.safeParse(candidate);
        if (!parsed.success) {
          rowErrors.push("Invalid company row: " + parsed.error.message);
        } else {
          const key = candidate.dedupeKey;
          if (seenCandidate.has(key)) {
            dupCandidates++;
          } else {
            seenCandidate.add(key);

            if (!isNewPool) {
              // find existing candidate in pool
              const existing = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
                where: { pool: poolId, dedupeKey: key },
                select: {
                  id: true,
                  domain: true,
                  companyName: true,
                  homepageUrl: true,
                  description: true,
                  industry: true,
                  techStack: true,
                },
              });
              const changes: Record<string, { from: any; to: any }> = {};
              if (existing) {
                const fields: (keyof CandidateNorm)[] = ["domain", "companyName", "homepageUrl", "description", "industry", "techStack"];
                for (const f of fields) {
                  const fromVal = (existing as any)[f];
                  const toVal = (candidate as any)[f];
                  const same =
                    Array.isArray(fromVal) && Array.isArray(toVal)
                      ? JSON.stringify(fromVal) === JSON.stringify(toVal)
                      : (fromVal ?? "") === (toVal ?? "");
                  if (!same) {
                    changes[f as string] = { from: fromVal, to: toVal };
                  }
                }
                updates.candidates.push({ ...candidate, existingId: existing.id, changes });
              } else {
                creates.candidates.push({ ...candidate, existingId: null });
              }
            } else {
              // new pool => no existing data to compare; treat as create
              creates.candidates.push({ ...candidate, existingId: null });
            }
            validCandidates++;
          }
        }
      }

      // Contact
      if (contact) {
        const parsed = contactSchema.safeParse(contact);
        if (!parsed.success) {
          rowErrors.push("Invalid contact row: " + parsed.error.message);
        } else {
          const key = contact.dedupeKey;
          if (seenContact.has(key)) {
            dupContacts++;
          } else {
            seenContact.add(key);

            if (!isNewPool) {
              // If contact maps to a candidateKey, check if candidate exists
              let candidateId: string | null = null;
              if (contact.candidateKey) {
                const candExisting = await (prismadbCrm as any).crm_Lead_Candidates.findFirst({
                  where: { pool: poolId, dedupeKey: contact.candidateKey },
                  select: { id: true },
                });
                candidateId = candExisting?.id ?? null;
              }

              const existing = await (prismadbCrm as any).crm_Contact_Candidates.findFirst({
                where: {
                  dedupeKey: key,
                  ...(candidateId ? { leadCandidate: candidateId } : {}),
                },
                select: {
                  id: true,
                  fullName: true,
                  title: true,
                  email: true,
                  phone: true,
                  linkedinUrl: true,
                },
              });

              const changes: Record<string, { from: any; to: any }> = {};
              if (existing) {
                const fields: (keyof ContactNorm)[] = ["fullName", "title", "email", "phone", "linkedinUrl"];
                for (const f of fields) {
                  const fromVal = (existing as any)[f];
                  const toVal = (contact as any)[f];
                  const same = (fromVal ?? "") === (toVal ?? "");
                  if (!same) {
                    changes[f as string] = { from: fromVal, to: toVal };
                  }
                }
                updates.contacts.push({ ...contact, existingId: existing.id, changes });
              } else {
                creates.contacts.push({ ...contact, existingId: null });
              }
            } else {
              // new pool => no existing data
              creates.contacts.push({ ...contact, existingId: null });
            }
            validContacts++;
          }
        }
      }

      if (rowErrors.length) {
        corruptRows.push({ index: i, errors: rowErrors });
      }
    }

    const response = {
      poolId: isNewPool ? null : poolId,
      poolName: isNewPool ? newPoolName : undefined,
      poolMode: isNewPool ? "new" : "existing",
      mapping: {
        usedColumns: Array.from(usedColsSet),
        unmappedColumns: Object.keys(rows[0] || {})
          .map((k) => k.toLowerCase())
          .filter((k) => !Array.from(usedColsSet).includes(k)),
      },
      stats: {
        totalRows: rows.length,
        validCandidates,
        validContacts,
        corruptRows: corruptRows.length,
        duplicates: { candidate: dupCandidates, contact: dupContacts },
        creates: { candidate: creates.candidates.length, contact: creates.contacts.length },
        updates: { candidate: updates.candidates.length, contact: updates.contacts.length },
      },
      creates,
      updates,
      corruptRows,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("[LEADS_POOLS_IMPORT_PREVIEW]", error);
    return new NextResponse(error?.message || "Failed to preview import", { status: 500 });
  }
}
