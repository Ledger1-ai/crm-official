'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import CustomCCP from '@/components/voice/CustomCCP';
import PromptGeneratorPanel from '../prompt/PromptGeneratorPanel';

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

export default function DialerPanel() {
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

  // Floating numpad (draggable)
  const [showPad, setShowPad] = useState<boolean>(true);
  const [padPos, setPadPos] = useState<{ x: number; y: number }>({ x: 24, y: 240 });
  const dragState = useRef<{ dragging: boolean; sx: number; sy: number; px: number; py: number }>({
    dragging: false,
    sx: 0,
    sy: 0,
    px: 24,
    py: 240,
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current.dragging) return;
      const dx = e.clientX - dragState.current.sx;
      const dy = e.clientY - dragState.current.sy;
      const nx = Math.max(8, Math.min(window.innerWidth - 240, dragState.current.px + dx));
      const ny = Math.max(8, Math.min(window.innerHeight - 240, dragState.current.py + dy));
      setPadPos({ x: nx, y: ny });
    };
    const onUp = () => {
      if (dragState.current.dragging) {
        dragState.current.dragging = false;
        dragState.current.px = padPos.x;
        dragState.current.py = padPos.y;
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [padPos]);

  function beginDrag(e: React.MouseEvent<HTMLDivElement>) {
    dragState.current.dragging = true;
    dragState.current.sx = e.clientX;
    dragState.current.sy = e.clientY;
    dragState.current.px = padPos.x;
    dragState.current.py = padPos.y;
    e.preventDefault();
  }

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

  return (
    <div className="w-full px-1 py-2 space-y-4">


      {/* Connect CCP Softphone */}
      <section className="rounded-md border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Connect Softphone</div>
        </div>
        <CustomCCP
          theme="dark"
          title="Connect Softphone"
          subtitle="Custom CCP (Streams invisible provider)"
        />
      </section>

      {/* Single Dial */}
      <section className="rounded-md border bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        <div className="mt-3 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowPad((v) => !v)}>
            {showPad ? 'Hide Numpad' : 'Show Numpad'}
          </Button>
        </div>
      </section>

      {/* List Dial */}
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

      {/* Recent results */}
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

      {/* Prompt Generator */}
      <section className="rounded-md border bg-card p-4">
        <h3 className="text-sm font-semibold mb-2">Prompt Generator</h3>
        <PromptGeneratorPanel embedded={true} showSoftphone={false} />
      </section>

      {/* Floating draggable numpad (side, movable) */}
      {showPad && (
        <div
          className="fixed z-50 w-[220px] rounded-xl border bg-background/80 backdrop-blur p-2 shadow-lg"
          style={{ left: padPos.x, top: padPos.y }}
        >
          <div
            className="cursor-move px-2 py-1 text-[11px] font-semibold border-b bg-foreground/5 rounded-t-xl"
            onMouseDown={beginDrag}
            title="Drag to move"
          >
            Numpad
          </div>
          <div className="grid grid-cols-3 gap-2 p-2">
            <Button variant="outline" onClick={() => appendDial('1')}>1</Button>
            <Button variant="outline" onClick={() => appendDial('2')}>2</Button>
            <Button variant="outline" onClick={() => appendDial('3')}>3</Button>
            <Button variant="outline" onClick={() => appendDial('4')}>4</Button>
            <Button variant="outline" onClick={() => appendDial('5')}>5</Button>
            <Button variant="outline" onClick={() => appendDial('6')}>6</Button>
            <Button variant="outline" onClick={() => appendDial('7')}>7</Button>
            <Button variant="outline" onClick={() => appendDial('8')}>8</Button>
            <Button variant="outline" onClick={() => appendDial('9')}>9</Button>
            <Button variant="outline" onClick={() => appendDial('+')}>+</Button>
            <Button variant="outline" onClick={() => appendDial('0')}>0</Button>
            <Button variant="outline" onClick={backspaceDial}>⌫</Button>
            <Button variant="outline" onClick={clearDial} className="col-span-3">Clear</Button>
          </div>
          <div className="px-2 pb-2">
            <Button className="w-full" onClick={runSingle} disabled={!singlePhone.trim()}>
              Dial
            </Button>
          </div>
        </div>
      )}
      {!showPad && (
        <div className="fixed z-40 bottom-6 right-6">
          <Button className="rounded-full shadow-md" onClick={() => setShowPad(true)} title="Show Numpad">
            Numpad
          </Button>
        </div>
      )}
    </div>
  );
}
