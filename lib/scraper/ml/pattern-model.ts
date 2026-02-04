/*
 * Per-domain email pattern inference with Bayesian priors
 * - Learns domain-specific naming patterns from observed (name,email) pairs
 * - Supports common schemes: first.last, f.last, firstl, first, lastf, last, first_last, first-last
 * - Persists learned distributions to a JSON store with TTL and lastUpdated
 * - Generates high-confidence guesses with provenance and confidence
 */

import fs from "fs";
import path from "path";

export type PatternName =
  | "first.last"
  | "f.last"
  | "flast"
  | "firstl"
  | "first"
  | "lastf"
  | "last"
  | "first_last"
  | "first-last";

export type DomainPattern = {
  domain: string;
  distribution: Record<PatternName, number>; // normalized probabilities
  lastUpdated: string; // ISO
  ttlMs: number;
};

export type GuessResult = {
  email: string;
  confidence: number; // 0..1 posterior probability
  pattern: PatternName;
  provenance: { source: "pattern_model"; domain: string };
};

const DEFAULT_PRIOR: Record<PatternName, number> = {
  "first.last": 0.36,
  "f.last": 0.18,
  "flast": 0.18,
  "firstl": 0.08,
  "first": 0.06,
  "lastf": 0.05,
  "last": 0.04,
  "first_last": 0.03,
  "first-last": 0.02,
};

const PRIOR_WEIGHT = 3; // Bayesian alpha weight applied to prior counts

// File-based persistence
const STORE_PATH = path.resolve(process.cwd(), "basaltcrm-app/lib/scraper/ml/pattern-store.json");

type StoreShape = { [domain: string]: DomainPattern };
let storeCache: StoreShape | null = null;

function safeLowerLetters(input: string): string {
  return (input || "").normalize("NFKD").replace(/[^a-zA-Z\s'-]/g, "").toLowerCase();
}

function normalizeName(name?: string | null): { first: string; last: string } | null {
  if (!name) return null;
  const s = safeLowerLetters(String(name));
  const tokens = s.split(/[\s'-]+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  if (!first || !last) return null;
  return { first, last };
}

function localForPattern(p: PatternName, first: string, last: string): string {
  switch (p) {
    case "first.last":
      return `${first}.${last}`;
    case "f.last":
      return `${first[0]}${last ? `.${last}` : ""}`;
    case "flast":
      return `${first[0]}${last}`;
    case "firstl":
      return `${first}${last ? last[0] : ""}`;
    case "first":
      return `${first}`;
    case "lastf":
      return `${last}${first ? first[0] : ""}`;
    case "last":
      return `${last}`;
    case "first_last":
      return `${first}_${last}`;
    case "first-last":
      return `${first}-${last}`;
  }
}

function localPart(email: string): string {
  const at = email.indexOf("@");
  const lp = at >= 0 ? email.slice(0, at) : email;
  // Ignore plus addressing to improve matching
  return lp.split("+")[0].toLowerCase();
}

function matchPattern(p: PatternName, first: string, last: string, email: string): boolean {
  const target = localPart(email);
  const candidate = localForPattern(p, first, last).toLowerCase();
  return target === candidate;
}

function ensureStore(): StoreShape {
  if (storeCache) return storeCache;
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    storeCache = JSON.parse(raw || "{}");
  } catch {
    storeCache = {};
  }
  return storeCache!;
}

function persistStore(): void {
  if (!storeCache) return;
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(storeCache, null, 2), "utf-8");
  } catch (e) {
    // Non-fatal
    console.warn("Pattern store persist failed:", (e as Error).message);
  }
}

import { classifyEmail } from "../quality/email-filters";

export function learnDomainPatterns(domain: string, pairs: Array<{ name: string; email: string }>, ttlMs: number): DomainPattern {
  const store = ensureStore();
  const counts: Record<PatternName, number> = {
    "first.last": 0,
    "f.last": 0,
    "flast": 0,
    "firstl": 0,
    "first": 0,
    "lastf": 0,
    "last": 0,
    "first_last": 0,
    "first-last": 0,
  };

  for (const p of pairs || []) {
    // Skip role/generic/test emails to avoid biasing patterns
    if (classifyEmail(p.email) !== "personal") continue;
    const tokens = normalizeName(p.name);
    if (!tokens) continue;
    const { first, last } = tokens;
    (Object.keys(counts) as PatternName[]).forEach((pat) => {
      if (matchPattern(pat, first, last, p.email)) counts[pat] += 1;
    });
  }

  const totalObserved = Object.values(counts).reduce((a, b) => a + b, 0);
  const posterior: Record<PatternName, number> = { ...counts } as any;
  let sum = 0;
  (Object.keys(posterior) as PatternName[]).forEach((pat) => {
    const value = counts[pat] + PRIOR_WEIGHT * (DEFAULT_PRIOR[pat] || 0);
    posterior[pat] = value;
    sum += value;
  });
  // Normalize
  (Object.keys(posterior) as PatternName[]).forEach((pat) => {
    posterior[pat] = sum > 0 ? posterior[pat] / sum : DEFAULT_PRIOR[pat] || 0;
  });

  const model: DomainPattern = {
    domain,
    distribution: posterior,
    lastUpdated: new Date().toISOString(),
    ttlMs,
  };

  store[domain] = model;
  persistStore();
  return model;
}

export function getDomainPattern(domain: string): DomainPattern | null {
  const store = ensureStore();
  const entry = store[domain];
  if (!entry) return null;
  const expired = Date.now() - new Date(entry.lastUpdated).getTime() > (entry.ttlMs || 0);
  if (expired) return null;
  return entry;
}

export function guessEmailForName(domain: string, name: string, limit: number = 3): GuessResult[] {
  const tokens = normalizeName(name);
  if (!tokens) return [];
  const { first, last } = tokens;
  const model = getDomainPattern(domain);
  const dist = model?.distribution || DEFAULT_PRIOR;

  const candidates: GuessResult[] = [];
  (Object.keys(dist) as PatternName[]).forEach((pat) => {
    const local = localForPattern(pat, first, last);
    const email = `${local}@${domain}`;
    candidates.push({
      email,
      confidence: dist[pat] || 0,
      pattern: pat,
      provenance: { source: "pattern_model", domain },
    });
  });

  candidates.sort((a, b) => (b.confidence - a.confidence));
  return candidates.slice(0, Math.max(1, limit));
}

const patternModel = {
  learnDomainPatterns,
  getDomainPattern,
  guessEmailForName,
};

export default patternModel;
