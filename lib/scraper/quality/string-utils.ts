/*
 * String Utilities for Lead Scraping
 * Common helpers for merging, deduping, trimming, and normalizing arrays/strings.
 */

// Trim a string safely
export function safeTrim(input?: any): string {
  return (input == null ? "" : String(input)).trim();
}

// Normalize whitespace (collapse runs to a single space)
export function normalizeWhitespace(input?: any): string {
  return safeTrim(input).replace(/\s{2,}/g, " ");
}

// Unique strings with optional case-insensitive mode
export function uniqueStrings(list: any[], caseInsensitive = true): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list || []) {
    const s = safeTrim(item);
    if (!s) continue;
    const k = caseInsensitive ? s.toLowerCase() : s;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  return out;
}

// Merge two string arrays into a unique set
export function mergeStringSets(a?: any, b?: any, caseInsensitive = true): string[] {
  const arrA = Array.isArray(a) ? a.map(safeTrim) : [];
  const arrB = Array.isArray(b) ? b.map(safeTrim) : [];
  return uniqueStrings([...arrA, ...arrB], caseInsensitive);
}

// Prefer longer, non-empty string (ties return first)
export function pickLonger(a?: any, b?: any): string {
  const A = safeTrim(a);
  const B = safeTrim(b);
  return B.length > A.length ? B : A;
}

// Remove consecutive duplicate tokens (case-insensitive)
export function collapseRepeats(input?: any): string {
  const s = safeTrim(input);
  const tokens = s.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (i === 0 || tokens[i].toLowerCase() !== tokens[i - 1].toLowerCase()) {
      out.push(tokens[i]);
    }
  }
  return out.join(" ");
}

// Title-case words
export function capitalizeWords(input?: any): string {
  return safeTrim(input)
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

export default {
  safeTrim,
  normalizeWhitespace,
  uniqueStrings,
  mergeStringSets,
  pickLonger,
  collapseRepeats,
  capitalizeWords,
};
