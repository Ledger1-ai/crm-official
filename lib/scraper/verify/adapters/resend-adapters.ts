/*
 * Resend-assisted verification adapters
 * - resolveMx: optional MX lookup using Node dns (if available)
 * - detectCatchAll: conservative heuristic (non-invasive) -> returns "unknown" by default
 * - smtpProbe: non-invasive; reads DB-delivered intelligence (Resend webhook updates emailStatus)
 */
import type { VerificationOptions, MxRecord } from "../email-verify";
import { prismadbCrm } from "@/lib/prisma-crm";

let dnsAvailable = false;
let dns: any;
try {
  // Node-only; may fail in edge runtimes
  dns = require("node:dns/promises");
  dnsAvailable = !!dns;
} catch {}

export function buildResendAdapters(): VerificationOptions["adapters"] {
  return {
    resolveMx: async (domain: string): Promise<MxRecord[]> => {
      if (!dnsAvailable) return [];
      try {
        const records = await dns.resolveMx(domain);
        // Normalize shape
        return (records || []).map((r: any) => ({ exchange: r.exchange, priority: r.priority })) as MxRecord[];
      } catch {
        return [];
      }
    },

    detectCatchAll: async (_domain: string) => {
      // Non-invasive, conservative: unknown by default.
      // Future: add provider heuristics if desired.
      return "unknown" as const;
    },

    smtpProbe: async (email: string) => {
      const e = (email || "").toLowerCase();
      if (!e.includes("@")) return "unknown" as const;

      // Check Contact Candidates first
      const cc = await prismadbCrm.crm_Contact_Candidates.findFirst({
        where: { email: e },
        select: { emailStatus: true },
      });
      if (cc?.emailStatus === "VALID") return "accept" as const;
      if (cc?.emailStatus === "INVALID") return "reject" as const;

      // Check Global Persons
      const gp = await prismadbCrm.crm_Global_Persons.findFirst({
        where: { email: e },
        select: { emailStatus: true },
      });
      if (gp?.emailStatus === "VALID") return "accept" as const;
      if (gp?.emailStatus === "INVALID") return "reject" as const;

      return "unknown" as const;
    },

    now: () => Date.now(),
  };
}

export default { buildResendAdapters };
