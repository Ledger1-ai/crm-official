import { launchBrowser, newPageWithDefaults, closeBrowser } from "@/lib/browser";
import { prismadbCrm } from "@/lib/prisma-crm";
import { generateAISearchQueries } from "./ai-helpers";
import { runGoogleSearchForJob } from "./google-search";

type ICPConfig = {
  industries?: string[];
  companySizes?: string[];
  geos?: string[];
  techStack?: string[];
  titles?: string[];
  languages?: string[];
  excludeDomains?: string[];
  notes?: string;
  limits?: {
    maxCompanies?: number;
    maxContactsPerCompany?: number;
  };
};

type LeadGenJob = {
  id: string;
  pool: string;
  user: string;
  providers?: { serp?: boolean; [k: string]: any };
  queryTemplates?: { base?: string[] };
  counters?: Record<string, number>;
  logs?: any[];
};

type SerpResult = {
  title: string;
  href: string;
  domain: string | null;
};

/**
 * Build queries by expanding templates with ICP config.
 * Limits the number of queries to avoid explosion.
 */
function buildQueries(templates: string[], icp: ICPConfig, maxQueries = 30): string[] {
  const pick = (vals?: string[], fallback = ""): string[] =>
    vals && vals.length ? vals.slice(0, 3) : fallback ? [fallback] : [""];

  const industries = pick(icp.industries, "");
  const geos = pick(icp.geos, "");
  const techs = pick(icp.techStack, "");
  const titles = pick(icp.titles, "");
  const languages = pick(icp.languages, "");

  const out: string[] = [];
  for (const tpl of templates) {
    for (const ind of industries) {
      for (const geo of geos) {
        for (const tech of techs) {
          for (const title of titles) {
            for (const lang of languages) {
              let q = tpl
                .replace(/{industry}/g, ind)
                .replace(/{geo}/g, geo)
                .replace(/{tech}/g, tech)
                .replace(/{title}/g, title)
                .replace(/{language}/g, lang);
              q = q.replace(/\s+/g, " ").trim();
              if (!q) continue;
              out.push(q);
              if (out.length >= maxQueries) return dedupe(out);
            }
          }
        }
      }
    }
  }
  return dedupe(out);
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function getDomainFromUrl(href: string | null | undefined): string | null {
  if (!href) return null;
  try {
    const u = new URL(href);
    return u.hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

// Normalization & aggregation helpers
function normalizeDomain(d: string): string {
  return d.trim().toLowerCase().replace(/^www\./i, "");
}

function canonicalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    // strip trailing slashes and query params (tracking)
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    return url.toString();
  } catch {
    return u;
  }
}

function deriveCompanyName(domain: string): string {
  const parts = domain.split(".");
  const base = (parts[0] || domain).replace(/[-_]/g, " ");
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

function computeCompanyDedupeKey(domain: string): string {
  return `company:${normalizeDomain(domain)}`;
}

function mergeProvenance(prev: any, addition: any): any {
  try {
    const p = prev && typeof prev === "object" ? prev : {};
    const sources = Array.isArray(p.sources) ? p.sources : [];
    return { ...p, sources: [...sources, { ...addition, ts: new Date().toISOString() }] };
  } catch {
    return addition;
  }
}

/**
 * Perform a DuckDuckGo HTML search to avoid heavy anti-bot measures.
 * Extract top result links and domains.
 * Now with progressive fallback to ensure results.
 */
async function ddgSearch(query: string): Promise<SerpResult[]> {
  const browser = await launchBrowser();
  try {
    const page = await newPageWithDefaults(browser);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    
    // Wait for content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try multiple selectors (DDG structure may vary)
    const results = await page.evaluate(() => {
      const extracted: Array<{ title: string; href: string }> = [];
      
      // Try multiple selector patterns
      const selectors = [
        'a.result__a',           // Classic DDG HTML
        'article h2 a',          // Alternative structure
        '.result__title a',      // Another variant
        'a[href*="http"]'        // Generic fallback
      ];
      
      for (const selector of selectors) {
        const links = document.querySelectorAll(selector);
        if (links.length > 0) {
          links.forEach((link, idx) => {
            if (idx < 25) { // Get more results
              const anchor = link as HTMLAnchorElement;
              const href = anchor.href;
              // Filter out DDG internal links
              if (href && !href.includes('duckduckgo.com') && 
                  (href.startsWith('http://') || href.startsWith('https://'))) {
                extracted.push({
                  title: (anchor.textContent || '').trim(),
                  href: href
                });
              }
            }
          });
          if (extracted.length > 0) break; // Found results, stop trying selectors
        }
      }
      
      return extracted;
    });

    const withDomains: SerpResult[] = results.map((r) => ({
      ...r,
      domain: ((): string | null => {
        try {
          const u = new URL(r.href);
          let hostname = u.hostname.replace(/^www\./i, "");
          // Filter out common non-company domains
          const excludePatterns = ['wikipedia.org', 'youtube.com', 'facebook.com', 
                                   'twitter.com', 'linkedin.com', 'instagram.com',
                                   'reddit.com', 'medium.com', 'github.com'];
          if (excludePatterns.some(p => hostname.includes(p))) {
            return null;
          }
          return hostname;
        } catch {
          return null;
        }
      })(),
    }));

    return withDomains.filter(r => r.domain !== null);
  } catch (error) {
    console.error(`DDG search error for "${query}":`, error);
    return [];
  } finally {
    await closeBrowser(browser);
  }
}

/**
 * Run SERP scraping for a job and persist:
 * - Lead source events (one per query, summarizing domains)
 * - Lead candidates (unique domains) for the job's pool
 */
export async function runSerpScraperForJob(jobId: string, userId?: string): Promise<{
  createdCandidates: number;
  sourceEvents: number;
  uniqueDomains: string[];
}> {
  const db: any = prismadbCrm;

  // Fetch job and pool ICP
  const job: LeadGenJob | null = await db.crm_Lead_Gen_Jobs.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      pool: true,
      user: true,
      providers: true,
      queryTemplates: true,
      counters: true,
      logs: true,
    },
  });
  if (!job) throw new Error("Job not found for SERP");

  const effectiveUserId = userId || job.user;
  
  const pool = await db.crm_Lead_Pools.findUnique({
    where: { id: job.pool },
    select: { id: true, icpConfig: true },
  });
  const icp: ICPConfig = (pool?.icpConfig as ICPConfig) || {};

  // Try AI-powered query generation first
  const maxCompanies = icp.limits?.maxCompanies ?? 100;
  let queries: string[] = [];
  
  const useAI = job.providers?.aiQueries !== false;
  if (useAI && effectiveUserId) {
    try {
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs || []),
            { ts: new Date().toISOString(), msg: "Generating AI-powered search queries..." },
          ],
        },
      });
      
      queries = await generateAISearchQueries(icp, effectiveUserId, Math.min(15, Math.ceil(maxCompanies / 5)));
      
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs || []),
            { ts: new Date().toISOString(), msg: `Generated ${queries.length} AI queries` },
          ],
        },
      });
    } catch (error) {
      console.error("AI query generation failed:", error);
    }
  }
  
  // Fallback to template-based queries if AI fails or disabled
  const templates =
    (job.queryTemplates?.base && job.queryTemplates.base.length
      ? job.queryTemplates.base
      : [
          "site:linkedin.com/company {industry} {geo}",
          "site:crunchbase.com/organization {industry} {geo}",
          "{industry} companies in {geo} using {tech}",
        ]);
  
  if (queries.length === 0) {
    queries = buildQueries(templates, icp, Math.min(30, Math.max(5, Math.ceil(maxCompanies / 3))));
  }

  let createdCandidates = 0;
  let sourceEvents = 0;
  let allDomains: string[] = [];
  const exclude = new Set((icp.excludeDomains || []).map((d) => d.toLowerCase()));

  // Use DuckDuckGo as primary search method
  await db.crm_Lead_Gen_Jobs.update({
    where: { id: jobId },
    data: {
      logs: [
        ...(job.logs || []),
        { ts: new Date().toISOString(), msg: "Starting DuckDuckGo search..." },
      ],
    },
  });

  // Rate limiting between queries
  const perQueryDelayMs = Number(process.env.SCRAPER_QUERY_DELAY_MS || 1500);
  
  // Progressive loosening: If we don't find enough results, try broader queries
  let attemptLevel = 0;
  const maxAttempts = 3;
  
  while (attemptLevel < maxAttempts && allDomains.length < Math.min(10, maxCompanies)) {
    if (attemptLevel > 0) {
      // Log that we're loosening search
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs || []),
            { ts: new Date().toISOString(), msg: `Loosening search criteria (attempt ${attemptLevel + 1}/${maxAttempts})...` },
          ],
        },
      });
      
      // Generate broader queries for next attempt
      if (attemptLevel === 1) {
        // Remove tech stack requirement
        const broaderICP = { ...icp, techStack: [] };
        queries = buildQueries(templates, broaderICP, 15);
      } else if (attemptLevel === 2) {
        // Use generic fallback queries
        const industry = icp.industries?.[0] || "companies";
        const geo = icp.geos?.[0] || "United States";
        queries = [
          `${industry} companies`,
          `${industry} startups`,
          `${industry} businesses in ${geo}`,
          `top ${industry} companies`,
          `best ${industry} firms`
        ];
      }
    }

  for (const q of queries) {
    let results: SerpResult[] = [];
    try {
      results = await ddgSearch(q);
    } catch (err) {
      // Log error but continue
      await db.crm_Lead_Gen_Jobs.update({
        where: { id: jobId },
        data: {
          logs: [
            ...(job.logs || []),
            { ts: new Date().toISOString(), level: "WARN", msg: `SERP error for "${q}": ${(err as Error).message}` },
          ],
        },
      });
    }

    const domains = dedupe(
      results
        .map((r) => r.domain)
        .filter((d): d is string => !!d)
        .map((d) => d.toLowerCase())
        .filter((d) => !exclude.has(d))
    );

    allDomains.push(...domains);

    // Persist a single source event per query with metadata summary
    try {
      await db.crm_Lead_Source_Events.create({
        data: {
          job: jobId,
          type: "serp",
          query: q,
          url: results[0]?.href || null,
          fetchedAt: new Date(),
          metadata: {
            note: "SERP query results",
            domains: domains.slice(0, 20),
            totalResults: results.length,
          },
        },
      });
      sourceEvents++;
    } catch {
      // ignore individual event errors
    }

    // delay
    if (perQueryDelayMs > 0) {
      await sleep(perQueryDelayMs);
    }
    
    // If we've found enough domains for this attempt level, break early
    if (allDomains.length >= maxCompanies) {
      break;
    }
  }
  
  attemptLevel++;
  }
  
  // Final check: If still no results after all attempts
  if (allDomains.length === 0) {
    await db.crm_Lead_Gen_Jobs.update({
      where: { id: jobId },
      data: {
        logs: [
          ...(job.logs || []),
          { 
            ts: new Date().toISOString(), 
            level: "ERROR", 
            msg: "No companies found after all search attempts. This may indicate: (1) ICP criteria too narrow, (2) Search engine blocking, (3) No matching companies exist. Try broader ICP criteria or check logs for search errors." 
          },
        ],
      },
    });
  }

  // Deduplicate domains and respect maxCompanies
  const uniqueDomains = dedupe(allDomains).slice(0, maxCompanies);

  // Upsert into private global aggregation index (companies)
  for (const domainRaw of uniqueDomains) {
    const domain = normalizeDomain(domainRaw);
    const dedupeKey = computeCompanyDedupeKey(domain);
    try {
      const existing = await db.crm_Global_Companies.findFirst({
        where: { OR: [{ domain }, { dedupeKey }] },
        select: { id: true, provenance: true },
      });

      const baseData = {
        domain,
        companyName: deriveCompanyName(domain),
        homepageUrl: canonicalizeUrl(`https://${domain}`),
        lastSeen: new Date(),
        status: "ACTIVE",
      };

      if (existing?.id) {
        await db.crm_Global_Companies.update({
          where: { id: existing.id },
          data: {
            ...baseData,
            provenance: mergeProvenance(existing.provenance, { jobId, source: "serp" }),
          },
        });
      } else {
        await db.crm_Global_Companies.create({
          data: {
            ...baseData,
            dedupeKey,
            firstSeen: new Date(),
            provenance: { sources: [{ jobId, source: "serp", ts: new Date().toISOString() }] },
          },
        });
      }
    } catch {
      // tolerate global index write errors per-domain
    }
  }

  // Create candidates in the user's pool if not exists
  for (const domainRaw of uniqueDomains) {
    const domain = normalizeDomain(domainRaw);
    const exists = await db.crm_Lead_Candidates.findFirst({
      where: { pool: job.pool, domain },
      select: { id: true },
    });
    if (exists) continue;

    try {
      await db.crm_Lead_Candidates.create({
        data: {
          pool: job.pool,
          domain,
          companyName: deriveCompanyName(domain),
          homepageUrl: canonicalizeUrl(`https://${domain}`),
          dedupeKey: computeCompanyDedupeKey(domain),
          score: 50,
          freshnessAt: new Date(),
          status: "NEW",
          provenance: { jobId, source: "serp" },
        },
      });
      createdCandidates++;
    } catch {
      // skip failures on individual domains
    }
  }

  return { createdCandidates, sourceEvents, uniqueDomains };
}
