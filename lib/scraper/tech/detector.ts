/*
 * Tech Signatures Detector (Global)
 * Purpose: Detect technologies from page snapshot using simple signature matches.
 * Input: HTML snapshot (lowercased search), script srcs, link hrefs
 * Output: Array of canonical technology names (to be normalized by tech-normalizer.ts)
 */

import fs from "fs";
import path from "path";
import ScraperConfig from "../config";

export type TechSnapshot = {
  html?: string; // e.g., document.documentElement.outerHTML (trimmed)
  scripts?: string[]; // script src URLs
  links?: string[]; // link href URLs
  headers?: Record<string, string> | Array<[string, string]>; // optional HTTP response headers
};

// Built-in fallback signatures (kept minimal); prefer external JSON for coverage
const FALLBACK_SIGNATURES: Record<string, string[]> = {
  // Frameworks & meta frameworks
  "React": ["__reactroot", "_reactroot", "data-reactroot", "react"],
  "Vue.js": ["__vue__", "vue"],
  "Angular": ["ng-version", "ng-app", "angular"],
  "Next.js": ["__next", "/_next/"],
  "Gatsby": ["___gatsby"],
  "Svelte": ["svelte"],
  "SvelteKit": ["sveltekit"],

  // CMS / Commerce
  "WordPress": ["wp-content", "wp-includes", "wordpress"],
  "WooCommerce": ["woocommerce"],
  "Shopify": ["cdn.shopify", "shopify"],
  "Magento": ["magento"],
  "BigCommerce": ["bigcommerce"],
  "Drupal": ["drupal"],
  "Joomla": ["joomla"],
  "TYPO3": ["typo3"],
  "PrestaShop": ["prestashop"],
  "OpenCart": ["opencart"],
  "Ghost": ["ghost"],
  "Craft CMS": ["craftcms", "craft cms", "craft\x20cms"],

  // Analytics / Marketing / Support
  "HubSpot": ["hs-script", "hubspot"],
  "Google Analytics": ["gtag/js", "googletagmanager", "ga("],

  // DevOps / Infra
  "Docker": ["docker"],
  "Kubernetes": ["kubernetes"],
};

let signatureCache: Record<string, string[]> | null = null;
function loadSignatures(): Record<string, string[]> {
  if (signatureCache) return signatureCache;
  const configured = (ScraperConfig?.tech?.signaturesPath || "").trim();
  const candidatePath = configured
    ? path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured)
    : path.resolve(process.cwd(), "nextcrm-app/lib/scraper/tech/signatures.json");
  try {
    const raw = fs.readFileSync(candidatePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      signatureCache = parsed as Record<string, string[]>;
      return signatureCache;
    }
  } catch {
    // ignore and fall back
  }
  signatureCache = FALLBACK_SIGNATURES;
  return signatureCache;
}

function lower(s?: string): string { return (s || "").toLowerCase(); }

export function detectTechFromSnapshot(snapshot: TechSnapshot): string[] {
  const html = lower((snapshot.html || "").slice(0, 200000));
  const scripts = (snapshot.scripts || []).map(lower);
  const links = (snapshot.links || []).map(lower);
  // Flatten header values if provided
  let headerValues: string[] = [];
  const h: any = (snapshot as any).headers;
  if (h) {
    if (Array.isArray(h)) {
      headerValues = h.map((pair) => lower(String(pair?.[1] ?? ""))).filter(Boolean);
    } else if (typeof h === "object") {
      headerValues = Object.values(h).map((v) => lower(String(v ?? ""))).filter(Boolean);
    }
  }

  const found = new Set<string>();
  const searchTargets: string[] = [html, ...scripts, ...links, ...headerValues];
  const SIGNATURES = loadSignatures();

  for (const [tech, sigs] of Object.entries(SIGNATURES)) {
    for (const sig of sigs) {
      const needle = lower(sig);
      let matched = false;
      for (const target of searchTargets) {
        if (!target) continue;
        if (target.includes(needle)) { matched = true; break; }
      }
      if (matched) { found.add(tech); break; }
    }
  }

  return Array.from(found);
}

export default { detectTechFromSnapshot };
