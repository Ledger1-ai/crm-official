import { NextRequest, NextResponse } from "next/server";

/**
 * GET /oauth/authorize
 * Scaffold for BasaltCRM OAuth Authorization Code + PKCE provider.
 *
 * Query params:
 * - response_type=code
 * - client_id=VOICEHUB_CLIENT_ID
 * - redirect_uri=https://voicehub.example.com/api/crm/connect/callback (or similar)
 * - scope=softphone:control outreach:write leads:read
 * - state=random-string
 * - code_challenge=BASE64URL(SHA256(code_verifier))
 * - code_challenge_method=S256
 *
 * Behavior (scaffold):
 * - Validates required parameters and returns a simulated "authorize_url" that VoiceHub would open.
 * - In a full implementation, this would render a consent screen and on approval redirect to redirect_uri?code=...&state=...
 */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const responseType = url.searchParams.get("response_type");
    const clientId = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
    const scope = url.searchParams.get("scope") || "softphone:control outreach:write leads:read";
    const state = url.searchParams.get("state") || "";
    const codeChallenge = url.searchParams.get("code_challenge");
    const codeChallengeMethod = url.searchParams.get("code_challenge_method") || "S256";
    const modeJson = url.searchParams.get("json") === "1";

    if (responseType !== "code") {
      return NextResponse.json({ ok: false, error: "invalid_response_type" }, { status: 400 });
    }
    if (!clientId) {
      return NextResponse.json({ ok: false, error: "missing_client_id" }, { status: 400 });
    }
    if (!redirectUri) {
      return NextResponse.json({ ok: false, error: "missing_redirect_uri" }, { status: 400 });
    }
    if (!codeChallenge || codeChallengeMethod !== "S256") {
      return NextResponse.json({ ok: false, error: "invalid_pkce" }, { status: 400 });
    }

    // If caller explicitly wants JSON, preserve scaffold JSON behavior.
    if (modeJson) {
      const mockCode = `mock_code_${Math.random().toString(36).slice(2, 10)}`;
      const suggestedRedirect = `${redirectUri}${redirectUri.includes("?") ? "&" : "?"}code=${encodeURIComponent(mockCode)}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
      return NextResponse.json(
        {
          ok: true,
          clientId,
          scope,
          state,
          codeChallengeMethod,
          authorize_url: url.toString(),
          suggested_redirect: suggestedRedirect,
          note: "Scaffold JSON: add json=1 to keep this behavior; default flow redirects to branded UI.",
        },
        { status: 200 }
      );
    }

    // Default: redirect to branded consent UI (valid URL path) preserving all query params (locale default: en)
    // Note: route groups like (authpopup) are not part of the URL; use a query flag to indicate popup behavior
    const origin = url.origin;
    const ui = new URL(`${origin}/oauth/authorize`);
    // forward known params
    ui.searchParams.set("response_type", responseType!);
    ui.searchParams.set("client_id", clientId!);
    ui.searchParams.set("redirect_uri", redirectUri!);
    ui.searchParams.set("scope", scope);
    if (state) ui.searchParams.set("state", state);
    ui.searchParams.set("code_challenge", codeChallenge!);
    ui.searchParams.set("code_challenge_method", codeChallengeMethod);
    // hint to UI to render as popup
    ui.searchParams.set("popup", "1");
    return NextResponse.redirect(ui.toString(), { status: 302 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
