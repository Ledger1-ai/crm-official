/*
 * Contact Sanitizer
 * Composes normalization and filtering libraries to produce high-quality contact objects for lead scraping.
 * - Cleans names (concatenations, nav labels, casing)
 * - Filters low-quality emails (no-reply, placeholders, disposables, platform senders)
 * - Normalizes phones (US/international formats)
 * - Canonicalizes tech stacks
 * - Provides utilities to merge contacts and choose informative strings
 */

import { normalizeNameCandidate, NormalizeNameOptions } from "./text-concatenation";
import { NAV_LABELS, isNavLabel } from "./nav-labels";
import { shouldIgnoreEmail as emailIgnore, classifyEmail, normalizeEmail } from "./email-filters";
import { normalizePhone as phoneNormalize } from "./phone-normalizer";
import { normalizeTechStack } from "./tech-normalizer";
import { mergeStringSets, pickLonger, safeTrim } from "./string-utils";

export type ContactInput = {
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  linkedin?: string;
};

export type ContactSanitizeOptions = {
  // Name normalization options (extendable)
  nameOpts?: NormalizeNameOptions;
  // Additional nav labels to drop beyond NAV_LABELS
  extraNavLabels?: string[];
  // If true, remove emails classified as role/generic unless no better alternative exists
  deprioritizeRoleEmails?: boolean;
};

export type SanitizedContact = {
  name: string;
  email?: string;
  emailClass?: "personal" | "role" | "generic" | "unknown";
  phone?: string;
  title?: string;
  linkedin?: string;
};

// Determine whether the normalized name is a nav/header label and should be dropped
function isDroppedName(name: string, extraNavLabels: string[] = []): boolean {
  const lower = name.toLowerCase();
  if (isNavLabel(lower)) return true;
  if (extraNavLabels.length) {
    const set = new Set(extraNavLabels.map((x) => x.toLowerCase()));
    if (set.has(lower)) return true;
  }
  return false;
}

// Normalize a single contact
export function sanitizeContact(contact: ContactInput, opts: ContactSanitizeOptions = {}): SanitizedContact | null {
  const { nameOpts, extraNavLabels = [], deprioritizeRoleEmails = false } = opts;

  // Name cleanup
  const cleanedName = normalizeNameCandidate(contact.name, {
    navLabels: [...NAV_LABELS, ...extraNavLabels],
    dropNavLabels: true,
    ...(nameOpts || {}),
  });

  // Email filtering
  const emailNorm = contact.email ? normalizeEmail(contact.email) : "";
  const { ignore: emailBad } = emailIgnore(emailNorm);
  const emailClass = classifyEmail(emailNorm);
  const emailFinal = emailBad ? undefined : emailNorm;

  // Phone normalization
  const phoneRes = phoneNormalize(contact.phone);
  const phoneFinal = phoneRes.normalized || undefined;

  // Title normalization (basic trim)
  const titleFinal = safeTrim(contact.title) || undefined;

  // LinkedIn normalization (basic trim + URL-like check)
  const linkedinRaw = safeTrim(contact.linkedin);
  const linkedinFinal = linkedinRaw && /linkedin\.com\//i.test(linkedinRaw) ? linkedinRaw : undefined;

  // Drop if clearly no usable information
  const hasEmail = !!emailFinal;
  const hasPhone = !!phoneFinal;
  const candidateName = cleanedName || "";

  if (!hasEmail && !hasPhone && !candidateName) return null;
  if (candidateName && isDroppedName(candidateName, extraNavLabels)) return null;

  // Optionally deprioritize role emails: if name is nav-like and only role email present, drop
  if (deprioritizeRoleEmails && emailFinal && emailClass === "role" && !candidateName && !hasPhone) {
    return null;
  }

  return {
    name: candidateName,
    email: emailFinal,
    emailClass,
    phone: phoneFinal,
    title: titleFinal,
    linkedin: linkedinFinal,
  };
}

// Merge two contacts, preferring informative strings and combining where possible
export function mergeContacts(a: SanitizedContact, b: SanitizedContact): SanitizedContact {
  return {
    name: pickLonger(a.name, b.name),
    email: a.email || b.email,
    emailClass: a.emailClass || b.emailClass,
    phone: a.phone || b.phone,
    title: pickLonger(a.title, b.title),
    linkedin: a.linkedin || b.linkedin,
  };
}

// Normalize tech stack array attached to a company/contact metadata
export function sanitizeTechStack(list?: any): string[] {
  return normalizeTechStack(list);
}

export default {
  sanitizeContact,
  mergeContacts,
  sanitizeTechStack,
};
