/**
 * Agentic AI Lead Scraper - The World's Most Powerful
 * Uses GPT-5/GPT-4 with function calling to autonomously:
 * - Search for companies (Bing API)
 * - Visit and analyze websites
 * - Extract contacts intelligently
 * - Refine search strategy based on results
 */

import { openAiHelper } from "@/lib/openai";
import { prismadbCrm } from "@/lib/prisma-crm";
import { launchBrowser, newPageWithDefaults, closeBrowser } from "@/lib/browser";
import {
  normalizeDomain,
  normalizeEmail,
  normalizePhone,
  normalizeName,
  generateCompanyDedupeKey,
  generatePersonDedupeKey,
  calculateCompanyConfidence
} from "./normalize";

type ICPConfig = {
  industries?: string[];
  companySizes?: string[];
  geos?: string[];
  techStack?: string[];
  titles?: string[];
  excludeDomains?: string[];
  notes?: string;
  limits?: {
    maxCompanies?: number;
    maxContactsPerCompany?: number;
  };
};

/**
 * DuckDuckGo search using browser automation (free, no API needed)
 */
async function ddgWebSearch(query: string, count: number = 20): Promise<Array<{
  name: string;
  url: string;
  snippet: string;
  domain: string;
}>> {
  const browser = await launchBrowser();
  try {
    const page = await newPageWithDefaults(browser);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const results = await page.evaluate(() => {
      const extracted: Array<{ name: string; url: string; snippet: string }> = [];
      
      const links = document.querySelectorAll('a[href*="http"]');
      links.forEach((link, idx) => {
        if (idx < 25) {
          const anchor = link as HTMLAnchorElement;
          const href = anchor.href;
          if (href && !href.includes('duckduckgo.com') && 
              (href.startsWith('http://') || href.startsWith('https://'))) {
            extracted.push({
              name: (anchor.textContent || '').trim(),
              url: href,
              snippet: (anchor.closest('.result')?.textContent || '').substring(0, 200)
            });
          }
        }
      });
      
      return extracted;
    });

    return results.map(r => ({
      ...r,
      domain: extractDomain(r.url)
    })).filter(r => r.domain);
  } catch (error) {
    console.error("DDG search error:", error);
    return [];
  } finally {
    await closeBrowser(browser);
  }
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

/**
 * AI Agent Tools - These are callable by the AI
 */
const agentTools = [
  {
    type: "function",
    function: {
      name: "search_companies",
      description: "Search for companies using Bing Search API. Returns company websites matching the query.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find companies (e.g., 'SaaS companies in San Francisco')"
          },
          count: {
            type: "number",
            description: "Number of results to return (1-50)",
            default: 20
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "visit_website",
      description: "Visit a company website and extract all available information including company details and contact information.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to visit"
          }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_company_fit",
      description: "Analyze if a company matches the ICP criteria and should be added to the pool.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "Company domain"
          },
          companyData: {
            type: "object",
            description: "Company information extracted from website"
          }
        },
        required: ["domain", "companyData"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_company",
      description: "Save a qualified company to the lead pool with extracted data.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string"
          },
          companyName: {
            type: "string"
          },
          description: {
            type: "string"
          },
          industry: {
            type: "string"
          },
          techStack: {
            type: "array",
            items: { type: "string" }
          },
          contacts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                title: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                linkedin: { type: "string" }
              }
            }
          }
        },
        required: ["domain"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "refine_search_strategy",
      description: "Based on results so far, decide if search strategy should be adjusted.",
      parameters: {
        type: "object",
        properties: {
          currentResults: {
            type: "number",
            description: "Number of qualified companies found so far"
          },
          targetResults: {
            type: "number",
            description: "Target number of companies"
          },
          reasoning: {
            type: "string",
            description: "Why the strategy should or shouldn't change"
          }
        },
        required: ["currentResults", "targetResults", "reasoning"]
      }
    }
  }
];

/**
 * Visit website and extract comprehensive data
 */
async function visitWebsiteForAgent(url: string): Promise<any> {
  const browser = await launchBrowser();
  try {
    const page = await newPageWithDefaults(browser);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const data = await page.evaluate(() => {
      const result: any = {
        title: document.title,
        description: "",
        contacts: [],
        socialLinks: {},
        techStack: [],
        emails: [],
        phones: []
      };

      // Meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) result.description = metaDesc.getAttribute('content');

      // Extract all emails
      const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
      const bodyText = document.body.textContent || '';
      const emailMatches = bodyText.match(emailPattern);
      if (emailMatches) {
        result.emails = Array.from(new Set(emailMatches)).slice(0, 10);
      }

      // Extract phones
      const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const phoneMatches = bodyText.match(phonePattern);
      if (phoneMatches) {
        result.phones = Array.from(new Set(phoneMatches)).slice(0, 5);
      }

      // Tech stack detection
      const html = document.documentElement.outerHTML.toLowerCase();
      const techIndicators: { [key: string]: string } = {
        'React': 'react',
        'Vue.js': 'vue',
        'Angular': 'ng-app',
        'WordPress': 'wp-content',
        'Shopify': 'shopify',
        'Next.js': '__next'
      };

      Object.entries(techIndicators).forEach(([tech, indicator]) => {
        if (html.includes(indicator)) result.techStack.push(tech);
      });

      // Social links
      document.querySelectorAll('a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="facebook.com"]').forEach((a) => {
        const href = (a as HTMLAnchorElement).href;
        if (href.includes('linkedin.com')) result.socialLinks.linkedin = href;
        else if (href.includes('twitter.com')) result.socialLinks.twitter = href;
        else if (href.includes('facebook.com')) result.socialLinks.facebook = href;
      });

      return result;
    });

    return data;
  } catch (error) {
    return { error: (error as Error).message };
  } finally {
    await closeBrowser(browser);
  }
}

/**
 * Use AI to enrich missing company fields
 */
async function enrichCompanyDataWithAI(
  domain: string,
  extractedData: any,
  userId: string,
  icp: ICPConfig
): Promise<{
  companyName: string;
  description: string;
  industry: string;
}> {
  try {
    const openai = await openAiHelper(userId);
    if (!openai) {
      return {
        companyName: domain,
        description: `Business website: ${domain}`,
        industry: icp.industries?.[0] || "General Business"
      };
    }

    const prompt = `You are analyzing a company website to extract structured business information.

DOMAIN: ${domain}
WEBSITE TITLE: ${extractedData.title || 'N/A'}
META DESCRIPTION: ${extractedData.description || 'N/A'}
FOUND EMAILS: ${extractedData.emails?.join(', ') || 'N/A'}
FOUND PHONES: ${extractedData.phones?.join(', ') || 'N/A'}
DETECTED TECH: ${extractedData.techStack?.join(', ') || 'N/A'}

TARGET ICP:
- Industries: ${icp.industries?.join(", ") || "Any"}
- Geographies: ${icp.geos?.join(", ") || "Any"}

Based on this information, provide:
1. companyName: The business name (extract from domain/title, make it professional)
2. description: A clear 1-2 sentence description of what this business does
3. industry: The primary industry (match to ICP industries if possible, otherwise be specific)

Return ONLY valid JSON:
{
  "companyName": "Professional Business Name",
  "description": "Clear description of what they do and their focus",
  "industry": "Specific Industry Category"
}`;

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";
    
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing company websites and extracting structured business information. Return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // temperature: 0.3,
      // max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        companyName: parsed.companyName || domain,
        description: parsed.description || `Business website: ${domain}`,
        industry: parsed.industry || (icp.industries?.[0] || "General Business")
      };
    }
  } catch (error) {
    console.error("AI enrichment failed:", error);
  }

  // Fallback
  return {
    companyName: domain,
    description: `Business website: ${domain}`,
    industry: icp.industries?.[0] || "General Business"
  };
}

/**
 * Execute agent tool call
 */
async function executeToolCall(toolName: string, args: any, context: any): Promise<any> {
  switch (toolName) {
    case "search_companies":
      const searchResults = await ddgWebSearch(args.query, args.count || 20);
      return {
        success: true,
        results: searchResults,
        count: searchResults.length
      };

    case "visit_website":
      const siteData = await visitWebsiteForAgent(args.url);
      return {
        success: !siteData.error,
        data: siteData,
        url: args.url
      };

    case "analyze_company_fit":
      // AI will analyze this in its next turn
      return {
        success: true,
        domain: args.domain,
        ready_for_analysis: true
      };

    case "save_company":
      const db: any = prismadbCrm;
      const domain = normalizeDomain(args.domain);
      
      console.log("[SAVE_COMPANY] Validating company:", {
        domain,
        companyName: args.companyName,
        hasDescription: !!args.description,
        hasIndustry: !!args.industry,
        contactCount: args.contacts?.length || 0
      });

      if (!domain) {
        console.log("[SAVE_COMPANY] Validation failed: Invalid domain");
        return { success: false, error: "Invalid domain" };
      }

      // Validate: Must have at least one contact with email or phone
      if (!args.contacts || !Array.isArray(args.contacts) || args.contacts.length === 0) {
        console.log("[SAVE_COMPANY] Validation failed: No contacts");
        return { success: false, error: "Cannot save company without contacts" };
      }

      const contactsWithInfo = args.contacts.filter((c: any) => 
        (c.email && c.email.trim().length > 0) || (c.phone && c.phone.trim().length > 0)
      );
      console.log("[SAVE_COMPANY] Contacts with email or phone:", contactsWithInfo.length);
      
      if (contactsWithInfo.length === 0) {
        console.log("[SAVE_COMPANY] Validation failed: No contact info");
        return { success: false, error: "Cannot save company without at least one email or phone number" };
      }

      // Use AI to enrich missing fields if not provided
      let companyName = args.companyName;
      let description = args.description;
      let industry = args.industry;

      // If any field is missing, use AI to enrich
      if (!companyName || !description || !industry) {
        console.log("[SAVE_COMPANY] Enriching missing fields with AI...");
        const enriched = await enrichCompanyDataWithAI(
          domain,
          { 
            title: args.companyName, 
            description: args.description,
            emails: args.contacts?.map((c: any) => c.email).filter(Boolean),
            phones: args.contacts?.map((c: any) => c.phone).filter(Boolean),
            techStack: args.techStack
          },
          context.userId,
          context.icp
        );

        companyName = companyName || enriched.companyName;
        description = description || enriched.description;
        industry = industry || enriched.industry;

        console.log("[SAVE_COMPANY] AI enrichment complete:", {
          companyName,
          industry,
          descLength: description.length
        });
      }

      console.log("[SAVE_COMPANY] Saving with complete data:", {
        companyName,
        hasDescription: !!description,
        industry,
        contactCount: contactsWithInfo.length
      });

      try {
        // Save to global index
        const dedupeKey = generateCompanyDedupeKey(domain);
        await db.crm_Global_Companies.upsert({
          where: { dedupeKey },
          create: {
            domain,
            dedupeKey,
            companyName,
            description,
            industry,
            techStack: args.techStack || [],
            firstSeen: new Date(),
            lastSeen: new Date(),
            status: "ACTIVE",
            provenance: { source: "agentic_ai", jobId: context.jobId }
          },
          update: {
            companyName,
            description,
            industry,
            techStack: args.techStack || [],
            lastSeen: new Date()
          }
        });

        // Save to user pool
        const candidate = await db.crm_Lead_Candidates.create({
          data: {
            pool: context.poolId,
            domain,
            dedupeKey,
            companyName,
            description,
            industry,
            techStack: args.techStack || [],
            homepageUrl: `https://${domain}`,
            score: 75,
            status: "NEW",
            provenance: { source: "agentic_ai", jobId: context.jobId }
          }
        });

        // Save ALL contacts with emails or phones
        let contactsSavedCount = 0;
        if (args.contacts && Array.isArray(args.contacts)) {
          for (const contact of args.contacts) {
            const email = normalizeEmail(contact.email);
            const phone = normalizePhone(contact.phone);
            
            // Save contact if it has either email or phone
            if (email || phone) {
              // Use "Direct" if no name provided
              const contactName = contact.name && contact.name.trim().length > 0 
                ? contact.name 
                : "Direct";
              
              const personDedupeKey = generatePersonDedupeKey(
                email || phone || "", 
                contactName, 
                domain, 
                contact.title
              );
              
              await db.crm_Contact_Candidates.create({
                data: {
                  leadCandidate: candidate.id,
                  fullName: normalizeName(contactName),
                  title: contact.title || null,
                  email: email || null,
                  phone: phone || null,
                  linkedinUrl: contact.linkedin || null,
                  dedupeKey: personDedupeKey,
                  confidence: 70,
                  status: "NEW",
                  provenance: { source: "agentic_ai", jobId: context.jobId }
                }
              });
              contactsSavedCount++;
            }
          }
        }

        return {
          success: true,
          candidateId: candidate.id,
          contactsCreated: contactsSavedCount
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        };
      }

    case "refine_search_strategy":
      // Log the agent's reasoning
      const db2: any = prismadbCrm;
      await db2.crm_Lead_Gen_Jobs.update({
        where: { id: context.jobId },
        data: {
          logs: [
            ...(context.logs || []),
            {
              ts: new Date().toISOString(),
              msg: `Agent reasoning: ${args.reasoning}`
            }
          ]
        }
      });
      return {
        success: true,
        shouldContinue: args.currentResults < args.targetResults
      };

    default:
      return { success: false, error: "Unknown tool" };
  }
}

/**
 * Run agentic AI lead generation
 * The AI autonomously searches, analyzes, and saves leads
 */
export async function runAgenticLeadGeneration(
  jobId: string,
  userId: string,
  icp: ICPConfig,
  poolId: string,
  maxCompanies: number = 100
): Promise<{
  companiesSaved: number;
  contactsSaved: number;
  iterations: number;
}> {
  const openai = await openAiHelper(userId);
  if (!openai) {
    throw new Error("OpenAI not configured");
  }

  const db: any = prismadbCrm;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";

  // Initial prompt for the agent
  const systemPrompt = `You are an elite B2B lead generation agent with MASTERY of search techniques and multi-hop reasoning. Your mission is to autonomously find and qualify companies through systematic, intelligent search and analysis.

ICP CRITERIA:
- Industries: ${icp.industries?.join(", ") || "Any"}
- Geographies: ${icp.geos?.join(", ") || "Any"}
- Tech Stack: ${icp.techStack?.join(", ") || "Any"}
- Target Titles: ${icp.titles?.join(", ") || "Any"}
${icp.notes ? `- Notes: ${icp.notes}` : ""}

TARGET: Find ${maxCompanies} highly qualified companies

CRITICAL REQUIREMENTS FOR SAVING COMPANIES:
1. ⚠️ ONLY save companies where you have found AT LEAST ONE contact with an email address
2. Extract ALL contacts you can find - create separate contact entry for EACH email/phone you discover
3. For contact names, if you cannot find a name, use "Direct" as the name
4. Company info (name, description, industry) - if any field is missing, provide reasonable default
5. Save ALL emails and phones as separate contact entries, not just one

YOUR CAPABILITIES (can be called in parallel):
1. search_companies - DuckDuckGo search with advanced query techniques
2. visit_website - Extract comprehensive data from websites
3. analyze_company_fit - Analyze ICP match quality
4. save_company - Save qualified companies with contacts (REQUIRED: must have at least 1 contact with email)
5. refine_search_strategy - Evaluate and adjust approach

===== DUCKDUCKGO SEARCH MASTERY =====

You are using DuckDuckGo through a headless browser. Master these search techniques:

EFFECTIVE QUERY PATTERNS:
✓ GOOD: "${icp.industries?.[0] || 'SaaS'} companies in ${icp.geos?.[0] || 'California'}"
✓ GOOD: "top ${icp.industries?.[0] || 'fintech'} startups ${icp.geos?.[0] || 'New York'}"
✓ GOOD: "${icp.industries?.[0] || 'healthcare'} technology ${icp.geos?.[0] || 'Boston'}"
✓ GOOD: "best ${icp.industries?.[0] || 'AI'} companies hiring ${icp.titles?.[0] || 'engineers'}"

ADVANCED TECHNIQUES:
1. **Use Natural Language**: DuckDuckGo works best with natural phrases
   - "companies building AI tools in San Francisco"
   - "healthcare startups with Series A funding"
   
2. **Combine Multiple Criteria**: Blend industry, geo, and signals
   - "SaaS companies California 50-200 employees"
   - "fintech startups New York venture backed"

3. **Target Company Directories**: 
   - "site:crunchbase.com ${icp.industries?.[0] || 'SaaS'} ${icp.geos?.[0] || ''}"
   - "site:linkedin.com/company ${icp.industries?.[0] || 'AI'}"

4. **Search for Hiring Pages** (great for contact extraction):
   - "${icp.industries?.[0] || 'tech'} companies careers page"
   - "${icp.industries?.[0] || 'SaaS'} hiring ${icp.geos?.[0] || 'remote'}"

5. **Use Qualifying Terms**:
   - Add: "startup", "venture backed", "series A/B", "Y Combinator"
   - Add: "founded 2020", "growing fast", "hiring"
   - Add: "using ${icp.techStack?.[0] || 'React'}", "built with"

SEARCH STRATEGY:
- Start BROAD, then refine based on results
- If getting too many irrelevant results, add more specific terms
- If getting too few results, remove constraints
- Try 3-5 different query variations per batch
- Monitor what works and adapt quickly

RESULT FILTERING:
- Focus on actual company websites (avoid directories when possible)
- Prioritize: company.com over crunchbase.com/company over wikipedia
- Look for: /about, /careers, /team, /contact pages
- Skip: news articles, job boards, social media unless company page

MULTI-HOP REASONING WORKFLOW:
You must perform multi-step reasoning before taking action:

1. SEARCH PHASE:
   - Craft targeted search queries based on ICP
   - Consider multiple search angles (industry + geo, tech stack, etc.)
   - Think: "What search terms will yield the best quality results?"

2. DISCOVERY PHASE:
   - Visit multiple company websites in parallel
   - Extract all available data (contacts, tech stack, company info)
   - Think: "Does the extracted data suggest a good ICP fit?"

3. ANALYSIS PHASE:
   - Analyze each company against ALL ICP criteria
   - Evaluate quality signals: relevant titles, industry match, tech stack alignment
   - Think: "Should I visit additional pages (e.g., /about, /team) for more contacts?"

4. DECISION PHASE:
   - Only save companies that clearly match ICP criteria
   - Ensure contact information is complete and high-quality
   - Think: "Does this company have decision-makers with the target titles?"

5. REFINEMENT PHASE:
   - Periodically evaluate strategy effectiveness
   - Adjust search queries if results are poor quality
   - Think: "Am I finding the right types of companies? Should I refine my approach?"

CRITICAL REQUIREMENTS:
- Chain multiple actions together (search → visit multiple sites → analyze → save)
- Use parallel tool calls whenever possible (visit multiple websites simultaneously)
- Always analyze before saving - don't save without verification
- Extract ALL contacts from each qualified website - every email, phone, LinkedIn URL you find
- For contacts without names, use "Direct" as the name
- NEVER save a company without at least ONE contact that has an email address
- Before saving, ensure company info is complete (name, description, industry)
- If company description is missing, infer it from the website content
- Refine your search strategy if results aren't meeting ICP criteria
- Think multiple steps ahead: consider what information you need BEFORE making tool calls

QUALITY OVER QUANTITY:
Focus on deeply qualifying each company rather than rushing to hit the target number. Each saved company MUST have:
- Clear ICP alignment
- AT LEAST ONE contact with an email address (preferably multiple contacts)
- Complete company information (name, description, industry)
- Relevant job titles for contacts

Be strategic, methodical, and intelligent in your approach.`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { 
      role: "user", 
      content: `Begin lead generation. Find ${maxCompanies} companies matching the ICP.

WORKFLOW TO FOLLOW:
1. First, use search_companies to find relevant companies
2. Then, use visit_website IN PARALLEL on multiple promising URLs from the search results
3. After extracting data, IMMEDIATELY use save_company if you found AT LEAST ONE email
4. For missing company info, provide defaults (description can be basic, industry from ICP)
5. Save ALL emails as separate contacts - if you found 5 emails, create 5 contact objects
6. Continue this cycle (search → visit → save) until you reach ${maxCompanies} saved companies

IMPORTANT: 
- Create separate contact entry for EACH email found (use "Direct" as name if unknown)
- Don't skip companies due to missing description/industry - provide reasonable defaults
- The goal is to save companies WITH contacts, not to be perfectionist about company details

Start now by searching for companies.` 
    }
  ];

  let companiesSaved = 0;
  let contactsSaved = 0;
  let iterations = 0;
  const maxIterations = 50; // Prevent infinite loops
  const context = { jobId, poolId, logs: [], icp, userId };

  // Buffer logs locally to reduce DB write conflicts
  let logBuffer: Array<{ ts: string; msg: string; level?: string }> = [];
  let lastDbUpdate = Date.now();
  const DB_UPDATE_INTERVAL = 3000; // Only update DB every 3 seconds

  // Helper to add log to buffer
  const addLog = (logMsg: string, level?: string) => {
    logBuffer.push({ ts: new Date().toISOString(), msg: logMsg, level });
    console.log(logMsg); // Always log to console
  };

  // Helper to flush logs to database with retry logic
  const flushLogsToDb = async (force: boolean = false, retries: number = 5) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastDbUpdate;
    
    // Only update if forced OR enough time has passed OR buffer is large
    if (!force && timeSinceLastUpdate < DB_UPDATE_INTERVAL && logBuffer.length < 10) {
      return;
    }

    if (logBuffer.length === 0 && !force) {
      return;
    }

    const logsToWrite = [...logBuffer];
    const updateData: any = {
      logs: logsToWrite,
      counters: {
        companiesSaved,
        contactsSaved,
        iterations,
        progress: Math.min(100, Math.round((companiesSaved / maxCompanies) * 100))
      }
    };

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await db.crm_Lead_Gen_Jobs.update({
          where: { id: jobId },
          data: updateData
        });
        
        // Success - clear the buffer and update timestamp
        logBuffer = [];
        lastDbUpdate = now;
        return;
      } catch (error: any) {
        if (error.code === 'P2034' && attempt < retries - 1) {
          // Write conflict - wait with exponential backoff (longer delays)
          const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (attempt === retries - 1) {
          // Last attempt failed, log but don't crash
          console.error("Failed to flush logs after retries:", error);
          // Don't clear buffer in case we can retry later
        } else {
          throw error; // Different error, re-throw
        }
      }
    }
  };

  // Log agent start
  addLog("🤖 Agentic AI scraper starting...");
  await flushLogsToDb(true); // Force initial update

  while (iterations < maxIterations && companiesSaved < maxCompanies) {
    iterations++;

    // Check if job has been paused or stopped
    try {
      const currentJob = await db.crm_Lead_Gen_Jobs.findUnique({
        where: { id: jobId },
        select: { status: true }
      });

      if (currentJob?.status === "PAUSED") {
        addLog("⏸️ Job paused - waiting for resume...");
        await flushLogsToDb(true);
        
        // Wait and check again
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
          
          const checkJob = await db.crm_Lead_Gen_Jobs.findUnique({
            where: { id: jobId },
            select: { status: true }
          });
          
          if (checkJob?.status === "RUNNING") {
            addLog("▶️ Job resumed - continuing...");
            await flushLogsToDb(true);
            break;
          } else if (checkJob?.status === "STOPPED") {
            addLog("⏹️ Job stopped by user - exiting");
            await flushLogsToDb(true);
            return {
              companiesSaved,
              contactsSaved,
              iterations
            };
          }
        }
      } else if (currentJob?.status === "STOPPED") {
        addLog("⏹️ Job stopped by user - exiting");
        await flushLogsToDb(true);
        return {
          companiesSaved,
          contactsSaved,
          iterations
        };
      }
    } catch (statusCheckError) {
      console.error("Failed to check job status:", statusCheckError);
      // Continue anyway - don't crash on status check
    }

    try {
      const response = await openai.chat.completions.create({
        model: deployment,
        messages,
        tools: agentTools as any,
        tool_choice: "auto",
        temperature: 1
      });

      const message = response.choices[0].message;
      messages.push(message);

      // Check if agent wants to use tools
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCount = message.tool_calls.length;
        addLog(`🎬 Executing ${toolCount} tool${toolCount > 1 ? 's' : ''} in parallel...`);
        
        // Execute all tool calls in parallel using Promise.all
        const toolExecutionPromises = message.tool_calls.map(async (toolCall, index) => {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(`Agent calling: ${toolName}`, toolArgs);

          // Create detailed log message based on tool type
          let logMsg = "";
          switch (toolName) {
            case "search_companies":
              logMsg = `🔍 [${index + 1}/${toolCount}] Searching: "${toolArgs.query}"`;
              break;
            case "visit_website":
              const urlDomain = extractDomain(toolArgs.url);
              logMsg = `🌐 [${index + 1}/${toolCount}] Visiting: ${urlDomain || toolArgs.url}`;
              break;
            case "analyze_company_fit":
              logMsg = `🔬 [${index + 1}/${toolCount}] Analyzing: ${toolArgs.domain}`;
              break;
            case "save_company":
              logMsg = `💾 [${index + 1}/${toolCount}] Saving: ${toolArgs.companyName || toolArgs.domain}`;
              break;
            case "refine_search_strategy":
              logMsg = `🎯 [${index + 1}/${toolCount}] Strategy: ${toolArgs.reasoning.substring(0, 100)}...`;
              break;
            default:
              logMsg = `🤖 [${index + 1}/${toolCount}] ${toolName}`;
          }

          // Log start (buffered)
          addLog(logMsg);

          // Execute tool
          const startTime = Date.now();
          const toolResult = await executeToolCall(toolName, toolArgs, context);
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);

          // Log completion with result summary
          let completionMsg = "";
          switch (toolName) {
            case "search_companies":
              completionMsg = `✓ [${index + 1}/${toolCount}] Search complete: ${toolResult.count || 0} results in ${duration}s`;
              break;
            case "visit_website":
              const visitDomain = extractDomain(toolArgs.url);
              const emails = toolResult.data?.emails?.length || 0;
              completionMsg = `✓ [${index + 1}/${toolCount}] ${visitDomain}: ${emails} emails, ${toolResult.data?.phones?.length || 0} phones (${duration}s)`;
              break;
            case "save_company":
              if (toolResult.success) {
                completionMsg = `✓ [${index + 1}/${toolCount}] ✅ SAVED: ${toolArgs.companyName || toolArgs.domain} with ${toolResult.contactsCreated} contacts (${duration}s)`;
              } else {
                completionMsg = `✗ [${index + 1}/${toolCount}] ❌ FAILED: ${toolArgs.companyName || toolArgs.domain} - ${toolResult.error} (${duration}s)`;
                // Also log to console for debugging
                console.error("[SAVE_FAILED]", toolArgs.companyName, toolResult.error);
              }
              break;
            default:
              completionMsg = `✓ [${index + 1}/${toolCount}] ${toolName} complete (${duration}s)`;
          }
          addLog(completionMsg);

          return {
            toolCall,
            toolName,
            toolResult
          };
        });

        // Wait for all tools to complete
        const completedTools = await Promise.all(toolExecutionPromises);

        // Process results and add to conversation
        for (const { toolCall, toolName, toolResult } of completedTools) {
          // Track saves
          if (toolName === "save_company" && toolResult.success) {
            companiesSaved++;
            contactsSaved += toolResult.contactsCreated || 0;
          }

          // Add tool result to conversation
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        }

        // Log summary with updated counters
        const saveCount = completedTools.filter(t => t.toolName === "save_company" && t.toolResult.success).length;
        const visitCount = completedTools.filter(t => t.toolName === "visit_website").length;
        const searchCount = completedTools.filter(t => t.toolName === "search_companies").length;
        
        let summary = `✅ Batch complete:`;
        if (searchCount > 0) summary += ` ${searchCount} search${searchCount > 1 ? 'es' : ''}`;
        if (visitCount > 0) summary += ` ${visitCount} visit${visitCount > 1 ? 's' : ''}`;
        if (saveCount > 0) summary += ` ${saveCount} saved`;
        summary += ` | Total: ${companiesSaved}/${maxCompanies} companies (${contactsSaved} contacts)`;
        
        addLog(summary);
        
        // Flush logs to DB after batch completion
        await flushLogsToDb(false);
      } else if (message.content) {
        // Agent is thinking/reasoning
        console.log("Agent reasoning:", message.content);
        addLog(`💭 Agent thinking: ${message.content}`);
        
        // Check if agent thinks it's done
        if (message.content.toLowerCase().includes("complete") || 
            message.content.toLowerCase().includes("finished") ||
            companiesSaved >= maxCompanies) {
          addLog("✅ Agent believes task is complete");
          await flushLogsToDb(true); // Force flush
          break;
        }

        // Add a user message to keep it going with more direct instructions
        if (companiesSaved < maxCompanies) {
          const feedbackMsg = `Progress: ${companiesSaved}/${maxCompanies} companies saved (${contactsSaved} contacts).

${companiesSaved === 0 ? '⚠️ You haven\'t saved ANY companies yet!\n\n' : ''}IMMEDIATE NEXT STEP:
1. Look at the website data you've extracted
2. For EACH website with emails, call save_company RIGHT NOW
3. Format: { domain, companyName, description, industry, techStack: [], contacts: [{name: "Direct", title: "Contact", email: "...", phone: "..."}] }

Don't keep searching - SAVE the companies you've already found!`;

          messages.push({
            role: "user",
            content: feedbackMsg
          });
          addLog(`📍 Checkpoint: ${companiesSaved}/${maxCompanies} companies | Directing agent to save...`);
          await flushLogsToDb(false); // Opportunistic flush
        }
      }

      // Safety: Add delay between iterations
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error("Agent iteration error:", error);
      addLog(`Agent error: ${(error as Error).message}`, "ERROR");
      await flushLogsToDb(true); // Force flush errors
      break;
    }
  }

  // Log completion
  addLog(`🤖 Agent complete: ${companiesSaved} companies, ${contactsSaved} contacts in ${iterations} iterations`);
  await flushLogsToDb(true); // Force final flush

  return {
    companiesSaved,
    contactsSaved,
    iterations
  };
}
