/*
 * Email Deobfuscation & Extraction (Global)
 * Purpose: decode and extract emails hidden/obfuscated in page text and hrefs.
 * Handles common patterns: [at]/(at)/ at /@ variants, [dot]/(dot)/ dot /. variants,
 * HTML entities, ROT13 (e.g., "znvygb:" → "mailto:"), and simple Base64.
 */

const AT_TOKENS = [
  "[at]", "(at)", "{at}", "<at>", " at ", " ( at ) ",
  "[AT]", "(AT)", "{AT}",
  "[\uFF20]", "＠", "\uFF20",
  // language words for '@'
  "arroba", "at-sign", "atsign"
];
const DOT_TOKENS = [
  "[dot]", "(dot)", "{dot}", "<dot>", " dot ", " ( dot ) ",
  "[DOT]", "(DOT)",
  "·", "•",
  // language words for '.'
  "punkt", "point", "punto", "ponto", "tecka"
];

function removeZeroWidth(raw: string): string {
  // Remove zero-width and special hidden characters
  return raw.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
}

function decodeHexEscapes(raw: string): string {
  // Decode JS/CSS style escapes: \xNN, \uNNNN, and \\NNNN (CSS)
  let s = raw;
  s = s.replace(/\\x([0-9A-Fa-f]{2})/g, (_m, hh) => String.fromCharCode(parseInt(hh, 16)));
  s = s.replace(/\\u([0-9A-Fa-f]{4})/g, (_m, u) => String.fromCharCode(parseInt(u, 16)));
  s = s.replace(/\\([0-9A-Fa-f]{2,6})/g, (_m, hex) => {
    const code = parseInt(hex, 16);
    if (!Number.isFinite(code)) return _m as unknown as string;
    try { return String.fromCharCode(code); } catch { return _m as unknown as string; }
  });
  return s;
}

function safeDecodeURIComponent(raw: string): string {
  try {
    // Only attempt if there's a percent-escape
    return /%[0-9A-Fa-f]{2}/.test(raw) ? decodeURIComponent(raw) : raw;
  } catch {
    return raw;
  }
}

function replaceAtAndDot(raw: string): string {
  let s = removeZeroWidth(raw);
  // Normalize spacing to simplify matching
  s = s.replace(/\s+/g, " ");
  // Replace common AT tokens with @
  for (const t of AT_TOKENS) {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    s = s.replace(re, "@");
  }
  // Replace common DOT tokens with .
  for (const t of DOT_TOKENS) {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    s = s.replace(re, ".");
  }
  // Also handle words: "name at domain dot com" → "name@domain.com"
  s = s.replace(/\b(at|arroba|at-sign|atsign)\b/gi, "@");
  s = s.replace(/\b(dot|punkt|point|tecka|punto|ponto)\b/gi, ".");
  return s;
}

function decodeHtmlEntities(raw: string): string {
  // Decode numeric entities
  return raw
    // decimal: &#NNN;
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(parseInt(d, 10) || 0))
    // hex: &#xNNN;
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCharCode(parseInt(h, 16) || 0))
    // minimal named: & < > " '
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}

function rot13(s: string): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function tryBase64Decode(s: string): string | null {
  // Basic heuristic: looks like Base64 and decodes to ASCII
  const maybe = s.trim();
  if (!/^([A-Za-z0-9+/]+={0,2})$/.test(maybe)) return null;
  try {
    const buf = Buffer.from(maybe, 'base64');
    const out = buf.toString('utf8');
    // sanity: must contain @ to be an email-like string
    if (out && /@/.test(out)) return out;
  } catch {}
  return null;
}

// Extract classic emails from text after deobfuscation.
function extractEmails(text: string): string[] {
  const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(pattern) || [];
  return Array.from(new Set(matches.map((e) => e.trim())));
}

// Decode possible obfuscations (text + hrefs) and return normalized emails
export function decodeEmailCandidates(rawText?: string, hrefs?: string[]): string[] {
  const out: string[] = [];
  const push = (e?: string | null) => {
    if (!e) return;
    const s = e.trim();
    if (!s) return;
    if (!out.includes(s)) out.push(s);
  };

  const text0 = String(rawText || "");
  const text1 = removeZeroWidth(text0);
  const text2 = decodeHtmlEntities(text1);
  const text3 = decodeHexEscapes(text2);
  const text4 = safeDecodeURIComponent(text3);
  const replaced = replaceAtAndDot(text4);
  extractEmails(replaced).forEach(push);

  // Try ROT13 decoding on the raw text (e.g., "znvygb:")
  const rot = rot13(text4);
  const rotReplaced = replaceAtAndDot(rot);
  extractEmails(rotReplaced).forEach(push);

  // Inspect hrefs: mailto, base64 payloads, JS-concatenations
  for (const h of hrefs || []) {
    const href0 = decodeHtmlEntities(h);
    const href1 = decodeHexEscapes(href0);
    const href = safeDecodeURIComponent(href1);
    // mailto: direct
    if (/^mailto:/i.test(href)) {
      const addr = safeDecodeURIComponent(href.replace(/^mailto:/i, '').split('?')[0]);
      const cleaned = replaceAtAndDot(addr);
      extractEmails(cleaned).forEach(push);
      continue;
    }
    // Base64 in query or URL fragment
    const b64Match = href.match(/[?&#]([A-Za-z0-9+/]+={0,2})/);
    if (b64Match) {
      const dec = tryBase64Decode(b64Match[1]);
      if (dec) extractEmails(dec).forEach(push);
    }
    // Simple JS concatenations like "name"+"@"+"domain"+".com" when rendered into href
    const concatClean = replaceAtAndDot(href);
    extractEmails(concatClean).forEach(push);
  }

  return out;
}

export default { decodeEmailCandidates };
