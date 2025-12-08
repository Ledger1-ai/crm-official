/*
 * Email Filters & Classification Library
 * Purpose: Identify and filter low-quality or non-actionable emails (no-reply, examples, CMS/platform senders,
 * disposable domains, test/dev artifacts), and provide utilities to normalize and classify addresses for lead scraping.
 */

export type EmailClass = "personal" | "role" | "generic" | "unknown";

// Common role/generic local-parts that are rarely decision-maker inboxes
const ROLE_LOCALS = new Set<string>([
  // Core role/generic
  "info", "contact", "hello", "support", "help", "sales", "billing",
  "admin", "webmaster", "postmaster", "service", "cs", "customer",
  "team", "hr", "jobs", "careers", "press", "media",
  // Additional departments & roles
  "marketing", "growth", "pr", "publicrelations", "communications",
  "editor", "editorial", "news", "newsletter", "updates", "notifications",
  "finance", "accounting", "legal", "compliance", "security",
  "recruiting", "talent", "people", "peopleops",
  "it", "ops", "operations", "supportdesk"
]);

// Low-quality local-parts
const BAD_LOCALS = new Set<string>([
  // English variants
  "noreply", "no-reply", "no_reply", "do-not-reply", "donotreply", "do_not_reply",
  // Spanish
  "noresponder", "no-responder",
  // French
  "nepasrepondre", "ne-pas-repondre",
  // German
  "nichtantworten", "nicht-antworten",
  // Portuguese
  "naoresponder", "nao-responder",
  // Italian
  "norispondere", "non-rispondere",
  // Czech (ASCII approximations)
  "neodpovidejte", "neodpovidat",
  // System/bounce
  "autoresponder", "mailerdaemon", "mailer-daemon", "bounce", "bounces",
  // Testing/dev placeholders
  "test", "testing", "sample", "example", "dev", "demo",
  // Bulk communications
  "newsletter", "updates", "notifications"
]);

// Known placeholder/example domains
const PLACEHOLDER_DOMAINS = new Set<string>([
  "example.com", "example.org", "example.net", "domain.com", "email.com",
  "placeholder.com"
]);

// Disposable/throwaway mail providers (representative list)
const DISPOSABLE_DOMAINS = new Set<string>([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "temp-mail.org",
  "trashmail.com", "yopmail.com", "getnada.com", "dispostable.com",
  // Expanded global list (representative)
  "maildrop.cc", "trashmail.io", "tempmail.dev", "tempmail.io", "moakt.com", "tempail.com",
  "harakirimail.com", "mintemail.com", "sharklasers.com", "grr.la", "guerrillamail.de",
  "guerrillamail.info", "guerrillamail.org", "guerrillamail.net",
  // More popular disposable/temporary mail providers
  "tempmail.email", "tempmail.us", "temp-mail.io", "mailnesia.com", "getairmail.com"
]);

// CMS/platform senders & marketing infra often not target inboxes
const PLATFORM_DOMAIN_PATTERNS: RegExp[] = [
  /@wix\./i,
  /@squarespace\./i,
  /@shopify\./i,
  /@bigcommerce\./i,
  /@hubspot\./i,
  /@mailchimp\./i,
  /@sendgrid\./i,
  /@constantcontact\./i,
  /@pardot\./i,
  /@marketo\./i,
  /@salesforce\./i,
  /@intercom\./i,
  // Global email platforms
  /@sendinblue\./i,
  /@brevo\./i,
  /@postmarkapp\./i,
  /@postmark\./i,
  /@mailgun\./i,
  /@sparkpost\./i,
  /@amazonses\./i,
  /@ses\.amazonaws\.com/i,
  /@mailer\./i,
  // Additional marketing & transactional platforms
  /@resend\./i,
  /@mailerlite\./i,
  /@klaviyo\./i,
  /@customer\.io/i,
  /@convertkit\./i,
  /@campaignmonitor\./i,
  /@elasticemail\./i,
  /@mailjet\./i,
  /@messagebird\./i,
  /@activecampaign\./i,
];

// Basic RFC-like email format check
export function isValidEmailFormat(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export function normalizeEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase();
}

export function getLocalPart(email: string): string {
  const at = email.indexOf("@");
  return at >= 0 ? email.slice(0, at) : email;
}

export function getDomainPart(email: string): string {
  const at = email.indexOf("@");
  return at >= 0 ? email.slice(at + 1) : "";
}

export type IgnoreReason =
  | "invalid_format"
  | "placeholder_domain"
  | "disposable_domain"
  | "no_reply"
  | "platform_sender"
  | "testing"
  | "empty";

export type ShouldIgnoreEmailResult = { ignore: boolean; reason?: IgnoreReason };

export function shouldIgnoreEmail(email?: string | null): ShouldIgnoreEmailResult {
  if (!email) return { ignore: true, reason: "empty" };
  const e = normalizeEmail(email);
  if (!isValidEmailFormat(e)) return { ignore: true, reason: "invalid_format" };

  const local = getLocalPart(e).replace(/\./g, ""); // collapse dots for matching
  const domain = getDomainPart(e);

  if (PLACEHOLDER_DOMAINS.has(domain)) return { ignore: true, reason: "placeholder_domain" };
  if (DISPOSABLE_DOMAINS.has(domain)) return { ignore: true, reason: "disposable_domain" };
  if (BAD_LOCALS.has(local)) return { ignore: true, reason: "no_reply" };
  if (local.includes("test") || local.includes("demo") || local.includes("example")) {
    return { ignore: true, reason: "testing" };
  }
  if (PLATFORM_DOMAIN_PATTERNS.some((re) => re.test(e))) return { ignore: true, reason: "platform_sender" };

  return { ignore: false };
}

export function classifyEmail(email?: string | null): EmailClass {
  const e = normalizeEmail(email);
  if (!isValidEmailFormat(e)) return "unknown";
  const local = getLocalPart(e);
  if (ROLE_LOCALS.has(local)) return "role";
  // Heuristic: contains dot, underscore or hyphen likely personal naming schemes
  if (/[._-]/.test(local)) return "personal";
  // Otherwise treat as generic (e.g., store@domain)
  return "generic";
}

export default {
  isValidEmailFormat,
  normalizeEmail,
  getLocalPart,
  getDomainPart,
  shouldIgnoreEmail,
  classifyEmail,
};
