import { google } from "googleapis";
import { prismadb } from "@/lib/prisma";

// Scopes: send and modify (read/thread access for replies/bounces)
export const GMAIL_SCOPES = [
  // Gmail scopes: send, modify, and read profile
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.readonly",
  // Calendar scopes for availability, scheduling, listing, and colors/settings
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.settings.readonly",
  // OIDC scopes (optional) for email identity when needed
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.settings.basic",
];

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

/**
 * Get the production base URL, with fallback to crm.ledger1.ai
 */
function getProductionBaseUrl(): string {
  const explicit = (process.env.GMAIL_REDIRECT_URI || "").trim();
  const nextAuthUrl = (process.env.NEXTAUTH_URL || "").trim().replace(/\/$/, "");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");

  // Helper to check if URL is localhost
  const isLocalhost = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(url);

  // Production fallback
  const PRODUCTION_FALLBACK = "https://crm.basalthq.com";

  // Priority order:
  // 1. Explicit GMAIL_REDIRECT_URI if not localhost
  // 2. NEXTAUTH_URL if not localhost
  // 3. NEXT_PUBLIC_APP_URL if not localhost  
  // 4. Production fallback

  if (explicit && !isLocalhost(explicit)) {
    // Extract base from explicit redirect URI (remove /api/google/callback if present)
    const explicitBase = explicit.replace(/\/api\/google\/callback\/?$/, "");
    return explicitBase;
  }

  if (nextAuthUrl && !isLocalhost(nextAuthUrl)) {
    return nextAuthUrl;
  }

  if (appUrl && !isLocalhost(appUrl)) {
    // Ensure protocol
    if (!appUrl.startsWith("http://") && !appUrl.startsWith("https://")) {
      return `https://${appUrl}`;
    }
    return appUrl;
  }

  // In production (NODE_ENV=production), always use production fallback if we got here
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_FALLBACK;
  }

  // In development, allow localhost
  if (nextAuthUrl) return nextAuthUrl;
  if (appUrl) return appUrl.startsWith("http") ? appUrl : `http://${appUrl}`;

  return "http://localhost:3000";
}

/**
 * Get the redirect URI that will be used for OAuth.
 * Exported for debugging/diagnostic purposes.
 */
export function getOAuth2ClientRedirectUri(): string {
  const baseUrl = getProductionBaseUrl();
  return `${baseUrl}/api/google/callback`;
}

export function getOAuth2Client() {
  const clientId = requireEnv("GMAIL_CLIENT_ID");
  const clientSecret = requireEnv("GMAIL_CLIENT_SECRET");

  const redirectUri = getOAuth2ClientRedirectUri();

  // Log for debugging in case of issues (will appear in server logs)
  if (process.env.NODE_ENV === "production") {
    console.log("[GMAIL_OAUTH] Using redirect URI:", redirectUri);
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Create OAuth consent URL for the current user.
 * Persisting userId in state allows mapping back on callback.
 */
export function getGmailAuthUrl(userId: string) {
  const oauth2 = getOAuth2Client();
  const state = Buffer.from(JSON.stringify({ u: userId })).toString("base64url");
  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent",
    include_granted_scopes: true,
    state,
  });
  return url;
}

/**
 * Exchange code for tokens and upsert into gmail_Tokens for the user.
 */
export async function exchangeCodeForTokens(userId: string, code: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    // In some cases Google doesn't resend refresh_token if already granted; ensure we keep existing one.
    const existing = await prismadb.gmail_Tokens.findFirst({ where: { user: userId } });
    await prismadb.gmail_Tokens.upsert({
      where: { id: existing?.id || "new" },
      update: {
        access_token: tokens.access_token || existing?.access_token || "",
        refresh_token: tokens.refresh_token || existing?.refresh_token || "",
        scope: tokens.scope || existing?.scope || undefined,
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : existing?.expiry_date || undefined,
        provider: "google",
        updatedAt: new Date(),
      } as any,
      create: {
        user: userId,
        provider: "google",
        access_token: tokens.access_token || "",
        refresh_token: tokens.refresh_token || existing?.refresh_token || "",
        scope: tokens.scope || undefined,
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    });
  } else {
    await prismadb.gmail_Tokens.create({
      data: {
        user: userId,
        provider: "google",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope || undefined,
        expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    });
  }
  return tokens;
}

/**
 * Return an authorized gmail client for send/sync operations.
 * Will set credentials from DB and attempt to refresh when expired.
 */
export async function getGmailClientForUser(userId: string) {
  const oauth2 = getOAuth2Client();
  const token = await prismadb.gmail_Tokens.findFirst({ where: { user: userId }, orderBy: { updatedAt: "desc" } });
  if (!token) return null;

  oauth2.setCredentials({
    access_token: token.access_token || undefined,
    refresh_token: token.refresh_token || undefined,
    scope: token.scope || undefined,
    expiry_date: token.expiry_date ? new Date(token.expiry_date).getTime() : undefined,
  });

  // Attempt a silent refresh (googleapis refreshes automatically when needed). Optionally persist.
  try {
    const newTokens = await oauth2.getAccessToken();
    if (newTokens?.token && newTokens.token !== token.access_token) {
      await prismadb.gmail_Tokens.update({
        where: { id: token.id },
        data: { access_token: newTokens.token, updatedAt: new Date() } as any,
      });
    }
  } catch {
    // Ignore; refresh happens lazily on API call as well
  }

  return google.gmail({ version: "v1", auth: oauth2 });
}

/**
 * Utility: send an HTML email via Gmail API for a user. Falls back to null if not connected.
 */
export async function sendViaGmail(
  userId: string,
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<string | null> {
  const gmail = await getGmailClientForUser(userId);
  if (!gmail) return null;

  // Build multipart/alternative RFC822 message (base64url)
  const boundary = "mixed_" + Math.random().toString(36).slice(2);
  const bodyText = text || html.replace(/<[^>]*>/g, "");
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary=${boundary}`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=\"UTF-8\"",
    "",
    bodyText,
    `--${boundary}`,
    "Content-Type: text/html; charset=\"UTF-8\"",
    "",
    html,
    `--${boundary}--`,
  ].join("\r\n");

  const encoded = Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw: encoded } });
  return res.data.id || null;
}

/**
 * Get a Google OAuth2 client seeded with the user's stored credentials.
 */
export async function getGoogleOAuth2ForUser(userId: string) {
  const oauth2 = getOAuth2Client();
  const token = await prismadb.gmail_Tokens.findFirst({ where: { user: userId }, orderBy: { updatedAt: "desc" } });
  if (!token) return null;

  oauth2.setCredentials({
    access_token: token.access_token || undefined,
    refresh_token: token.refresh_token || undefined,
    scope: token.scope || undefined,
    expiry_date: token.expiry_date ? new Date(token.expiry_date).getTime() : undefined,
  });

  return oauth2;
}

/**
 * Return an authorized Google Calendar client for a user.
 */
export async function getCalendarClientForUser(userId: string) {
  const oauth2 = await getGoogleOAuth2ForUser(userId);
  if (!oauth2) return null;
  return google.calendar({ version: "v3", auth: oauth2 });
}
