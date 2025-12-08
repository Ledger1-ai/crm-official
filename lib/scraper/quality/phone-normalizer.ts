/*
 * Phone Normalizer (Global-first)
 * Purpose: Normalize arbitrary phone strings from any region.
 * Strategy:
 * - Preserve international numbers when possible
 * - Convert 00 international prefix to +
 * - Prefer E.164-like output when a country code is present or length suggests intl (11-15 digits)
 * - Only apply US-local formatting for clearly US-style numbers (10 digits) or NANP +1 (11 digits)
 * - Fall back to digits-only when we cannot infer a country code
 */

export type PhoneFormat = "us_local" | "us_e164" | "intl_e164" | "digits_only";

// Extract digits and note if original had "+" or leading "00"
export function extractCore(input?: string | null): { digits: string; hadPlus: boolean; had00: boolean } {
  if (!input) return { digits: "", hadPlus: false, had00: false };
  const raw = String(input).trim();
  const hadPlus = /^\s*\+/.test(raw);
  const had00 = /^\s*00\d/.test(raw);
  const digits = raw.replace(/\D+/g, "");
  return { digits, hadPlus, had00 };
}

export function normalizeUSLocal(digits: string): string | null {
  // 10 digits => (AAA) BBB-CCCC
  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const mid = digits.slice(3, 6);
    const end = digits.slice(6);
    return `(${area}) ${mid}-${end}`;
  }
  // 11 digits starting with 1 => +1 (AAA) BBB-CCCC
  if (digits.length === 11 && digits.startsWith("1")) {
    const area = digits.slice(1, 4);
    const mid = digits.slice(4, 7);
    const end = digits.slice(7);
    return `+1 (${area}) ${mid}-${end}`;
  }
  return null;
}

// Convert core digits to an E.164-like representation
export function toE164Loose(digits: string, hadPlus: boolean, had00: boolean): string {
  // If original had a plus, keep it
  if (hadPlus) return `+${digits}`;
  // If it had a 00 prefix, convert to + and drop the 00
  if (had00 && digits.startsWith("00")) return `+${digits.slice(2)}`;
  // If we appear to have a country code (11-15 digits), assume international
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  // Otherwise we cannot safely infer a country code
  return digits; // digits-only fallback (not valid E.164)
}

export function normalizePhone(
  input?: string | null,
  opts: { preferUS?: boolean } = {}
): { normalized: string; format: PhoneFormat } {
  const { digits, hadPlus, had00 } = extractCore(input);
  if (!digits) return { normalized: "", format: "digits_only" };

  // If 10 digits (classic NANP local), optionally present as US local for readability
  if (digits.length === 10) {
    if (opts.preferUS) {
      const usLocal = normalizeUSLocal(digits);
      if (usLocal) return { normalized: usLocal, format: "us_local" };
    }
    // If not preferring US, keep digits-only (ambiguous country) to avoid mislabeling
    return { normalized: digits, format: "digits_only" };
  }

  // If 11 digits starting with 1 -> NANP E.164
  if (digits.length === 11 && digits.startsWith("1")) {
    if (opts.preferUS) {
      const usLocal = normalizeUSLocal(digits);
      if (usLocal) return { normalized: usLocal, format: "us_e164" };
    }
    return { normalized: `+${digits}`, format: "us_e164" };
  }

  // Otherwise, attempt intl E.164-like
  const intl = toE164Loose(digits, hadPlus, had00);
  if (intl.startsWith("+")) return { normalized: intl, format: "intl_e164" };

  // Fallback when we cannot infer country code
  return { normalized: digits, format: "digits_only" };
}

export default { extractCore, normalizeUSLocal, toE164Loose, normalizePhone };
