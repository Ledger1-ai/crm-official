import { NextResponse } from "next/server";

/**
 * Azure OpenAI Realtime Voice WebRTC SDP answer proxy
 *
 * The browser cannot expose the Azure API key. This endpoint proxies the
 * client-side RTCPeerConnection offer SDP to Azure&#39;s Realtime WebRTC endpoint
 * and returns the SDP answer for establishing the media/data channels.
 *
 * Client usage:
 * 1) Create RTCPeerConnection
 * 2) add local audio track (mic)
 * 3) pc.createOffer() -> sdpOffer
 * 4) POST sdpOffer as text/plain to /api/voice/azure/answer
 * 5) Receive SDP answer and setRemoteDescription(answer)
 *
 * Environment:
 * - AZURE_OPENAI_API_KEY
 * - NEXT_PUBLIC_AZURE_OPENAI_REALTIME_WEBRTC_URL
 * - NEXT_PUBLIC_AZURE_OPENAI_REALTIME_DEPLOYMENT
 * - NEXT_PUBLIC_AZURE_OPENAI_REALTIME_API_VERSION
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let sdpOffer: string | null = null;

    if (contentType.includes("application/sdp") || contentType.includes("text/plain")) {
      sdpOffer = await req.text();
    } else if (contentType.includes("application/json")) {
      const json = await req.json();
      sdpOffer = typeof json?.sdp === "string" ? json.sdp : null;
    }

    if (!sdpOffer) {
      return new NextResponse("Missing SDP offer in request body", { status: 400 });
    }

    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const directUrl = process.env.NEXT_PUBLIC_AZURE_OPENAI_REALTIME_WEBRTC_URL;
    const deployment =
      process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT ||
      process.env.NEXT_PUBLIC_AZURE_OPENAI_REALTIME_DEPLOYMENT;
    const apiVersion =
      process.env.AZURE_OPENAI_REALTIME_API_VERSION ||
      process.env.NEXT_PUBLIC_AZURE_OPENAI_REALTIME_API_VERSION;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/+$/, "");

    // Build URL preferring the WebRTC preview URL (realtimertc) for WebRTC, fallback to standard endpoint
    let url: string | null = null;
    if (directUrl && apiVersion) {
      url = `${directUrl}?deployment=${encodeURIComponent(
        deployment || ""
      )}&api-version=${encodeURIComponent(apiVersion)}`;
    }
    if (!url && endpoint && deployment && apiVersion) {
      url = `${endpoint}/openai/realtime?deployment=${encodeURIComponent(
        deployment
      )}&api-version=${encodeURIComponent(apiVersion)}`;
    }

    if (!apiKey || !url) {
      return new NextResponse("Azure OpenAI Realtime config missing", { status: 500 });
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp",
        "Accept": "application/sdp",
        // Include both headers to satisfy preview runtime auth expectations
        "api-key": apiKey,
        "Authorization": `Bearer ${apiKey}`,
      },
      body: sdpOffer,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: {
            status: res.status,
            message: errText || "Failed to get SDP answer from Azure",
          },
        },
        { status: res.status }
      );
    }

    const sdpAnswer = await res.text();
    return new NextResponse(sdpAnswer, {
      status: 200,
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (error: any) {
    console.error("[AZURE_REALTIME_SDP_ANSWER]", error);
    return new NextResponse(error?.message || "Server error", { status: 500 });
  }
}
