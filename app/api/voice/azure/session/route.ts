import { NextRequest, NextResponse } from "next/server";

/**
 * Azure OpenAI Realtime Voice: Ephemeral Session Issuer
 *
 * This endpoint issues a short-lived client_secret for the browser to use
 * when negotiating a WebRTC session directly with Azure&#39;s Realtime WebRTC
 * endpoint. It avoids exposing AZURE_OPENAI_API_KEY on the client.
 *
 * Expected client flow:
 * 1) POST /api/voice/azure/session with optional { voice } and wallet context (x-wallet header or body.wallet)
 * 2) Receive JSON { client_secret, ... } from Azure Realtime sessions API
 * 3) Create RTCPeerConnection in browser, capture mic
 * 4) POST SDP offer directly to NEXT_PUBLIC_AZURE_OPENAI_REALTIME_WEBRTC_URL
 *    with Authorization: Bearer <client_secret> and Content-Type: application/sdp
 * 5) Receive SDP answer and setRemoteDescription(answer)
 *
 * Environment variables required:
 * - AZURE_OPENAI_ENDPOINT (e.g. https://<resource>.openai.azure.com/)
 * - AZURE_OPENAI_API_KEY
 * - AZURE_OPENAI_REALTIME_DEPLOYMENT (e.g. gpt-realtime)
 * - AZURE_OPENAI_REALTIME_API_VERSION (e.g. 2025-04-01-preview)
 *
 * Optional gating:
 * - This example enforces that a wallet identifier is provided (x-wallet or body.wallet).
 * - Integrations with getAuthenticatedWallet / Cosmos DB can be wired here if available.
 */

export async function POST(req: NextRequest) {
  try {
    // Parse body safely
    const body = await req.json().catch(() => ({} as any));

    // No wallet gating in this app; proceed without wallet enforcement.
    // (Previously: extract x-wallet/body.wallet and enforce authorization)

    // Read Azure env
    const {
      AZURE_OPENAI_ENDPOINT,
      AZURE_OPENAI_API_KEY,
      AZURE_OPENAI_REALTIME_DEPLOYMENT,
      AZURE_OPENAI_REALTIME_API_VERSION,
    } = process.env as Record<string, string | undefined>;

    if (
      !AZURE_OPENAI_ENDPOINT ||
      !AZURE_OPENAI_API_KEY ||
      !AZURE_OPENAI_REALTIME_DEPLOYMENT ||
      !AZURE_OPENAI_REALTIME_API_VERSION
    ) {
      return NextResponse.json(
        { error: "Azure OpenAI environment variables are not set." },
        { status: 500 }
      );
    }

    // Optional: perform subscription/payment gating here
    // TODO: Integrate getAuthenticatedWallet/isOwnerWallet and Cosmos container usage logs if available.
    // For now, proceed if a wallet identifier is present.

    const voice = String(body?.voice || "coral");

    // Construct sessions URL (trim trailing slashes from endpoint)
    const endpoint = AZURE_OPENAI_ENDPOINT.replace(/\/+$/, "");
    const sessionsUrl = `${endpoint}/openai/realtimeapi/sessions?api-version=${encodeURIComponent(
      AZURE_OPENAI_REALTIME_API_VERSION
    )}`;

    const response = await fetch(sessionsUrl, {
      method: "POST",
      headers: {
        "api-key": AZURE_OPENAI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AZURE_OPENAI_REALTIME_DEPLOYMENT,
        voice: voice || "coral",
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `Azure session failed: ${text || `status ${response.status}`}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Expected to include fields like client_secret (ephemeral token), session_id, expires_at, etc.
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
