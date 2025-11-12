/**
 * ICP (Ideal Customer Profile) Fit Scoring System
 * Scores companies and contacts based on how well they match the target profile
 */

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

type CompanyData = {
  domain?: string | null;
  companyName?: string | null;
  description?: string | null;
  industry?: string | null;
  techStack?: any;
  socialLinks?: any;
  contactInfo?: any;
};

type ContactData = {
  email?: string | null;
  fullName?: string | null;
  title?: string | null;
  linkedinUrl?: string | null;
  companyDomain?: string | null;
};

/**
 * Calculate company ICP fit score (0-100)
 */
export function calculateCompanyICPScore(company: CompanyData, icp: ICPConfig): number {
  let score = 0;
  let maxScore = 0;
  
  // Industry match (30 points)
  maxScore += 30;
  if (icp.industries && icp.industries.length > 0 && company.industry) {
    const industryMatch = icp.industries.some(targetIndustry => {
      const normalized = targetIndustry.toLowerCase();
      const companyInd = company.industry?.toLowerCase() || '';
      return companyInd.includes(normalized) || normalized.includes(companyInd);
    });
    if (industryMatch) score += 30;
  }
  
  // Tech stack match (25 points)
  maxScore += 25;
  if (icp.techStack && icp.techStack.length > 0 && company.techStack) {
    const companyTech = Array.isArray(company.techStack) 
      ? company.techStack 
      : (company.techStack?.techStack || []);
    
    const techMatches = icp.techStack.filter(targetTech => 
      companyTech.some((t: string) => 
        t.toLowerCase().includes(targetTech.toLowerCase())
      )
    );
    
    const techScore = Math.min(25, (techMatches.length / icp.techStack.length) * 25);
    score += techScore;
  }
  
  // Geography match (20 points)
  maxScore += 20;
  if (icp.geos && icp.geos.length > 0) {
    // Check domain TLD and any address/location data
    const domain = company.domain?.toLowerCase() || '';
    const description = company.description?.toLowerCase() || '';
    const companyName = company.companyName?.toLowerCase() || '';
    
    const geoMatch = icp.geos.some(geo => {
      const normalized = geo.toLowerCase();
      return domain.includes(normalized) || 
             description.includes(normalized) || 
             companyName.includes(normalized);
    });
    
    if (geoMatch) score += 20;
  }
  
  // Data completeness (15 points)
  maxScore += 15;
  let completeness = 0;
  if (company.companyName) completeness += 3;
  if (company.description) completeness += 4;
  if (company.industry) completeness += 3;
  if (company.techStack && Array.isArray(company.techStack) && company.techStack.length > 0) completeness += 3;
  if (company.contactInfo?.email) completeness += 2;
  score += completeness;
  
  // Company size indicators (10 points)
  maxScore += 10;
  if (icp.companySizes && icp.companySizes.length > 0) {
    // Infer size from tech stack complexity, description, etc.
    const description = company.description?.toLowerCase() || '';
    const companyName = company.companyName?.toLowerCase() || '';
    
    const sizeMatch = icp.companySizes.some(size => {
      const normalized = size.toLowerCase();
      return description.includes(normalized) || companyName.includes(normalized);
    });
    
    if (sizeMatch) score += 10;
  }
  
  // Normalize to 0-100 scale
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Calculate contact ICP fit score (0-100)
 */
export function calculateContactICPScore(contact: ContactData, icp: ICPConfig): number {
  let score = 0;
  let maxScore = 0;
  
  // Title match (40 points) - most important for contacts
  maxScore += 40;
  if (icp.titles && icp.titles.length > 0 && contact.title) {
    const contactTitle = contact.title.toLowerCase();
    
    // Check for exact or partial matches
    const titleMatch = icp.titles.some(targetTitle => {
      const normalized = targetTitle.toLowerCase();
      return contactTitle.includes(normalized) || normalized.includes(contactTitle);
    });
    
    if (titleMatch) {
      // Bonus for senior/decision-maker titles
      const seniorKeywords = ['ceo', 'cto', 'cfo', 'vp', 'vice president', 'director', 'head', 'chief', 'founder', 'owner', 'president'];
      const isSenior = seniorKeywords.some(k => contactTitle.includes(k));
      score += isSenior ? 40 : 30;
    }
  }
  
  // LinkedIn presence (20 points)
  maxScore += 20;
  if (contact.linkedinUrl) {
    score += 20;
  }
  
  // Email availability (20 points)
  maxScore += 20;
  if (contact.email) {
    // Bonus for corporate vs generic email
    const email = contact.email.toLowerCase();
    const isGeneric = ['gmail', 'yahoo', 'hotmail', 'outlook'].some(d => email.includes(d));
    score += isGeneric ? 10 : 20;
  }
  
  // Name completeness (10 points)
  maxScore += 10;
  if (contact.fullName) {
    const parts = contact.fullName.trim().split(/\s+/);
    score += parts.length >= 2 ? 10 : 5;
  }
  
  // Company domain (10 points)
  maxScore += 10;
  if (contact.companyDomain) {
    score += 10;
  }
  
  // Normalize to 0-100 scale
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Determine if a company should be filtered out based on ICP
 */
export function shouldExcludeCompany(company: CompanyData, icp: ICPConfig): boolean {
  // Check exclude domains
  if (icp.excludeDomains && company.domain) {
    const normalized = company.domain.toLowerCase();
    if (icp.excludeDomains.some(d => normalized.includes(d.toLowerCase()))) {
      return true;
    }
  }
  
  // Exclude if ICP score is too low (< 30)
  const score = calculateCompanyICPScore(company, icp);
  return score < 30;
}

/**
 * Determine if a contact should be filtered out based on ICP
 */
export function shouldExcludeContact(contact: ContactData, icp: ICPConfig): boolean {
  // Must have at least title or email
  if (!contact.title && !contact.email) {
    return true;
  }
  
  // Exclude if ICP score is too low (< 40)
  const score = calculateContactICPScore(contact, icp);
  return score < 40;
}

/**
 * Rank companies by ICP fit
 */
export function rankCompaniesByICP(companies: CompanyData[], icp: ICPConfig): Array<CompanyData & { icpScore: number }> {
  return companies
    .map(company => ({
      ...company,
      icpScore: calculateCompanyICPScore(company, icp)
    }))
    .filter(c => !shouldExcludeCompany(c, icp))
    .sort((a, b) => b.icpScore - a.icpScore);
}

/**
 * Rank contacts by ICP fit
 */
export function rankContactsByICP(contacts: ContactData[], icp: ICPConfig): Array<ContactData & { icpScore: number }> {
  return contacts
    .map(contact => ({
      ...contact,
      icpScore: calculateContactICPScore(contact, icp)
    }))
    .filter(c => !shouldExcludeContact(c, icp))
    .sort((a, b) => b.icpScore - a.icpScore);
}

/**
 * Generate ICP insights and recommendations
 */
export function generateICPInsights(icp: ICPConfig): {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
} {
  const insights = {
    strengths: [] as string[],
    weaknesses: [] as string[],
    recommendations: [] as string[]
  };
  
  // Analyze ICP configuration
  if (icp.industries && icp.industries.length > 0) {
    insights.strengths.push(`Targeting ${icp.industries.length} specific ${icp.industries.length === 1 ? 'industry' : 'industries'}`);
  } else {
    insights.weaknesses.push('No industry targeting specified');
    insights.recommendations.push('Add target industries to improve lead quality');
  }
  
  if (icp.titles && icp.titles.length > 0) {
    insights.strengths.push(`Targeting ${icp.titles.length} specific job ${icp.titles.length === 1 ? 'title' : 'titles'}`);
  } else {
    insights.weaknesses.push('No job titles specified');
    insights.recommendations.push('Add target job titles (e.g., CEO, CTO, Marketing Director)');
  }
  
  if (icp.techStack && icp.techStack.length > 0) {
    insights.strengths.push(`Filtering by ${icp.techStack.length} ${icp.techStack.length === 1 ? 'technology' : 'technologies'}`);
  } else {
    insights.recommendations.push('Consider adding tech stack requirements for more precise targeting');
  }
  
  if (icp.geos && icp.geos.length > 0) {
    insights.strengths.push(`Geographic targeting: ${icp.geos.join(', ')}`);
  } else {
    insights.recommendations.push('Add geographic targeting to focus on specific markets');
  }
  
  if (!icp.excludeDomains || icp.excludeDomains.length === 0) {
    insights.recommendations.push('Add competitor domains to exclude list');
  }
  
  return insights;
}
