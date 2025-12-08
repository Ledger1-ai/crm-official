/*
 * AI Link Ranker (Sideloop)
 * Purpose: prioritize which internal/company URLs to visit next using heuristics + optional LLM guidance.
 * Design:
 *  - Heuristic scoring for high-yield pages (about/team/contact/leadership/careers/press)
 *  - Penalize low-yield/static assets (pdf, images, css/js, login, terms/privacy-only)
 *  - Optional LLM signal fusion when model is available
 *  - Deterministic ranking fallback when LLM is not available
 */

import { getAiSdkModel, isReasoningModel } from "@/lib/openai";

export type LinkContext = {
  icp?: {
    industries?: string[];
    geos?: string[];
    techStack?: string[];
    titles?: string[];
  };
  // known pages visited to avoid cycles
  visited?: string[];
  // any text cues extracted (e.g., meta description, snippets)
  textCues?: string[];
};

function normalize(url: string): string {
  try {
    const u = new URL(url);
    // Preserve pathname + query for ranking; lowercase host for consistency
    return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname}${u.search}`;
  } catch {
    return url.trim();
  }
}

function isStaticAsset(url: string): boolean {
  return /\.(?:pdf|jpg|jpeg|png|gif|svg|webp|css|js|zip|rar|7z|mp3|mp4|mov|avi|wmv)(?:\?|#|$)/i.test(url);
}

function containsAny(url: string, items: string[]): boolean {
  const lower = url.toLowerCase();
  return items.some((i) => lower.includes(i));
}

function baseHeuristicScore(domain: string, url: string, ctx?: LinkContext): number {
  const u = url.toLowerCase();
  let score = 0;

  // High-yield pages
  if (containsAny(u, ["/about", "/about-us", "/company", "/who-we-are"])) score += 12;
  if (containsAny(u, ["/team", "/our-team", "/leadership", "/people", "/staff"])) score += 15;
  if (containsAny(u, ["/contact", "/contact-us", "/contactus"])) score += 18;
  if (containsAny(u, ["/careers", "/jobs", "/join-us", "/work-with-us"])) score += 10;
  if (containsAny(u, ["/press", "/media", "/newsroom"])) score += 8;
  if (containsAny(u, ["/blog", "/articles"])) score += 5;
  // Org/staff directories often list emails and phones
  if (containsAny(u, ["/directory", "/staff-directory", "/team-directory"])) score += 12;
  // Contact-related keywords anywhere in path or query
  if (containsAny(u, ["email", "reach", "support", "helpdesk", "sales-contact"])) score += 3;

  // Penalize non-targets
  if (isStaticAsset(u)) score -= 25;
  if (containsAny(u, ["/login", "/signin", "/account"])) score -= 10;
  if (containsAny(u, ["/privacy", "/terms", "/cookie"])) score -= 8;
  // FAQs and generic marketing landing pages are low-yield
  if (containsAny(u, ["/faq", "/frequently-asked-questions"])) score -= 6;
  // Product/catalog/menu/strain pages tend to be low-yield for contact emails
  if (containsAny(u, ["/products", "/product", "/shop", "/store", "/catalog", "/menu", "/strains", "/strain", "/inventory"])) score -= 12;
  // Generic CTA paths/keywords should be deprioritized
  if (containsAny(u, ["discover", "submit", "stay-in-the-loop", "newsletter", "subscribe", "age-verification", "age_verification"])) score -= 10;



  // ICP nudges (e.g., geography and industry hints in path)
  if (ctx?.icp?.geos?.length) {
    for (const g of ctx.icp.geos) if (u.includes(g.toLowerCase())) score += 2;
  }
  if (ctx?.icp?.industries?.length) {
    for (const ind of ctx.icp.industries) if (u.includes(ind.toLowerCase())) score += 2;
  }

  // Avoid revisits
  if (ctx?.visited?.includes(url)) score -= 50;

  return score;
}

function buildPrompt(domain: string, urls: string[], signals: Record<string, number>, ctx?: LinkContext): string {
  const lines = urls.slice(0, 20).map((u) => `- ${u} | heuristic=${signals[u] ?? 0}`);
  const icp = ctx?.icp ? `ICP: industries=${ctx.icp.industries?.join(', ') || 'Any'}, geos=${ctx.icp.geos?.join(', ') || 'Any'}, titles=${ctx.icp.titles?.join(', ') || 'Any'}` : 'ICP: Any';
  return `You are ranking internal/company URLs for contact discovery.
Domain: ${domain}
${icp}
Signals:
${lines.join('\n')}

Goal: Return the URLs sorted from highest to lowest expected contact yield.
Consider pages likely to contain emails or leadership/team info first.
Respond with a JSON array of URLs in ranked order.`;
}

export async function rankLinks(userId: string | undefined, domain: string, urls: string[], ctx?: LinkContext): Promise<string[]> {
  const unique = Array.from(new Set(urls.map(normalize)));
  if (unique.length === 0) return [];

  // Heuristic ranking baseline
  const signals: Record<string, number> = {};
  for (const u of unique) signals[u] = baseHeuristicScore(domain, u, ctx);
  const heuristicSorted = unique.slice().sort((a, b) => (signals[b] - signals[a]));

  // Try LLM-guided ranking for an extra boost
  try {
    if (!userId) return heuristicSorted;
    const model = await getAiSdkModel(userId);
    if (!model) return heuristicSorted;

    const prompt = buildPrompt(domain, heuristicSorted.slice(0, 25), signals, ctx);
    // Lightweight text generation — keep deterministic fallback if parsing fails
    const ai = await import("ai");
    const opts: any = {
      model,
      system: "You are a pragmatic web data extraction strategist.",
      messages: [{ role: "user", content: prompt }],
    };
    // Only set temperature for non-reasoning models to avoid SDK warnings
    if (!isReasoningModel((model as any).modelId)) {
      opts.temperature = 1;
    }
    const { text } = await ai.generateText(opts);

    // Expect a JSON array of URLs; validate and filter to known set
    try {
      const arr = JSON.parse(text || "[]");
      if (Array.isArray(arr)) {
        const ranked = arr.map(normalize).filter((u) => unique.includes(u));
        // Keep any remaining not included by the model at the end by heuristic order
        const remainder = unique.filter((u) => !ranked.includes(u)).sort((a, b) => (signals[b] - signals[a]));
        return [...ranked, ...remainder];
      }
    } catch {
      // fall back to heuristic
    }
  } catch {
    // ignore LLM errors and fall back
  }

  return heuristicSorted;
}

export default { rankLinks };
