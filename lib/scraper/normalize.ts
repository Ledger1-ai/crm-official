/**
 * Data normalization utilities for lead scraping
 * Ensures clean, consistent data across the platform
 */

// Email normalization and validation
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  
  const trimmed = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return null;
  
  // Filter disposable/temporary email domains
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com',
    'throwaway.email', 'mailinator.com', 'trashmail.com'
  ];
  
  const domain = trimmed.split('@')[1];
  if (disposableDomains.includes(domain)) return null;
  
  return trimmed;
}

export function isValidEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) !== null;
}

// Phone normalization to E.164 format
export function normalizePhone(phone: string | null | undefined, defaultCountryCode = '+1'): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If no country code, prepend default
  if (!cleaned.startsWith('+')) {
    cleaned = defaultCountryCode + cleaned;
  }
  
  // Basic validation: must have 8-15 digits after +
  const digits = cleaned.substring(1);
  if (digits.length < 8 || digits.length > 15) return null;
  
  return cleaned;
}

// Name normalization
export function normalizeName(name: string | null | undefined): string | null {
  if (!name) return null;
  
  const trimmed = name.trim();
  if (!trimmed) return null;
  
  // Normalize unicode characters
  const normalized = trimmed.normalize('NFC');
  
  // Remove extra whitespace
  const cleaned = normalized.replace(/\s+/g, ' ');
  
  // Capitalize properly
  return cleaned.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// URL normalization and canonicalization
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Normalize protocol to https
    urlObj.protocol = 'https:';
    
    // Remove www prefix
    urlObj.hostname = urlObj.hostname.replace(/^www\./i, '');
    
    // Remove trailing slash from pathname
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, '');
    
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    
    // Sort remaining params for consistency
    const sortedParams = Array.from(urlObj.searchParams.entries()).sort();
    urlObj.search = new URLSearchParams(sortedParams).toString();
    
    return urlObj.toString();
  } catch {
    return null;
  }
}

// Domain extraction and normalization
export function normalizeDomain(domain: string | null | undefined): string | null {
  if (!domain) return null;
  
  let cleaned = domain.trim().toLowerCase();
  
  // Remove protocol if present
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  
  // Remove www prefix
  cleaned = cleaned.replace(/^www\./i, '');
  
  // Remove path and query string
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  
  // Basic domain validation
  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
  if (!domainRegex.test(cleaned)) return null;
  
  return cleaned;
}

// Company name normalization
export function normalizeCompanyName(name: string | null | undefined): string | null {
  if (!name) return null;
  
  const trimmed = name.trim();
  if (!trimmed) return null;
  
  // Normalize unicode
  let normalized = trimmed.normalize('NFC');
  
  // Remove common suffixes for comparison (but keep in display name)
  const suffixes = [
    'Inc.', 'Inc', 'LLC', 'L.L.C.', 'Corp.', 'Corp', 'Corporation',
    'Ltd.', 'Ltd', 'Limited', 'Co.', 'Company', 'Group', 'GmbH', 'S.A.', 'S.L.'
  ];
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized;
}

// LinkedIn URL normalization
export function normalizeLinkedInUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Must be LinkedIn domain
    if (!urlObj.hostname.includes('linkedin.com')) return null;
    
    // Normalize to https
    urlObj.protocol = 'https:';
    
    // Normalize hostname
    urlObj.hostname = 'www.linkedin.com';
    
    // Remove query params and hash
    urlObj.search = '';
    urlObj.hash = '';
    
    // Remove trailing slash
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, '');
    
    return urlObj.toString();
  } catch {
    return null;
  }
}

// Generate deterministic dedupe keys
export function generateCompanyDedupeKey(domain: string): string {
  const normalized = normalizeDomain(domain);
  return normalized ? `company:${normalized}` : '';
}

export function generatePersonDedupeKey(
  email?: string | null,
  name?: string | null,
  companyDomain?: string | null,
  title?: string | null
): string | null {
  // Priority 1: Email (most reliable)
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    return `person:email:${normalizedEmail}`;
  }
  
  // Priority 2: Name + Company (good for matching)
  const normalizedName = normalizeName(name);
  const normalizedDomain = normalizeDomain(companyDomain);
  if (normalizedName && normalizedDomain) {
    const nameKey = normalizedName.toLowerCase().replace(/\s+/g, '-');
    return `person:name-company:${nameKey}@${normalizedDomain}`;
  }
  
  // Priority 3: Name + Title + Company (less reliable but better than nothing)
  const normalizedTitle = title?.trim().toLowerCase().replace(/\s+/g, '-');
  if (normalizedName && normalizedTitle && normalizedDomain) {
    const nameKey = normalizedName.toLowerCase().replace(/\s+/g, '-');
    return `person:name-title-company:${nameKey}:${normalizedTitle}@${normalizedDomain}`;
  }
  
  // No reliable key possible
  return null;
}

// Confidence scoring for data quality
export function calculateEmailConfidence(email: string | null, source: string): number {
  if (!isValidEmail(email)) return 0;
  
  let confidence = 50; // base confidence
  
  // Boost for verified sources
  if (source === 'linkedin') confidence += 30;
  else if (source === 'company-website') confidence += 20;
  else if (source === 'hunter') confidence += 25;
  else if (source === 'serp') confidence += 10;
  
  // Penalize generic/role-based emails
  const genericPrefixes = ['info', 'contact', 'support', 'admin', 'sales', 'help'];
  const emailPrefix = email?.split('@')[0].toLowerCase() || '';
  if (genericPrefixes.some(prefix => emailPrefix.includes(prefix))) {
    confidence -= 20;
  }
  
  return Math.max(0, Math.min(100, confidence));
}

export function calculatePersonConfidence(data: {
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasLinkedIn?: boolean;
  hasTitle?: boolean;
  hasName?: boolean;
  source?: string;
}): number {
  let confidence = 0;
  
  if (data.hasEmail) confidence += 30;
  if (data.hasPhone) confidence += 15;
  if (data.hasLinkedIn) confidence += 20;
  if (data.hasTitle) confidence += 15;
  if (data.hasName) confidence += 10;
  
  // Source bonus
  if (data.source === 'linkedin') confidence += 10;
  else if (data.source === 'company-website') confidence += 5;
  
  return Math.min(100, confidence);
}

export function calculateCompanyConfidence(data: {
  hasDomain?: boolean;
  hasWebsite?: boolean;
  hasDescription?: boolean;
  hasTechStack?: boolean;
  hasIndustry?: boolean;
  source?: string;
}): number {
  let confidence = 0;
  
  if (data.hasDomain) confidence += 40;
  if (data.hasWebsite) confidence += 20;
  if (data.hasDescription) confidence += 10;
  if (data.hasTechStack) confidence += 15;
  if (data.hasIndustry) confidence += 10;
  
  // Source bonus
  if (data.source === 'crunchbase') confidence += 5;
  else if (data.source === 'linkedin') confidence += 5;
  
  return Math.min(100, confidence);
}
