/**
 * AI-Powered Lead Generation Helpers
 * Uses OpenAI/Azure OpenAI for intelligent query generation, content analysis, and entity resolution
 */

import { openAiHelper } from "@/lib/openai";

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

/**
 * AI Form Completion: Use AI reasoning to complete ALL ICP form fields based on a natural language prompt
 * The AI will use its knowledge to intelligently fill in all fields, not just extract explicit mentions
 * Example: "restaurants in New Mexico" -> AI fills industries, geos, titles, companySizes, techStack, etc.
 */
export async function parseICPFromNaturalLanguage(
  naturalLanguagePrompt: string,
  userId: string
): Promise<{
  industries: string[];
  companySizes: string[];
  geos: string[];
  techStack: string[];
  titles: string[];
  languages: string[];
  notes: string;
}> {
  try {
    const openai = await openAiHelper(userId);
    if (!openai) {
      console.warn("OpenAI not configured, returning empty ICP");
      return {
        industries: [],
        companySizes: [],
        geos: [],
        techStack: [],
        titles: [],
        languages: [],
        notes: naturalLanguagePrompt,
      };
    }

    const prompt = `You are an expert B2B sales and marketing strategist helping to build a targeted lead list. Based on the user's natural language request, use your knowledge and reasoning to COMPLETE ALL FIELDS of an Ideal Customer Profile (ICP) form.

USER REQUEST:
"${naturalLanguagePrompt}"

YOUR TASK: Fill out ALL the following fields using intelligent reasoning. Don't just extract - USE YOUR KNOWLEDGE to provide complete, helpful information for each field:

1. industries: List 3-5 relevant industry categories that match this request
   - Be specific AND include broader categories
   - Example: For restaurants -> ["Restaurant", "Food & Beverage", "Hospitality", "Food Service"]

2. companySizes: Suggest appropriate company size ranges
   - Use ranges like: "1-10", "10-50", "50-200", "200-500", "500-1000", "1000+"
   - Base this on typical sizes for the industries mentioned
   - Example: For restaurants -> ["1-10", "10-50"] (most are small businesses)

3. geos: Geographic locations
   - BE SPECIFIC: If they mention a state/city, use that exact location
   - Don't default to "United States" if a specific region is mentioned
   - Example: "New Mexico" not "United States"

4. techStack: Relevant technologies these companies likely use
   - Think about what tech stack makes sense for their industry
   - Include 3-5 common tools/platforms
   - Example: For restaurants -> ["Square", "Toast POS", "OpenTable", "Shopify", "Instagram"]

5. titles: Decision-maker job titles to target
   - List 4-6 relevant titles for this industry
   - Include C-level, VP-level, and manager-level roles
   - Example: For restaurants -> ["Owner", "General Manager", "Operations Manager", "Head Chef", "Marketing Director"]

6. languages: Relevant languages
   - Consider the geographic region
   - Default to ["English"] unless context suggests otherwise

7. notes: Enhanced version of the original request with your insights
   - Add context about why these selections make sense
   - Include any assumptions you made

CRITICAL RULES:
- NEVER leave arrays empty - use your knowledge to fill them intelligently
- Be practical and actionable - think about real-world lead generation
- If geographic location is mentioned, be SPECIFIC (don't generalize to country)
- Consider the industry norms for company sizes and tech usage
- Think about who the actual decision-makers are in these companies

Return ONLY valid JSON:
{
  "industries": ["array", "with", "3-5", "items"],
  "companySizes": ["array", "with", "appropriate", "ranges"],
  "geos": ["specific", "locations"],
  "techStack": ["relevant", "technologies"],
  "titles": ["decision", "maker", "titles"],
  "languages": ["relevant", "languages"],
  "notes": "enhanced description with your reasoning"
}`;

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";
    
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: "You are an expert B2B sales strategist. Use your knowledge to intelligently complete ALL ICP form fields. Never leave fields empty - reason about what makes sense for the request."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // temperature: 0.5,
      // max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        industries: Array.isArray(parsed.industries) && parsed.industries.length > 0 ? parsed.industries : ["General Business"],
        companySizes: Array.isArray(parsed.companySizes) && parsed.companySizes.length > 0 ? parsed.companySizes : ["10-50", "50-200"],
        geos: Array.isArray(parsed.geos) && parsed.geos.length > 0 ? parsed.geos : ["United States"],
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        titles: Array.isArray(parsed.titles) && parsed.titles.length > 0 ? parsed.titles : ["CEO", "Founder", "Owner"],
        languages: Array.isArray(parsed.languages) && parsed.languages.length > 0 ? parsed.languages : ["English"],
        notes: parsed.notes || naturalLanguagePrompt,
      };
    }
  } catch (error) {
    console.error("AI form completion failed:", error);
  }

  // Fallback with reasonable defaults
  return {
    industries: ["General Business"],
    companySizes: ["10-50", "50-200"],
    geos: ["United States"],
    techStack: [],
    titles: ["CEO", "Founder", "Owner"],
    languages: ["English"],
    notes: naturalLanguagePrompt,
  };
}

/**
 * Generate intelligent search queries using AI based on ICP
 */
export async function generateAISearchQueries(
  icp: ICPConfig,
  userId: string,
  count: number = 10
): Promise<string[]> {
  try {
    const openai = await openAiHelper(userId);
    if (!openai) {
      console.warn("OpenAI not configured, using fallback queries");
      return generateFallbackQueries(icp);
    }

    const prompt = `Generate ${count} highly effective search queries to find companies matching this profile:

Industries: ${icp.industries?.join(", ") || "Any"}
Geographies: ${icp.geos?.join(", ") || "Global"}
Tech Stack: ${icp.techStack?.join(", ") || "Any"}
Company Sizes: ${icp.companySizes?.join(", ") || "Any"}
Target Titles: ${icp.titles?.join(", ") || "Any"}
${icp.notes ? `Additional Notes: ${icp.notes}` : ""}

Requirements:
1. Focus on finding company websites and directories
2. Use site: operators for LinkedIn, Crunchbase, etc.
3. Include industry-specific terms
4. Vary query structure for diversity
5. Target business directories and listings

Return ONLY the queries, one per line, no explanations.`;

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";
    
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: "You are an expert at crafting search queries for B2B lead generation. Generate diverse, effective queries that will find relevant company websites."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 1,
    //   max_tokens: 500
    });

    const queries = response.choices[0]?.message?.content
      ?.split("\n")
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.match(/^\d+\./)) // Remove numbering
      .map(q => q.replace(/^["']|["']$/g, "")) // Remove quotes
      .slice(0, count) || [];

    return queries.length > 0 ? queries : generateFallbackQueries(icp);
  } catch (error) {
    console.error("AI query generation failed:", error);
    return generateFallbackQueries(icp);
  }
}

/**
 * Fallback query generation without AI
 */
function generateFallbackQueries(icp: ICPConfig): string[] {
  const industry = icp.industries?.[0] || "technology";
  const geo = icp.geos?.[0] || "United States";
  const tech = icp.techStack?.[0] || "";
  
  return [
    `site:linkedin.com/company ${industry} ${geo}`,
    `site:crunchbase.com/organization ${industry} ${geo}`,
    `${industry} companies in ${geo}`,
    `${industry} startups ${geo}`,
    `top ${industry} companies`,
    ...(tech ? [`${industry} companies using ${tech}`] : [])
  ];
}

/**
 * Analyze company description and extract structured data using AI
 */
export async function analyzeCompanyWithAI(
  domain: string,
  description: string,
  userId: string
): Promise<{
  industry: string | null;
  companyType: string | null;
  techStack: string[];
  businessModel: string | null;
  targetMarket: string | null;
  confidence: number;
}> {
  try {
    const openai = await openAiHelper(userId);
    if (!openai) {
      return {
        industry: null,
        companyType: null,
        techStack: [],
        businessModel: null,
        targetMarket: null,
        confidence: 0
      };
    }

    const prompt = `Analyze this company and extract structured information:

Domain: ${domain}
Description: ${description}

Provide a JSON response with:
1. industry: The primary industry (e.g., "Software & Technology", "E-commerce", "Healthcare")
2. companyType: Type (e.g., "SaaS", "Marketplace", "Agency", "Product")
3. techStack: Array of technologies they likely use (max 5)
4. businessModel: B2B, B2C, B2B2C, etc.
5. targetMarket: Who their customers are
6. confidence: Your confidence in this analysis (0-100)

Return ONLY valid JSON, no markdown formatting.`;

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";
    
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: "You are a B2B company analyst. Analyze companies and return structured JSON data."
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
        industry: parsed.industry || null,
        companyType: parsed.companyType || null,
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        businessModel: parsed.businessModel || null,
        targetMarket: parsed.targetMarket || null,
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50))
      };
    }
  } catch (error) {
    console.error("AI company analysis failed:", error);
  }

  return {
    industry: null,
    companyType: null,
    techStack: [],
    businessModel: null,
    targetMarket: null,
    confidence: 0
  };
}

/**
 * Calculate AI-enhanced ICP fit score
 */
export async function calculateAIICPScore(
  company: {
    domain: string;
    companyName?: string | null;
    description?: string | null;
    industry?: string | null;
    techStack?: any;
  },
  icp: ICPConfig,
  userId: string
): Promise<{
  score: number;
  reasoning: string;
  recommendations: string[];
}> {
  try {
    const openai = await openAiHelper(userId);
    if (!openai) {
      return {
        score: 50,
        reasoning: "AI not available for scoring",
        recommendations: []
      };
    }

    const prompt = `Evaluate how well this company fits the Ideal Customer Profile:

COMPANY:
- Domain: ${company.domain}
- Name: ${company.companyName || "Unknown"}
- Description: ${company.description || "No description"}
- Industry: ${company.industry || "Unknown"}
- Tech Stack: ${JSON.stringify(company.techStack || [])}

IDEAL CUSTOMER PROFILE:
- Target Industries: ${icp.industries?.join(", ") || "Any"}
- Target Geos: ${icp.geos?.join(", ") || "Any"}
- Required Tech: ${icp.techStack?.join(", ") || "Any"}
- Company Sizes: ${icp.companySizes?.join(", ") || "Any"}
- Target Titles: ${icp.titles?.join(", ") || "Any"}
${icp.notes ? `- Additional: ${icp.notes}` : ""}

Provide JSON with:
1. score: 0-100 fit score
2. reasoning: Brief explanation (1-2 sentences)
3. recommendations: Array of 2-3 specific next steps

Return ONLY valid JSON.`;

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";
    
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: "You are a B2B sales intelligence analyst. Evaluate company-ICP fit and provide actionable recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // temperature: 0.4,
      // max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        score: Math.min(100, Math.max(0, parsed.score || 50)),
        reasoning: parsed.reasoning || "Analysis unavailable",
        recommendations: Array.isArray(parsed.recommendations) 
          ? parsed.recommendations.slice(0, 3)
          : []
      };
    }
  } catch (error) {
    console.error("AI ICP scoring failed:", error);
  }

  return {
    score: 50,
    reasoning: "AI scoring unavailable",
    recommendations: []
  };
}

/**
 * Extract contact information from unstructured text using AI
 */
export async function extractContactsWithAI(
  text: string,
  companyDomain: string,
  userId: string
): Promise<Array<{
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  confidence: number;
}>> {
  try {
    const openai = await openAiHelper(userId);
    if (!openai) {
      return [];
    }

    const prompt = `Extract contact information from this text about ${companyDomain}:

${text.substring(0, 2000)}

Find people with:
- Full names
- Job titles
- Email addresses
- Phone numbers
- LinkedIn URLs

Return JSON array with format:
[{
  "name": "Full Name",
  "title": "Job Title",
  "email": "email@domain.com",
  "phone": "+1234567890",
  "linkedin": "https://linkedin.com/in/...",
  "confidence": 0-100
}]

Return ONLY valid JSON array, even if empty [].`;

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";
    
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting structured contact information from unstructured text. Return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // temperature: 0.2,
      // max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      const contacts = parsed.contacts || parsed;
      return Array.isArray(contacts) ? contacts.slice(0, 10) : [];
    }
  } catch (error) {
    console.error("AI contact extraction failed:", error);
  }

  return [];
}

/**
 * Resolve duplicate companies using AI to determine if they're the same entity
 */
export async function resolveDuplicateCompaniesWithAI(
  company1: { domain: string; companyName?: string | null; description?: string | null },
  company2: { domain: string; companyName?: string | null; description?: string | null },
  userId: string
): Promise<{
  areSame: boolean;
  confidence: number;
  reasoning: string;
}> {
  try {
    const openai = await openAiHelper(userId);
    if (!openai) {
      return {
        areSame: false,
        confidence: 0,
        reasoning: "AI not available"
      };
    }

    const prompt = `Determine if these are the same company:

COMPANY A:
- Domain: ${company1.domain}
- Name: ${company1.companyName || "Unknown"}
- Description: ${company1.description || "N/A"}

COMPANY B:
- Domain: ${company2.domain}
- Name: ${company2.companyName || "Unknown"}
- Description: ${company2.description || "N/A"}

Return JSON with:
{
  "areSame": true/false,
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`;

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";
    
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: "You are an expert at entity resolution. Determine if two company records represent the same entity."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // temperature: 0.1,
      // max_tokens: 150,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        areSame: parsed.areSame || false,
        confidence: Math.min(100, Math.max(0, parsed.confidence || 0)),
        reasoning: parsed.reasoning || "Analysis unavailable"
      };
    }
  } catch (error) {
    console.error("AI duplicate resolution failed:", error);
  }

  return {
    areSame: false,
    confidence: 0,
    reasoning: "Analysis failed"
  };
}

/**
 * Generate personalized outreach email using AI
 */
export async function generateOutreachEmailWithAI(
  contact: {
    name: string;
    title?: string | null;
    companyName: string;
    companyDescription?: string | null;
  },
  icp: ICPConfig,
  userId: string
): Promise<{
  subject: string;
  body: string;
}> {
  try {
    const openai = await openAiHelper(userId);
    if (!openai) {
      return {
        subject: `Connecting with ${contact.companyName}`,
        body: `Hi ${contact.name},\n\nI came across ${contact.companyName} and wanted to reach out.\n\nBest regards`
      };
    }

    const prompt = `Create a personalized B2B outreach email:

TO:
- Name: ${contact.name}
- Title: ${contact.title || "Team Member"}
- Company: ${contact.companyName}
- About: ${contact.companyDescription || ""}

CONTEXT:
- We target: ${icp.industries?.join(", ") || "technology companies"}
- In: ${icp.geos?.join(", ") || "global markets"}

Requirements:
1. Professional, concise (3-4 short paragraphs)
2. Reference their company specifically
3. Clear value proposition
4. Strong call-to-action
5. No salesy language

Return JSON:
{
  "subject": "email subject line",
  "body": "email body text"
}`;

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4";
    
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: "You are an expert B2B sales professional. Write personalized, effective outreach emails."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // temperature: 0.7,
      // max_tokens: 400,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        subject: parsed.subject || `Connecting with ${contact.companyName}`,
        body: parsed.body || ""
      };
    }
  } catch (error) {
    console.error("AI email generation failed:", error);
  }

  return {
    subject: `Connecting with ${contact.companyName}`,
    body: `Hi ${contact.name},\n\nI came across ${contact.companyName} and wanted to reach out.\n\nBest regards`
  };
}
