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
import { useVaruniLink } from '@/app/hooks/use-varuni-link';
import { Zap, Shield, XCircle, Phone } from 'lucide-react';

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
  const [status, setStatus] = useState<'available' | 'break' | 'offline'>('available');
  const [callActive, setCallActive] = useState<boolean>(false);

  const [results, setResults] = useState<{ phone: string; leadId?: string; ok: boolean; transactionId?: string; error?: string }[]>([]);
  const stopRef = useRef<boolean>(false);

  // VaruniLink Integration
  const { activeBattlecards, processTranscriptStream, dismissBattlecard } = useVaruniLink(null);

  // Simulate transcript stream for demo purposes when running
  useEffect(() => {
    if (!running && results.length === 0) return;

    // Mock: emits random keywords every few seconds to test battlecards
    const mockInterval = setInterval(() => {
      const keywords = ["competitor", "price", "hubspot", "salesforce", "too expensive"];
      const randomWord = keywords[Math.floor(Math.random() * keywords.length)];
      // console.log("Simulating transcript word:", randomWord);
      processTranscriptStream(`User said something about ${randomWord} just now.`);
    }, 5000);

    return () => clearInterval(mockInterval);
  }, [running, results, processTranscriptStream]);

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
    fetch(`/api/crm/leads/${encodeURIComponent(lid)}/activities`)
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
          const gateRes = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}/activities`);
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

      {/* Active Battlecards (VaruniLink) */}
      {!isCompact && activeBattlecards.length > 0 && (
        <section className="rounded-md border-amber-500/30 bg-amber-500/5 p-4 border animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-amber-600">Live Battlecards (VaruniLink)</h3>
          </div>
          <div className="space-y-3">
            {activeBattlecards.map(card => (
              <div key={card.id} className="bg-background/80 border border-amber-200/50 p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">{card.trigger_keyword} Detected</span>
                  <button onClick={() => dismissBattlecard(card.id)}><XCircle className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>
                </div>
                <h4 className="font-bold text-sm mt-1">{card.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{card.content}</p>
                <div className="mt-2 space-y-1">
                  {card.counter_arguments.map((arg, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{arg}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
    <div className={cn("w-full flex flex-col", isCompact ? "h-[480px]" : "h-full")}>
      <Tabs defaultValue="dial" className="w-full h-full flex flex-col min-h-0">
        <div className="px-3 py-1.5 border-b bg-muted/20 flex-none">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="dial" className="text-[10px] py-1">Phone</TabsTrigger>
            <TabsTrigger value="list" className="text-[10px] py-1">List</TabsTrigger>
            <TabsTrigger value="history" className="text-[10px] py-1">History</TabsTrigger>
            <TabsTrigger value="settings" className="text-[10px] py-1">Config</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <TabsContent value="dial" className="mt-0 p-3 space-y-2 overflow-hidden flex-none">
            {/* Status Controls */}
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatus('available')}
                className={cn(
                  "flex flex-col h-11 gap-0.5 border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10",
                  status === 'available' && "border-amber-500 ring-0.5 ring-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                )}
              >
                <div className="h-1 w-1 rounded-full bg-amber-500 shadow-[0_0_3px_rgba(245,158,11,1)]" />
                <span className="text-[9px] uppercase font-bold tracking-tighter">Available</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatus('break')}
                className={cn(
                  "flex flex-col h-11 gap-0.5 border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10",
                  status === 'break' && "border-amber-500 ring-0.5 ring-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                )}
              >
                <Zap className="h-2.5 w-2.5 text-amber-500" />
                <span className="text-[9px] uppercase font-bold tracking-tighter">Break</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatus('offline')}
                className={cn(
                  "flex flex-col h-11 gap-0.5 border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10",
                  status === 'offline' && "border-amber-500 ring-0.5 ring-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                )}
              >
                <XCircle className="h-2.5 w-2.5 text-amber-500" />
                <span className="text-[9px] uppercase font-bold tracking-tighter">Offline</span>
              </Button>
            </div>

            {/* Active Call Section */}
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <div className="grid grid-cols-3 gap-1.5">
                <Button variant="outline" size="sm" className="bg-emerald-500/5 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 h-7 gap-1 px-1">
                  <Phone className="h-2.5 w-2.5" /> <span className="text-[9px] font-bold tracking-tighter">Answer</span>
                </Button>
                <Button variant="outline" size="sm" className="bg-red-500/5 border-red-500/30 text-red-500 hover:bg-red-500/10 h-7 gap-1 px-1">
                  <XCircle className="h-2.5 w-2.5" /> <span className="text-[9px] font-bold tracking-tighter">End</span>
                </Button>
                <Button variant="outline" size="sm" className="bg-amber-500/5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 h-7 gap-1 px-1">
                  <XCircle className="h-2.5 w-2.5 rotate-45" /> <span className="text-[9px] font-bold tracking-tighter">Close</span>
                </Button>
              </div>
            </div>

            {/* Keypad Section */}
            <div className="p-2 bg-black/20 rounded-xl border border-white/5 space-y-2.5 shadow-inner">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative col-span-2">
                  <Input
                    placeholder="Enter Number..."
                    value={singlePhone}
                    onChange={(e) => setSinglePhone(e.target.value)}
                    className="h-9 bg-black/40 border-amber-500/20 text-center text-lg font-mono tracking-widest focus-visible:ring-amber-500/30 pr-8"
                  />
                  <button
                    onClick={backspaceDial}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  placeholder="Lead ID (Opt)"
                  value={singleLeadId}
                  onChange={(e) => setSingleLeadId(e.target.value)}
                  className="h-8 bg-black/40 border-white/10 text-[10px] col-span-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '+', 0, 'CLR'].map(key => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => key === 'CLR' ? clearDial() : appendDial(String(key))}
                    className="h-8 bg-white/[0.03] border border-white/[0.05] hover:bg-amber-500/10 hover:border-amber-500/30 text-base font-bold transition-all p-0"
                  >
                    {key}
                  </Button>
                ))}
              </div>

              <Button
                onClick={runSingle}
                className="w-full h-9 bg-amber-600 hover:bg-amber-500 text-white font-bold gap-2 shadow-lg shadow-amber-900/20"
                disabled={!singlePhone.trim() || !gateOkSingle}
              >
                <Phone className="h-3.5 w-3.5" /> CALL
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0 p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
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

          <TabsContent value="history" className="mt-0 p-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-2">
              {results.length === 0 && <div className="text-sm text-center py-8 text-muted-foreground">No recent calls</div>}
              {results.map((r, i) => (
                <div key={i} className="flex items-start justify-between p-2 rounded border bg-card/50 text-xs text-[10px]">
                  <div>
                    <div className="font-mono font-medium">{r.phone}</div>
                    {r.leadId && <div className="text-muted-foreground opacity-60 text-[9px]">{r.leadId}</div>}
                  </div>
                  <div className={cn("px-1 py-0.5 rounded font-bold text-[8px]", r.ok ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500")}>
                    {r.ok ? 'OK' : 'ERR'}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-0 p-4 h-full overflow-y-auto flex-1 min-h-0">
            {/* Embedded Prompt Gen but scaled down? Or just hidden if too complex */}
            <div className="text-[10px] text-muted-foreground mb-4 opacity-70">
              Configure agent prompts and settings. call scripts.
            </div>
            <PromptGeneratorPanel embedded={true} showSoftphone={false} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
