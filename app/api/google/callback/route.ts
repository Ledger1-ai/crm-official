import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/gmail";

/**
 * GET /api/google/callback
 * OAuth2 redirect URI handler for Google (Gmail/Calendar).
 * - Expects query params: ?code=...&state=base64url({ u: userId })
 * - Exchanges code for tokens and persists them in gmail_Tokens.
 * - Redirects back to CRM UI.
 *
 * Ensure your GMAIL_REDIRECT_URI env var matches this route:
 *   e.g. https://your-crm-domain.com/api/google/callback
 */
export async function GET(req: Request) {
  const url = new URL(req.url);

  // Fix: Use configured app URL instead of request origin (which might be internal container ID)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const nextAuthUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "";

  // Priority: NEXT_PUBLIC_APP_URL -> NEXTAUTH_URL -> Request Origin (fallback)
  const origin = appUrl || nextAuthUrl || url.origin;

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new NextResponse("Missing code/state", { status: 400 });
  }

  try {
    // Decode state: base64url(JSON.stringify({ u: userId }))
    let userId: string | undefined;
    try {
      const decoded = Buffer.from(state, "base64url").toString("utf8");
      const parsed = JSON.parse(decoded);
      userId = parsed?.u as string | undefined;
    } catch {
      return new NextResponse("Invalid state", { status: 400 });
    }

    if (!userId) {
      return new NextResponse("Missing user in state", { status: 400 });
    }

    await exchangeCodeForTokens(userId, code);

    // Redirect back to CRM Leads page indicating success
    const redirectOk = `${origin}/en/crm/leads?google=connected`;
    return NextResponse.redirect(redirectOk, { status: 302 });
  } catch (e: any) {

    console.error("[GOOGLE_OAUTH_CALLBACK]", e?.message || e);
    const redirectErr = `${origin}/en/crm/leads?google=error`;
    return NextResponse.redirect(redirectErr, { status: 302 });
  }
}
