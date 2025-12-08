/*
 * Scraper configuration & feature flags
 * Centralizes environment-driven flags with safe defaults.
 */

export type VerifyStage = "syntax" | "mx" | "catchAll" | "smtp";

function bool(env?: string | null, def = false): boolean {
  if (!env) return def;
  const v = env.trim().toLowerCase();
  return ["1","true","yes","on","enabled"].includes(v);
}

function int(env?: string | null, def: number = 0): number {
  const n = env ? parseInt(env, 10) : NaN;
  return Number.isFinite(n) ? n : def;
}

function stages(env?: string | null, def: VerifyStage[] = ["syntax","mx"]): VerifyStage[] {
  if (!env) return def;
  return env.split(/[,\s]+/).map(s => s.trim()).filter(Boolean) as VerifyStage[];
}

export const ScraperConfig = {
  // Email verification
  verify: {
    enabled: bool(process.env.SCRAPER_VERIFY_ENABLE, true),
    stages: stages(process.env.SCRAPER_VERIFY_STAGES, ["syntax","mx"]),
    domainTtlDays: int(process.env.SCRAPER_VERIFY_DOMAIN_TTL_DAYS, 7),
    smtpTtlDays: int(process.env.SCRAPER_VERIFY_SMTP_TTL_DAYS, 1),
    useAdapters: bool(process.env.SCRAPER_VERIFY_USE_ADAPTERS, true),
  },

  // Email pattern inference
  patternGuess: {
    enabled: bool(process.env.SCRAPER_PATTERN_ENABLE, false),
    ttlDays: int(process.env.SCRAPER_PATTERN_TTL_DAYS, 14),
    minConfidenceToAssign: Number.isFinite(Number(process.env.SCRAPER_PATTERN_MIN_CONF))
      ? Math.max(0, Math.min(1, Number(process.env.SCRAPER_PATTERN_MIN_CONF)))
      : 0.8,
  },

  // Tech detection
  tech: {
    signaturesPath: process.env.SCRAPER_TECH_SIGNATURES_PATH || "", // optional external path
  },
};

export default ScraperConfig;
