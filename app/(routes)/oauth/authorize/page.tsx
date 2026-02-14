"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * BasaltCRM OAuth Consent
 * Branded authorize screen for VoiceHub ↔ BasaltCRM OAuth (Authorization Code + PKCE).
 *
 * Query Params expected (passed through from /api/oauth/authorize):
 * - response_type=code
 * - client_id=VOICEHUB_CLIENT_ID
 * - redirect_uri=https://voicehub.example.com/api/crm/connect/callback (or a console page)
 * - scope=softphone:control outreach:write leads:read
 * - state=random-string
 * - code_challenge=BASE64URL(SHA256(code_verifier))
 * - code_challenge_method=S256
 *
 * On "Approve", we redirect the browser to:
 *   redirect_uri?code=mock_code_...&state=...
 * NOTES:
 * - This is a branded UI wrapper around the scaffolded flow. The token endpoint accepts the mock code.
 * - In a full impl, we'd mint a real code server-side and persist PKCE info to validate at /oauth/token.
 */

function randomCode(): string {
  return "mock_code_" + Math.random().toString(36).slice(2, 10);
}

export default function BasaltAuthorizePage() {
  const params = useSearchParams();

  const data = useMemo(() => {
    const responseType = params.get("response_type") || "code";
    const clientId = params.get("client_id") || "";
    const redirectUri = params.get("redirect_uri") || "";
    const scope = params.get("scope") || "softphone:control outreach:write leads:read";
    const state = params.get("state") || "";
    const codeChallenge = params.get("code_challenge") || "";
    const codeChallengeMethod = params.get("code_challenge_method") || "S256";
    return { responseType, clientId, redirectUri, scope, state, codeChallenge, codeChallengeMethod };
  }, [params]);

  const isPopup = useMemo(() => params.get("popup") === "1", [params]);

  // Show who is authenticated and auto-complete if opened as popup
  const [userDisplay, setUserDisplay] = useState<string>("");
  const [autoMsg, setAutoMsg] = useState<string>("");

  useEffect(() => {
    // Fetch current CRM user to show authentication status
    fetch("/api/user", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("unauthorized"))))
      .then((j) => {
        const name = j?.user?.name || j?.user?.email || "";
        if (name) setUserDisplay(String(name));
      })
      .catch(() => {
        setUserDisplay("");
      });
  }, []);

  function handleApprove() {
    try {
      // Generate code server-side with authenticated user context
      fetch("/api/oauth/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: data.clientId,
          redirectUri: data.redirectUri,
          scope: data.scope,
          codeChallenge: data.codeChallenge,
          challengeMethod: data.codeChallengeMethod,
        }),
      })
        .then((r) => r.json())
        .then((j) => {
          if (!j?.ok || !j?.code) {
            alert(j?.error || "Failed to generate authorization code");
            return;
          }
          const code = j.code;

          // If opened as a popup, postMessage back to opener and close the window
          if (window.opener) {
            const targetOrigin = (() => {
              try {
                const ru = data.redirectUri ? new URL(data.redirectUri) : null;
                return ru ? ru.origin : "*";
              } catch {
                return "*";
              }
            })();
            window.opener.postMessage(
              { type: "ledger1crm_oauth_code", code, state: data.state || "" },
              targetOrigin
            );
            window.close();
            return;
          }

          // Fallback: redirect to redirect_uri with code/state (non-popup scenario)
          if (!data.redirectUri) {
            alert("Missing redirect_uri");
            return;
          }
          const u = new URL(data.redirectUri);
          u.searchParams.set("code", code);
          if (data.state) u.searchParams.set("state", data.state);
          window.location.href = u.toString();
        })
        .catch((e: any) => {
          alert(e?.message || "Failed to approve");
        });
    } catch (e: any) {
      alert(e?.message || "Failed to approve");
    }
  }

  function handleCancel() {
    // Navigate back or close window
    try {
      if (window.opener) {
        window.close();
      } else {
        history.back();
      }
    } catch {
      history.back();
    }
  }

  // If popup + authenticated + opener exists, auto-approve to complete VoiceHub connect
  useEffect(() => {
    if (!isPopup) return;
    // Guard for SSR
    if (typeof window === "undefined") return;
    if (!window.opener) return;
    if (!userDisplay) return;

    setAutoMsg("Connecting to VoiceHub...");
    const t = setTimeout(() => {
      try {
        // Reuse approve flow to post code/state to opener and close
        (handleApprove as any)();
      } catch {
        // ignore
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopup, userDisplay]);

  // Hide scrollbars/shell in popup by locking body scroll while this page is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);



  return (
    <div id="basaltcrm-popup" className="fixed inset-0 z-[10000] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {isPopup && null}
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <img src="/BasaltCRMWide.png" alt="BasaltCRM" className="h-8 w-auto rounded-md" />
          <div className="flex flex-col">
            <div className="text-sm font-semibold">BasaltCRM Authorization</div>
            <div className="text-[11px] opacity-70">Grant access to VoiceHub</div>
          </div>

          {userDisplay ? (
            <div className="text-xs mb-2">
              Signed in as <span className="font-medium">{userDisplay}</span>.{" "}
              {isPopup ? (autoMsg || "Approve to continue.") : null}
            </div>
          ) : (
            <div className="text-xs mb-2 opacity-80">
              Not signed in. Please sign in to BasaltCRM if prompted, then approve access.
            </div>
          )}
        </div>

        <div className="rounded-md border border-white/10 p-3 mb-3">
          <div className="text-xs font-semibold mb-1">Request Details</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div className="opacity-70">Client ID</div>
            <div className="font-mono break-all">{data.clientId || "-"}</div>

            <div className="opacity-70">Redirect URI</div>
            <div className="font-mono break-all">{data.redirectUri || "-"}</div>

            <div className="opacity-70">Response Type</div>
            <div>{data.responseType}</div>

            <div className="opacity-70">Scope</div>
            <div className="font-mono break-all">{data.scope}</div>

            <div className="opacity-70">State</div>
            <div className="font-mono break-all">{data.state || "-"}</div>

            <div className="opacity-70">PKCE Method</div>
            <div>{data.codeChallengeMethod}</div>

            <div className="opacity-70">Code Challenge</div>
            <div className="font-mono break-all">{data.codeChallenge || "-"}</div>
          </div>
        </div>

        <div className="rounded-md border border-emerald-500/30 bg-emerald-900/10 p-3 mb-3">
          <div className="text-xs font-semibold mb-1">Permissions Requested</div>
          <ul className="text-[11px] list-disc list-inside opacity-90">
            <li>softphone:control — Use the embedded CCP and manage call lifecycle</li>
            <li>outreach:write — Create/send email outreach and log activities</li>
            <li>leads:read — Read lead context for AI prompts and call guidance</li>
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <Button className="h-8" onClick={handleApprove}>
            Approve
          </Button>
          <Button className="h-8" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <span className="microtext opacity-60">
            By approving, you allow VoiceHub to access the scopes listed above for your account.
          </span>
        </div>
      </div>
    </div>
  );
}
