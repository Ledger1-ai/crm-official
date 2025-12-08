/*
 * Edge Case Normalizers & Quality Guards for Lead Scraping
 * Purpose: centralize heuristics to improve data quality and reduce duplicates/garbage.
 * Scope:
 * - Concatenated headings to readable labels (e.g., "Contactme" -> "Contact me")
 * - Navigation labels and generic words detection (avoid treating them as person names)
 * - Email quality filtering (noreply, wix/squarespace, example.com, etc.)
 * - Tech stack normalization (canonical names + alias mapping)
 * - Phone normalization
 * - String merging helpers (prefer informative, dedupe tokens, collapse whitespace)
 */

// Common nav/header-like labels that often leak into names
export const NAV_LABELS = [
  "about", "about us", "our story", "who we are",
  "team", "our team", "leadership", "leadership team", "people", "staff",
  "contact", "contact me", "contact us", "get in touch", "reach out",
  "careers", "jobs", "join us", "work with us",
  "company", "company info", "company profile",
  "press", "press & media", "media", "newsroom",
  "blog", "articles", "resources",
  "privacy policy", "terms of service", "terms", "legal",
  "support", "help", "faq", "documentation"
];

// Dictionary for concatenated/pascal/camel words to readable labels
// Include plural/singular/variants (case-insensitive)
const CONCAT_WORD_FIXES: Record<string, string> = {
  // Contact-related
  "contactme": "Contact me",
  "contactus": "Contact us",
  "getintouch": "Get in touch",
  "reachout": "Reach out",
  // About-related
  "aboutus": "About us",
  "ourstory": "Our story",
  "whoweare": "Who we are",
  // Team-related
  "meettheteam": "Meet the team",
  "teammembers": "Team members",
  "leadershipteam": "Leadership team",
  // Careers-related
  "careerspage": "Careers page",
  "joinus": "Join us",
  "workwithus": "Work with us",
  // Press/Media
  "pressmedia": "Press & media",
  "newsroom": "Newsroom",
  // Misc policies
  "privacypolicy": "Privacy policy",
  "termsofservice": "Terms of service",
  // Resources
  "learnmore": "Learn more",
  "resources": "Resources",
};

// Email domains/indicators to ignore (marketing platforms, CMS, examples, and no-reply style)
const BAD_EMAIL_PATTERNS = [
  /(^|[^a-z])noreply@/i,
  /no[-_]?reply@/i,
  /do[-_]?not[-_]?reply@/i,
  /donotreply@/i,
  /@example\.com$/i,
  /@domain\.com$/i,
  /@email\.com$/i,
  /@sentry/i,
  /@wix/i,
  /@squarespace/i,
  /@(?:info|support|help)\.example$/i,
];

// Tech stack alias mapping -> canonical names
const TECH_ALIASES: Record<string, string> = {
  // Frameworks/Libraries
  "reactjs": "React",
  "react": "React",
  "vuejs": "Vue.js",
  "vue": "Vue.js",
  "angularjs": "Angular",
  "angular": "Angular",
  "nextjs": "Next.js",
  "next": "Next.js",
  "nuxtjs": "Nuxt.js",
  "nuxt": "Nuxt.js",
  "gatsby": "Gatsby",
  // Backends
  "nodejs": "Node.js",
  "node": "Node.js",
  "expressjs": "Express",
  "express": "Express",
  "laravel": "Laravel",
  "rails": "Ruby on Rails",
  "ruby on rails": "Ruby on Rails",
  "django": "Django",
  // CMS/Commerce
  "wordpress": "WordPress",
  "wp": "WordPress",
  "shopifyplus": "Shopify",
  "shopify": "Shopify",
  // Marketing/CRM
  "hubspot": "HubSpot",
  "salesforce": "Salesforce",
  "pardot": "Pardot",
  "marketo": "Marketo",
  // Support/Chat
  "intercom": "Intercom",
  "zendesk": "Zendesk",
  "drift": "Drift",
};

// Collapse repeated tokens (e.g., "Direct Direct")
export function collapseRepeats(input: string): string {
  const tokens = input.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (i === 0 || t.toLowerCase() !== tokens[i - 1].toLowerCase()) {
      out.push(t);
    }
  }
  return out.join(" ");
}

// Insert spaces for camelCase/PascalCase, then apply dictionary fixes & cleanup
export function fixConcatenatedWords(input?: string | null): string {
  if (!input) return "";
  let s = String(input).trim();
  // Split lowercase-to-Upper boundaries (camelCase-like)
  s = s.replace(/([a-z])([A-Z])/g, "$1 $2");
  // Remove non-word separators around common connectors
  s = s.replace(/[-_]+/g, " ");
  // Dictionary fixes (case-insensitive)
  const key = s.replace(/\s+/g, "").toLowerCase();
  if (CONCAT_WORD_FIXES[key]) s = CONCAT_WORD_FIXES[key];
  // Collapse whitespace and repeated tokens
  s = s.replace(/\s{2,}/g, " ");
  s = collapseRepeats(s);
  return s.trim();
}

// Detect if a label is a nav/header label and not a person name
export function isNavLabel(input?: string | null): boolean {
  if (!input) return false;
  const s = fixConcatenatedWords(input).toLowerCase();
  return NAV_LABELS.includes(s);
}

// Email quality guard
export function shouldIgnoreEmail(email?: string | null): boolean {
  if (!email) return true;
  const e = String(email).trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return true;
  return BAD_EMAIL_PATTERNS.some((re) => re.test(e));
}

// Normalize a tech stack list to canonical names with de-duplication
export function normalizeTechStack(list?: any): string[] {
  const out: string[] = [];
  const add = (val: string) => {
    const key = val.toLowerCase().trim();
    const canonical = TECH_ALIASES[key] || capitalizeWords(val.trim());
    if (!out.includes(canonical)) out.push(canonical);
  };
  if (Array.isArray(list)) {
    list.forEach((x) => {
      if (!x) return;
      add(String(x));
    });
  } else if (typeof list === "string") {
    list.split(/[,;\n]/).forEach((x) => add(x));
  }
  return out;
}

// Phone normalization: keep digits, format as +1 (xxx) xxx-xxxx if US-like; otherwise return digits-only string
export function normalizePhoneDigits(input?: string | null): string {
  if (!input) return "";
  const digits = String(input).replace(/\D+/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    const area = digits.slice(1, 4);
    const mid = digits.slice(4, 7);
    const end = digits.slice(7);
    return `+1 (${area}) ${mid}-${end}`;
  }
  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const mid = digits.slice(3, 6);
    const end = digits.slice(6);
    return `(${area}) ${mid}-${end}`;
  }
  // Fallback: return digit-only (international/country codes preserved)
  return `+${digits}`.replace(/^\+$/,'');
}

// Prefer more informative string (longer non-empty); fallback to other
export function preferInformative(a?: string | null, b?: string | null): string {
  const A = (a || "").trim();
  const B = (b || "").trim();
  if (B.length > A.length) return B;
  return A;
}

// Title case utility for canonical names
export function capitalizeWords(input: string): string {
  return input
    .split(/\s+/)
    .map((w) => w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)
    .join(" ");
}

// Full name candidate clean-up pipeline for extracted labels
export function normalizeNameCandidate(name?: string | null): string {
  // 1) Fix concatenations/pascal/camel
  let s = fixConcatenatedWords(name);
  // 2) Remove nav/header labels
  if (isNavLabel(s)) return "";
  // 3) Collapse repeats and whitespace
  s = collapseRepeats(s);
  s = s.replace(/\s{2,}/g, " ");
  // 4) Title-case, but preserve known acronyms minimally
  s = capitalizeWords(s);
  return s.trim();
}

// Merge two arrays of strings to a unique, clean set
export function mergeStringSets(a?: any, b?: any): string[] {
  const arrA = Array.isArray(a) ? a.map(String) : [];
  const arrB = Array.isArray(b) ? b.map(String) : [];
  const set = new Set<string>([...arrA, ...arrB].map((x) => x.trim()).filter(Boolean));
  return Array.from(set);
}

// Example guard pipeline for contact objects (optional usage)
export function sanitizeContact(contact: { name?: string; email?: string; phone?: string; title?: string; linkedin?: string; }): { name: string; email?: string; phone?: string; title?: string; linkedin?: string; } | null {
  const cleanedName = normalizeNameCandidate(contact.name);
  const email = contact.email && !shouldIgnoreEmail(contact.email) ? contact.email : undefined;
  const phone = contact.phone ? normalizePhoneDigits(contact.phone) : undefined;
  const title = contact.title ? fixConcatenatedWords(contact.title) : undefined;
  const linkedin = contact.linkedin ? String(contact.linkedin).trim() : undefined;

  // If both email and phone are missing and name is empty, drop it
  if (!email && !phone && !cleanedName) return null;
  return { name: cleanedName, email, phone, title, linkedin };
}

export default {
  NAV_LABELS,
  fixConcatenatedWords,
  isNavLabel,
  shouldIgnoreEmail,
  normalizeTechStack,
  normalizePhoneDigits,
  preferInformative,
  capitalizeWords,
  normalizeNameCandidate,
  mergeStringSets,
  sanitizeContact,
};
