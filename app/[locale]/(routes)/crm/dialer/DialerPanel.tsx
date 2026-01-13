'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import CustomCCP from '@/components/voice/CustomCCP';
import PromptGeneratorPanel from '../prompt/PromptGeneratorPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

function isE164(num: string) {
  return /^\+[1-9]\d{1,14}$/.test(num);
}

function parseList(raw: string): { phone: string; leadId?: string }[] {
  const lines = (raw || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => !!l);
  const items: { phone: string; leadId?: string }[] = [];
  for (const line of lines) {
    const parts = line.split(/[,|]/).map((p) => p.trim());
    const phone = parts[0] || '';
    let leadId: string | undefined = undefined;
    if (parts.length > 1) {
      leadId = parts[1] || undefined;
    } else {
      const m = /leadId\s*=\s*([A-Za-z0-9_-]+)/i.exec(line);
      if (m) leadId = m[1];
    }
    items.push({ phone, leadId });
  }
  return items;
}

export default function DialerPanel({ isCompact = false }: { isCompact?: boolean }) {
  const [singlePhone, setSinglePhone] = useState<string>('');
  const [singleLeadId, setSingleLeadId] = useState<string>('');
  const [listRaw, setListRaw] = useState<string>('');
  const [running, setRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [results, setResults] = useState<{ phone: string; leadId?: string; ok: boolean; transactionId?: string; error?: string }[]>([]);
  const stopRef = useRef<boolean>(false);

  // Gating: require an "email_sent" activity for the lead before enabling calls
  const [gateOkSingle, setGateOkSingle] = useState<boolean>(false);
  const [gateCheckingSingle, setGateCheckingSingle] = useState<boolean>(false);

  const parsedList = useMemo(() => parseList(listRaw), [listRaw]);

  // Check gate for the single leadId when it changes
  useEffect(() => {
    const lid = singleLeadId.trim();
    if (!lid) {
      setGateOkSingle(false);
      return;
    }
    setGateCheckingSingle(true);
    fetch(`/api/leads/activities/${encodeURIComponent(lid)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Gate check failed"))))
      .then((d) => {
        const ok = Array.isArray(d?.activities) && d.activities.some((a: any) => a?.type === "email_sent");
        setGateOkSingle(!!ok);
      })
      .catch(() => setGateOkSingle(false))
      .finally(() => setGateCheckingSingle(false));
  }, [singleLeadId]);

  const runSingle = useCallback(async () => {
    try {
      const phone = singlePhone.trim();
      const leadId = singleLeadId.trim() || undefined;

      if (!isE164(phone)) {
        throw new Error('Invalid phone (E.164 required, e.g. +15551234567)');
      }

      // Gated dialing: require a leadId and verify "email_sent" activity exists
      if (!leadId) {
        throw new Error('Lead ID is required. Calls are gated until an outreach email has been sent for the lead.');
      }
      if (!gateOkSingle) {
        throw new Error('Call gated: outreach email has not been sent for this lead yet.');
      }

      // Ensure agent starts listening BEFORE dial by invoking VoiceHub Engage Start
      // includeAgent=true will launch the agent into the meeting; route also handles PSTN via SMA when configured.
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let walletOverride = '';
      try {
        // Optional wallet forwarding to include prompt in agent config if available (stored by Prompt push)
        walletOverride = (localStorage.getItem('voicehub:wallet') || '').toLowerCase();
        if (walletOverride) headers['x-wallet'] = walletOverride;
      } catch { }
      // Silent credit check prior to start
      try {
        await fetch('/api/voicehub/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletOverride: walletOverride || undefined }),
        });
      } catch { }
      // Auto-start VoiceHub session when dialing
      try {
        await fetch('/api/voicehub/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'start', payload: { leadId }, walletOverride: walletOverride || undefined }),
        });
        // Open VoiceHub Console to surface credit approval modal on user gesture (Dial Now)
        try {
          const vhBase = String(process.env.NEXT_PUBLIC_VOICEHUB_BASE_URL || '').trim();
          if (vhBase) {
            const win = window.open(`${vhBase}/console`, '_blank', 'noopener,noreferrer');
            if (!win) {
              toast('Enable popups to approve credits');
            }
          }
        } catch { }
      } catch { }
      const res = await fetch('/api/voice/engage/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone, includeAgent: true, leadId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || 'Engage start failed');
      }

      setResults((prev) => [{ phone, leadId, ok: true, transactionId: String(j?.call?.transactionId || 'engage'), error: undefined }, ...prev].slice(0, 100));
      toast.success(`Agent started and engage initiated for ${phone}`);
    } catch (e: any) {
      setResults((prev) => [{ phone: singlePhone.trim(), leadId: singleLeadId.trim() || undefined, ok: false, error: e?.message || String(e) }, ...prev].slice(0, 100));
      toast.error(e?.message || 'Failed to start');
    }
  }, [singlePhone, singleLeadId, gateOkSingle]);

  const stopRun = useCallback(() => {
    stopRef.current = true;
    setRunning(false);
  }, []);

  const runListSequential = useCallback(async () => {
    if (!parsedList.length) {
      toast.error('Enter at least one phone number');
      return;
    }
    stopRef.current = false;
    setRunning(true);
    setCurrentIndex(0);
    for (let i = 0; i < parsedList.length; i++) {
      if (stopRef.current) break;
      const { phone, leadId } = parsedList[i];
      setCurrentIndex(i);
      try {
        const num = String(phone).trim();
        if (!isE164(num)) {
          throw new Error(`Invalid E.164: ${num}`);
        }
        // Gated dialing: require leadId and confirm "email_sent" activity exists
        if (!leadId) {
          throw new Error('Lead ID required for gated calls');
        }
        {
          const gateRes = await fetch(`/api/leads/activities/${encodeURIComponent(leadId)}`);
          if (!gateRes.ok) throw new Error('Gate check failed');
          const d = await gateRes.json();
          const okGate = Array.isArray(d?.activities) && d.activities.some((a: any) => a?.type === 'email_sent');
          if (!okGate) throw new Error('Call gated: outreach email not sent for this lead');
        }

        // Start agent listening before dial for each entry
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        let walletOverride = '';
        try {
          walletOverride = (localStorage.getItem('voicehub:wallet') || '').toLowerCase();
          if (walletOverride) headers['x-wallet'] = walletOverride;
        } catch { }
        // Silent credit check prior to start
        try {
          await fetch('/api/voicehub/credits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletOverride: walletOverride || undefined }),
          });
        } catch { }
        // Auto-start VoiceHub session when dialing list entries
        try {
          await fetch('/api/voicehub/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'start', payload: { leadId }, walletOverride: walletOverride || undefined }),
          });
          // Open VoiceHub Console to surface credit approval modal on user gesture (Run list)
          try {
            const vhBase = String(process.env.NEXT_PUBLIC_VOICEHUB_BASE_URL || '').trim();
            if (vhBase) {
              const win = window.open(`${vhBase}/console`, '_blank', 'noopener,noreferrer');
              if (!win) {
                toast('Enable popups to approve credits');
              }
            }
          } catch { }
        } catch { }
        const res = await fetch('/api/voice/engage/start', {
          method: 'POST',
          headers,
          body: JSON.stringify({ phone: num, includeAgent: true, leadId }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(j?.error || 'Engage start failed');
        }
        setResults((prev) => [{ phone: num, leadId, ok: true, transactionId: String(j?.call?.transactionId || 'engage'), error: undefined }, ...prev].slice(0, 100));
      } catch (e: any) {
        setResults((prev) => [{ phone, leadId, ok: false, error: e?.message || String(e) }, ...prev].slice(0, 100));
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
    setRunning(false);
    setCurrentIndex(-1);
    toast.success('Run complete');
  }, [parsedList]);



  function appendDial(char: string) {
    setSinglePhone((prev) => {
      let base = (prev || '').replace(/[^\d+]/g, '');
      if (char === '+') return base.startsWith('+') ? base : '+' + base;
      if (!base.startsWith('+')) base = '+' + base.replace(/^\+*/, '');
      const digit = char.replace(/[^\d]/g, '');
      return base + digit;
    });
  }
  function backspaceDial() {
    setSinglePhone((prev) => {
      const base = prev || '';
      if (!base) return '';
      const next = base.slice(0, -1);
      return next === '+' ? '' : next;
    });
  }
  function clearDial() {
    setSinglePhone('');
  }

  const FullLayout = () => (
    <div className="w-full px-1 py-2 space-y-4">
      {/* Connect CCP Softphone */}
      <section className="rounded-md border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Connect Softphone</div>
        </div>
        <CustomCCP
          theme="dark" // Assuming dark theme is standard
          title="Connect Softphone"
          subtitle="Custom CCP (Streams invisible provider)"
        />
      </section>

      {/* Single Dial */}
      <section className="rounded-md border bg-card p-4">
        <div className={cn("grid gap-3", isCompact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
          <div>
            <label className="text-xs font-medium">Phone (E.164)</label>
            <Input
              placeholder="+18885551212"
              value={singlePhone}
              onChange={(e) => setSinglePhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Lead ID (optional)</label>
            <Input
              placeholder="lead-id-123"
              value={singleLeadId}
              onChange={(e) => setSingleLeadId(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={runSingle} disabled={!singlePhone.trim() || !singleLeadId.trim() || gateCheckingSingle || !gateOkSingle}>
              Dial Now
            </Button>
          </div>
        </div>
      </section>

      {/* List Dial */}
      {!isCompact && (
        <section className="rounded-md border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Custom Call List</h3>
          <div className="space-y-2">
            <label className="text-xs font-medium">Numbers (one per line). Optional leadId by comma or pipe.</label>
            <Textarea
              rows={8}
              placeholder={`+18885551212\n+18885551213,lead-123\n+18885551214|lead-456`}
              value={listRaw}
              onChange={(e) => setListRaw(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Button onClick={runListSequential} disabled={!parsedList.length || running}>
                {running ? `Running (${currentIndex + 1}/${parsedList.length})` : 'Run'}
              </Button>
              {running && (
                <Button variant="outline" onClick={stopRun}>
                  Stop
                </Button>
              )}
            </div>
            <p className="microtext text-muted-foreground">
              Example lines: +15551234567 or +15551234567,lead-789 or +15551234567|lead-789
            </p>
          </div>
        </section>
      )}

      {/* Recent results */}
      {!isCompact && (
        <section className="rounded-md border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Recent Results</h3>
          <div className="text-xs space-y-1">
            {results.length === 0 && <div className="opacity-70">No calls yet.</div>}
            {results.slice(0, 25).map((r, idx) => (
              <div key={`${r.phone}-${idx}`} className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded ${r.ok ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {r.ok ? 'OK' : 'ERR'}
                </span>
                <span className="font-mono">{r.phone}</span>
                {r.leadId ? <span className="opacity-70">({r.leadId})</span> : null}
                {r.ok ? (
                  <span className="opacity-80">tx={r.transactionId || '-'}</span>
                ) : (
                  <span className="opacity-80">error={r.error || '-'}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prompt Generator */}
      {!isCompact && (
        <section className="rounded-md border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Prompt Generator</h3>
          <PromptGeneratorPanel embedded={true} showSoftphone={false} />
        </section>
      )}
    </div>
  );

  if (!isCompact) {
    return <FullLayout />;
  }

  // Compact Layout (Tabs)
  return (
    <div className="w-full h-full flex flex-col">
      <Tabs defaultValue="dial" className="w-full flex-1 flex flex-col">
        <div className="px-4 py-2 border-b bg-muted/20">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dial">Phone</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Config</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <TabsContent value="dial" className="mt-0 space-y-4">
            {/* Softphone */}
            <div className="rounded-lg border bg-card/50 p-3 shadow-sm">
              <CustomCCP theme="dark" title="Softphone" subtitle="Connected" />
            </div>

            {/* Single Dial Form */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Number</label>
                <Input
                  placeholder="+1..."
                  value={singlePhone}
                  onChange={(e) => setSinglePhone(e.target.value)}
                  className="text-lg font-mono h-11"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Lead ID (Opt)</label>
                <Input
                  placeholder="lead-123"
                  value={singleLeadId}
                  onChange={(e) => setSingleLeadId(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <Button
                size="lg"
                className="w-full font-semibold text-base mt-2"
                onClick={runSingle}
                disabled={!singlePhone.trim() || !singleLeadId.trim() || gateCheckingSingle || !gateOkSingle}
              >
                Call Now
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium">Bulk Dial List</label>
              <Textarea
                rows={12}
                className="font-mono text-xs"
                placeholder={`+18885550001\n+18885550002,lead-A`}
                value={listRaw}
                onChange={(e) => setListRaw(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={runListSequential} disabled={!parsedList.length || running}>
                {running ? 'Running...' : 'Start Batch'}
              </Button>
              {running && <Button size="sm" variant="destructive" onClick={stopRun}>Stop</Button>}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="space-y-2">
              {results.length === 0 && <div className="text-sm text-center py-8 text-muted-foreground">No recent calls</div>}
              {results.map((r, i) => (
                <div key={i} className="flex items-start justify-between p-2 rounded border bg-card/50 text-xs">
                  <div>
                    <div className="font-mono font-medium">{r.phone}</div>
                    {r.leadId && <div className="text-muted-foreground">{r.leadId}</div>}
                  </div>
                  <div className={cn("px-1.5 py-0.5 rounded font-bold", r.ok ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500")}>
                    {r.ok ? 'OK' : 'ERR'}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 h-full">
            {/* Embedded Prompt Gen but scaled down? Or just hidden if too complex */}
            <div className="text-xs text-muted-foreground mb-4">
              Configure agent prompts and settings. call scripts.
            </div>
            <PromptGeneratorPanel embedded={true} showSoftphone={false} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
