"use client";

import React from "react";

/**
 * Lightweight Amazon Connect CCP embed via iframe.
 * Assumes your instance alias is reachable at https://<alias>.my.connect.aws/ccp-v2/
 * Tip: Users may need to sign in to CCP the first time; iframe will prompt.
 */
export default function ConnectCCP({
  baseUrl,
  height = 480,
}: {
  baseUrl?: string; // e.g. https://your-instance.my.connect.aws
  height?: number;
}) {
  const url = (baseUrl || process.env.NEXT_PUBLIC_CONNECT_BASE_URL || "") + "/ccp-v2/";
  return (
    <div className="rounded border bg-card p-2">
      <div className="text-xs font-semibold mb-2">Amazon Connect Softphone (CCP)</div>
      <iframe
        src={url}
        title="Amazon Connect CCP"
        className="w-full rounded border"
        style={{ height }}
        allow="microphone; autoplay; clipboard-read; clipboard-write;"
      />
      <div className="text-[11px] text-muted-foreground mt-2">
        If you see a sign-in screen, authenticate to the CCP. Audio permissions are needed for softphone.
      </div>
    </div>
  );
}
