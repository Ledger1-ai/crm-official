/*
 * Email Verification Stubs (Global)
 * Non-invasive verification pipeline scaffolding with pluggable resolvers and caching.
 * Stages:
 *  - syntax: basic RFC-like format validation
 *  - mx: resolve MX records for recipient domain
 *  - catchAll: attempt to detect catch-all domains (safe heuristics placeholder)
 *  - smtp: polite SMTP handshake probe (stubbed – do not initiate network here)
 *
 * Notes:
 *  - This module is designed to be side-effect free in code generation; network logic should be injected
 *    via adapters when running in a worker or job context.
 *  - Provide caching to avoid repeated checks for the same domain/email (TTL-based).
 */

import { isValidEmailFormat, normalizeEmail, getDomainPart } from "../quality/email-filters";

export type VerificationStage = "syntax" | "mx" | "catchAll" | "smtp";
export type VerificationStatus = "valid" | "risky" | "invalid" | "unknown";

export type MxRecord = { exchange: string; priority: number };

export type VerificationOptions = {
  stages?: VerificationStage[]; // default: ["syntax", "mx"]
  // TTL controls: prefer explicit domainTtlMs/smtpTtlMs; fallback to cacheTtlMs for domain and internal default for smtp
  cacheTtlMs?: number; // legacy: domain-level TTL
  domainTtlMs?: number; // explicit domain-level cache TTL (MX/catch-all)
  smtpTtlMs?: number; // explicit email-level cache TTL (SMTP probe)
  adapters?: {
    // Adapter to resolve MX records for a domain
    resolveMx?: (domain: string) => Promise<MxRecord[]>;
    // Adapter to perform a non-invasive catch-all test
    detectCatchAll?: (domain: string) => Promise<"yes" | "no" | "unknown">;
    // Adapter to attempt an SMTP handshake without sending mail
    smtpProbe?: (email: string) => Promise<"accept" | "reject" | "unknown">;
    // Time provider (useful for deterministic tests)
    now?: () => number;
  };
};

export type VerificationResult = {
  email: string;
  domain: string;
  status: VerificationStatus;
  reasons: string[]; // human-readable reasons supporting status
  steps: {
    syntax?: { ok: boolean };
    mx?: { ok: boolean; records?: MxRecord[] };
    catchAll?: { ok: boolean; value: "yes" | "no" | "unknown" };
    smtp?: { ok: boolean; value: "accept" | "reject" | "unknown" };
  };
  checkedAt: string; // ISO timestamp
  ttlMs?: number;
};

// Simple in-memory cache interfaces (can be swapped with Redis/Prisma persistence)
const domainCache = new Map<string, { mx?: MxRecord[]; catchAll?: "yes" | "no" | "unknown"; expiry: number }>();
const emailCache = new Map<string, { smtp?: "accept" | "reject" | "unknown"; expiry: number }>();

function nowMs(opts?: VerificationOptions): number {
  return opts?.adapters?.now ? opts.adapters.now() : Date.now();
}

function getDefaultStages(): VerificationStage[] {
  return ["syntax", "mx"]; // conservative defaults
}

function getDefaultDomainTtl(stages: VerificationStage[]): number {
  // Domain-level data (MX/catch-all) changes infrequently
  return 1000 * 60 * 60 * 24 * 7; // 7 days
}

function getDefaultSmtpTtl(): number {
  // Email-level (SMTP) is shorter-lived
  return 1000 * 60 * 60 * 24 * 1; // 1 day
}

export async function verifyEmail(emailInput?: string | null, options: VerificationOptions = {}): Promise<VerificationResult> {
  const email = normalizeEmail(emailInput || "");
  const domain = getDomainPart(email);
  const stages = options.stages && options.stages.length ? options.stages : getDefaultStages();
  const domainTtl = options.domainTtlMs ?? options.cacheTtlMs ?? getDefaultDomainTtl(stages);
  const smtpTtl = options.smtpTtlMs ?? getDefaultSmtpTtl();
  const ts = new Date(nowMs(options)).toISOString();

  const result: VerificationResult = {
    email,
    domain,
    status: "unknown",
    reasons: [],
    steps: {},
    checkedAt: ts,
    ttlMs: domainTtl,
  };

  // Stage: syntax
  if (stages.includes("syntax")) {
    const ok = !!email && isValidEmailFormat(email) && !!domain;
    result.steps.syntax = { ok };
    if (!ok) {
      result.status = "invalid";
      result.reasons.push("Invalid email format");
      return result;
    }
  }

  // Stage: MX (with caching)
  if (stages.includes("mx")) {
    let mxRecords: MxRecord[] | undefined;
    const cached = domainCache.get(domain);
    const fresh = cached && cached.expiry > nowMs(options) && cached.mx && cached.mx.length > 0;
    if (fresh) {
      mxRecords = cached!.mx;
    } else if (options.adapters?.resolveMx) {
      try {
        const records = await options.adapters.resolveMx(domain);
        mxRecords = records?.slice().sort((a, b) => a.priority - b.priority) || [];
        domainCache.set(domain, { ...(cached || {}), mx: mxRecords, expiry: nowMs(options) + domainTtl });
      } catch (e) {
        result.reasons.push(`MX resolution failed: ${(e as Error).message}`);
      }
    } else {
      result.reasons.push("MX adapter not provided (skipped)");
    }
    const ok = Array.isArray(mxRecords) && mxRecords.length > 0;
    result.steps.mx = { ok, records: mxRecords };
    if (!ok) {
      result.status = "risky"; // some valid domains are catch-all via provider without classic MX
      result.reasons.push("No MX records found");
    }
  }

  // Stage: Catch-all (domain-level heuristic)
  if (stages.includes("catchAll")) {
    let value: "yes" | "no" | "unknown" = "unknown";
    const cached = domainCache.get(domain);
    const fresh = cached && cached.expiry > nowMs(options) && cached.catchAll !== undefined;
    if (fresh) {
      value = cached!.catchAll!;
    } else if (options.adapters?.detectCatchAll) {
      try {
        value = await options.adapters.detectCatchAll(domain);
        domainCache.set(domain, { ...(cached || {}), catchAll: value, expiry: nowMs(options) + domainTtl });
      } catch (e) {
        result.reasons.push(`Catch-all detection failed: ${(e as Error).message}`);
      }
    } else {
      result.reasons.push("Catch-all adapter not provided (skipped)");
    }
    result.steps.catchAll = { ok: value !== "unknown", value };
    if (value === "yes") {
      result.status = result.status === "invalid" ? "invalid" : "risky";
      result.reasons.push("Domain appears to accept all emails");
    }
  }

  // Stage: SMTP probe (email-level; cached)
  if (stages.includes("smtp")) {
    let value: "accept" | "reject" | "unknown" = "unknown";
    const cached = emailCache.get(email);
    const fresh = cached && cached.expiry > nowMs(options) && cached.smtp !== undefined;
    if (fresh) {
      value = cached!.smtp!;
    } else if (options.adapters?.smtpProbe) {
      try {
        value = await options.adapters.smtpProbe(email);
        emailCache.set(email, { smtp: value, expiry: nowMs(options) + smtpTtl });
      } catch (e) {
        result.reasons.push(`SMTP probe failed: ${(e as Error).message}`);
      }
    } else {
      result.reasons.push("SMTP adapter not provided (skipped)");
    }
    result.steps.smtp = { ok: value !== "unknown", value };
    if (value === "accept") {
      // if syntax and MX passed, upgrade to valid; otherwise risky
      const syntaxOk = result.steps.syntax?.ok !== false;
      const mxOk = result.steps.mx?.ok !== false;
      result.status = syntaxOk && mxOk ? "valid" : "risky";
    } else if (value === "reject") {
      result.status = "invalid";
      result.reasons.push("SMTP recipient rejected");
    }
  }

  // Final status if not decided by later stages
  if (result.status === "unknown") {
    const syntaxOk = result.steps.syntax?.ok !== false;
    const mxOk = result.steps.mx?.ok !== false;
    if (syntaxOk && mxOk) result.status = "risky"; // without deeper checks, assume risky but usable
  }

  return result;
}

export default { verifyEmail };
