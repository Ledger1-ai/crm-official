/**
 * Company enrichment crawler
 * Extracts detailed information from company websites
 */

import { launchBrowser, newPageWithDefaults, closeBrowser } from "@/lib/browser";
import { normalizeDomain, normalizeUrl, normalizeCompanyName, calculateCompanyConfidence } from "./normalize";
import { prismadbCrm } from "@/lib/prisma-crm";
import { analyzeCompanyWithAI } from "./ai-helpers";

type CompanyEnrichmentResult = {
  domain: string;
  companyName: string | null;
  description: string | null;
  industry: string | null;
  techStack: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  confidence: number;
  metadata: {
    pageTitle?: string;
    metaDescription?: string;
    ogDescription?: string;
    keywords?: string[];
  };
};

/**
 * Extract metadata from company website HTML
 */
async function extractCompanyMetadata(url: string): Promise<Partial<CompanyEnrichmentResult>> {
  const browser = await launchBrowser();
  
  try {
    const page = await newPageWithDefaults(browser);
    
    // Set shorter timeout for enrichment
    await page.goto(url, { 
      waitUntil: "domcontentloaded",
      timeout: 15000 
    });
    
    // Wait briefly for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract all relevant data in one evaluation
    const data = await page.evaluate(() => {
      const result: any = {
        socialLinks: {},
        contactInfo: {},
        metadata: {},
        techStack: []
      };
      
      // Page title and meta tags
      result.metadata.pageTitle = document.title;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) result.metadata.metaDescription = metaDesc.getAttribute('content');
      
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) result.metadata.ogDescription = ogDesc.getAttribute('content');
      
      const keywords = document.querySelector('meta[name="keywords"]');
      if (keywords) {
        result.metadata.keywords = keywords.getAttribute('content')?.split(',').map((k: string) => k.trim());
      }
      
      // Company name from various sources
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) result.companyName = ogTitle.getAttribute('content');
      
      const h1 = document.querySelector('h1');
      if (!result.companyName && h1) result.companyName = h1.textContent?.trim();
      
      // Description from meta or first paragraph
      result.description = result.metadata.metaDescription || result.metadata.ogDescription;
      if (!result.description) {
        const firstP = document.querySelector('p');
        if (firstP) result.description = firstP.textContent?.trim();
      }
      
      // Social links
      const socialPatterns = {
        linkedin: /linkedin\.com\/company\/[^\/\s"')]+/i,
        twitter: /twitter\.com\/[^\/\s"')]+/i,
        facebook: /facebook\.com\/[^\/\s"')]+/i,
        instagram: /instagram\.com\/[^\/\s"')]+/i
      };
      
      document.querySelectorAll('a[href]').forEach((a) => {
        const href = (a as HTMLAnchorElement).href;
        if (socialPatterns.linkedin.test(href)) result.socialLinks.linkedin = href;
        else if (socialPatterns.twitter.test(href)) result.socialLinks.twitter = href;
        else if (socialPatterns.facebook.test(href)) result.socialLinks.facebook = href;
        else if (socialPatterns.instagram.test(href)) result.socialLinks.instagram = href;
      });
      
      // Contact info - email
      const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
      const bodyText = document.body.textContent || '';
      const emailMatches = bodyText.match(emailPattern);
      if (emailMatches && emailMatches.length > 0) {
        // Prefer contact/info/hello emails
        const contactEmail = emailMatches.find(e => 
          e.includes('contact') || e.includes('info') || e.includes('hello') || e.includes('support')
        );
        result.contactInfo.email = contactEmail || emailMatches[0];
      }
      
      // Contact info - phone
      const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const phoneMatches = bodyText.match(phonePattern);
      if (phoneMatches && phoneMatches.length > 0) {
        result.contactInfo.phone = phoneMatches[0];
      }
      
      // Detect tech stack from page elements
      const techIndicators: { [key: string]: string[] } = {
        'React': ['react', '__react', 'data-reactroot'],
        'Vue.js': ['vue', '__vue__'],
        'Angular': ['ng-app', 'ng-controller', 'ng-version'],
        'WordPress': ['wp-content', 'wordpress'],
        'Shopify': ['shopify', 'cdn.shopify.com'],
        'Wix': ['wix.com', 'static.wixstatic.com'],
        'Squarespace': ['squarespace', 'static1.squarespace.com'],
        'Webflow': ['webflow', 'uploads-ssl.webflow.com'],
        'Next.js': ['__next', '__NEXT_DATA__'],
        'Nuxt.js': ['__nuxt', '__NUXT__'],
        'Django': ['csrfmiddlewaretoken'],
        'Rails': ['csrf-token'],
        'Laravel': ['laravel'],
        'Stripe': ['stripe', 'js.stripe.com'],
        'Google Analytics': ['google-analytics', 'gtag'],
        'Segment': ['segment', 'analytics.js'],
        'Intercom': ['intercom', 'widget.intercom.io'],
        'HubSpot': ['hubspot', 'js.hs-scripts.com'],
        'Salesforce': ['salesforce']
      };
      
      const html = document.documentElement.outerHTML.toLowerCase();
      Object.entries(techIndicators).forEach(([tech, indicators]) => {
        if (indicators.some(indicator => html.includes(indicator.toLowerCase()))) {
          result.techStack.push(tech);
        }
      });
      
      return result;
    });
    
    return data;
  } catch (error) {
    console.error(`Error enriching ${url}:`, error);
    return {
      socialLinks: {},
      contactInfo: {},
      metadata: {},
      techStack: []
    };
  } finally {
    await closeBrowser(browser);
  }
}

/**
 * Infer industry from company data
 */
function inferIndustry(data: {
  companyName?: string | null;
  description?: string | null;
  keywords?: string[];
  techStack?: string[];
}): string | null {
  const text = [
    data.companyName || '',
    data.description || '',
    ...(data.keywords || []),
    ...(data.techStack || [])
  ].join(' ').toLowerCase();
  
  const industryKeywords: { [key: string]: string[] } = {
    'Software & Technology': ['software', 'saas', 'technology', 'tech', 'platform', 'cloud', 'api', 'ai', 'ml', 'data'],
    'E-commerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'retail', 'marketplace', 'shopify'],
    'Finance & Fintech': ['finance', 'fintech', 'banking', 'payment', 'crypto', 'blockchain', 'trading', 'investment'],
    'Healthcare & Medical': ['health', 'medical', 'healthcare', 'patient', 'doctor', 'hospital', 'pharma', 'clinic'],
    'Education': ['education', 'learning', 'school', 'university', 'course', 'student', 'training', 'edtech'],
    'Marketing & Advertising': ['marketing', 'advertising', 'agency', 'creative', 'brand', 'media', 'campaign'],
    'Consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'professional services'],
    'Real Estate': ['real estate', 'property', 'housing', 'commercial', 'residential', 'realty'],
    'Manufacturing': ['manufacturing', 'production', 'factory', 'industrial', 'supply chain'],
    'Food & Beverage': ['food', 'beverage', 'restaurant', 'catering', 'delivery', 'dining'],
    'Transportation & Logistics': ['logistics', 'shipping', 'transportation', 'delivery', 'freight', 'supply'],
    'Entertainment & Media': ['entertainment', 'media', 'streaming', 'content', 'gaming', 'music', 'video'],
    'Non-Profit': ['non-profit', 'nonprofit', 'charity', 'foundation', 'ngo', 'donation']
  };
  
  let bestMatch: { industry: string; score: number } = { industry: '', score: 0 };
  
  Object.entries(industryKeywords).forEach(([industry, keywords]) => {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (text.includes(keyword) ? 1 : 0);
    }, 0);
    
    if (score > bestMatch.score) {
      bestMatch = { industry, score };
    }
  });
  
  return bestMatch.score > 0 ? bestMatch.industry : null;
}

/**
 * Enrich a single company by domain
 */
export async function enrichCompany(domain: string): Promise<CompanyEnrichmentResult | null> {
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) return null;
  
  const url = `https://${normalizedDomain}`;
  
  try {
    const extracted = await extractCompanyMetadata(url);
    
    const companyName = normalizeCompanyName(
      extracted.companyName || 
      extracted.metadata?.pageTitle || 
      normalizedDomain.split('.')[0]
    );
    
    const description = (
      extracted.description ||
      extracted.metadata?.metaDescription ||
      extracted.metadata?.ogDescription ||
      null
    )?.substring(0, 500); // Limit description length
    
    const industry = inferIndustry({
      companyName,
      description,
      keywords: extracted.metadata?.keywords,
      techStack: extracted.techStack
    });
    
    const confidence = calculateCompanyConfidence({
      hasDomain: true,
      hasWebsite: true,
      hasDescription: !!description,
      hasTechStack: (extracted.techStack?.length || 0) > 0,
      hasIndustry: !!industry,
      source: 'crawler'
    });
    
    return {
      domain: normalizedDomain,
      companyName: companyName || null,
      description: description || null,
      industry: industry || null,
      techStack: extracted.techStack || [],
      socialLinks: extracted.socialLinks || {},
      contactInfo: extracted.contactInfo || {},
      confidence,
      metadata: extracted.metadata || {}
    };
  } catch (error) {
    console.error(`Failed to enrich company ${domain}:`, error);
    return null;
  }
}

/**
 * Enrich companies for a lead gen job
 * Updates both global index and pool candidates
 */
export async function enrichCompaniesForJob(jobId: string, maxEnrichments = 50, userId?: string): Promise<{
  enriched: number;
  failed: number;
}> {
  const db: any = prismadbCrm;
  
  // Get job and candidates
  const job = await db.crm_Lead_Gen_Jobs.findUnique({
    where: { id: jobId },
    select: { pool: true, user: true, providers: true }
  });
  
  if (!job) throw new Error("Job not found");
  
  // Get candidates without enrichment (missing description/industry)
  const candidates = await db.crm_Lead_Candidates.findMany({
    where: {
      pool: job.pool,
      OR: [
        { description: null },
        { industry: null }
      ]
    },
    select: { id: true, domain: true, score: true },
    take: maxEnrichments
  });
  
  let enriched = 0;
  let failed = 0;
  
  for (const candidate of candidates) {
    if (!candidate.domain) continue;
    
    try {
      const enrichmentData = await enrichCompany(candidate.domain);
      
      // Use AI to enhance analysis if available
      const useAI = job?.providers?.aiAnalysis !== false;
      let aiAnalysis = null;
      
      if (useAI && enrichmentData?.description && (userId || job?.user)) {
        try {
          aiAnalysis = await analyzeCompanyWithAI(
            candidate.domain,
            enrichmentData.description,
            userId || job.user
          );
        } catch (error) {
          console.error(`AI analysis failed for ${candidate.domain}:`, error);
        }
      }
      
      if (enrichmentData) {
        // Merge AI insights with scraped data
        const finalIndustry = aiAnalysis?.industry || enrichmentData.industry || null;
        const finalTechStack = Array.from(new Set([
          ...(enrichmentData.techStack || []),
          ...(aiAnalysis?.techStack || [])
        ]));
        // Update global company
        const globalCompany = await db.crm_Global_Companies.findFirst({
          where: { domain: enrichmentData.domain },
          select: { id: true, provenance: true }
        });
        
        if (globalCompany) {
          await db.crm_Global_Companies.update({
            where: { id: globalCompany.id },
            data: {
              companyName: enrichmentData.companyName,
              description: enrichmentData.description,
              industry: finalIndustry,
              techStack: finalTechStack,
              lastSeen: new Date(),
              provenance: {
                ...(typeof globalCompany.provenance === 'object' && globalCompany.provenance !== null ? globalCompany.provenance as Record<string, any> : {}),
                enrichment: {
                  ts: new Date().toISOString(),
                  confidence: enrichmentData.confidence,
                  source: 'crawler',
                  aiAnalysis: aiAnalysis ? {
                    confidence: aiAnalysis.confidence,
                    businessModel: aiAnalysis.businessModel,
                    targetMarket: aiAnalysis.targetMarket
                  } : null
                }
              }
            }
          });
        }
        
        // Update candidate
        await db.crm_Lead_Candidates.update({
          where: { id: candidate.id },
          data: {
            companyName: enrichmentData.companyName,
            description: enrichmentData.description,
            industry: finalIndustry,
            techStack: finalTechStack,
            score: Math.max(
              candidate.score || 0, 
              enrichmentData.confidence,
              aiAnalysis?.confidence || 0
            )
          }
        });
        
        enriched++;
      } else {
        failed++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to enrich candidate ${candidate.id}:`, error);
      failed++;
    }
  }
  
  return { enriched, failed };
}
