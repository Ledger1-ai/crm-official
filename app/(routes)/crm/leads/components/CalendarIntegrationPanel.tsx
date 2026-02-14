'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

/**
 * CalendarIntegrationPanel
 * - Shows Google Calendar connection status
 * - Allows user to initiate OAuth via /api/google/auth-url
 * - Provides quick test UI for availability and scheduling
 *
 * Backend routes used:
 *   GET /api/google/auth-url              -> returns { ok, url } OAuth consent URL
 *   GET /api/calendar/availability       -> returns { ok, timeZone, busy[] } or 404 if not connected
 *   POST /api/calendar/schedule          -> schedules an event on the user's primary calendar
 */

type BusyInterval = { start: string; end: string };

function toISOFromLocal(local: string | undefined | null): string | null {
  if (!local) return null;
  // local is like "2025-11-23T12:00"
  const dt = new Date(local);
  if (isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

function parseAttendeesCsv(csv: string): string[] {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Cross-browser datetime picker trigger
 * - Uses native input.showPicker() when available (Chrome/Edge)
 * - Falls back to a lightweight popover with date + time inputs (Safari/Firefox)
 */
function splitLocal(local: string | undefined | null): { date: string; time: string } {
  if (!local) return { date: '', time: '' };
  const parts = String(local).split('T');
  const date = parts[0] || '';
  const time = (parts[1] || '').slice(0, 5) || '';
  return { date, time };
}

function combineLocal(date: string, time: string): string {
  if (!date || !time) return '';
  return `${date}T${time}`;
}

const DateTimePickerButton: React.FC<{
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (v: string) => void;
}> = ({ inputRef, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [{ date, time }, setDT] = useState<{ date: string; time: string }>({ date: '', time: '' });

  useEffect(() => {
    if (open) {
      setDT(splitLocal(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClick = () => {
    try {
      const el = inputRef.current as any;
      if (el && typeof el.showPicker === 'function') {
        el.showPicker();
        return;
      }
    } catch { }
    // Fallback: open lightweight popover
    setOpen(true);
  };

  const apply = () => {
    const v = combineLocal(date, time);
    if (v) onChange(v);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        title="Pick date/time"
        onClick={handleClick}
        className="absolute inset-y-0 right-2 my-auto h-7 w-7 p-0 z-50"
        aria-label="Pick date/time"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </Button>
      {open && (
        <div className="absolute z-50 mt-2 left-0 sm:right-0 sm:left-auto border rounded-md bg-white shadow-lg p-3 w-64 max-w-[calc(100vw-2rem)]">
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Date</label>
              <Input type="date" value={date} onChange={(e) => setDT((prev) => ({ ...prev, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Time</label>
              <Input type="time" value={time} onChange={(e) => setDT((prev) => ({ ...prev, time: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={apply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CalendarIntegrationPanel() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [hasRequiredScopes, setHasRequiredScopes] = useState<boolean | null>(null);
  const [missingScopes, setMissingScopes] = useState<string[]>([]);
  const [timeZone, setTimeZone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });

  // Consolidated calendar preferences
  const [calendars, setCalendars] = useState<Array<{ id: string; summary: string; primary?: boolean }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [defaultId, setDefaultId] = useState<string>('');
  const [prefsLoading, setPrefsLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        setPrefsLoading(true);
        // Load calendars
        const rl = await fetch('/api/calendar/list');
        if (rl.ok) {
          const jl = await rl.json().catch(() => ({}));
          const arr: Array<{ id: string; summary: string; primary?: boolean }> =
            Array.isArray(jl?.calendars) ? jl.calendars : [];
          setCalendars(arr);
        }
        // Load preferences
        const rp = await fetch('/api/calendar/preferences', { cache: 'no-store' });
        if (rp.ok) {
          const jp = await rp.json().catch(() => ({}));
          const sel: string[] = Array.isArray(jp?.selectedIds) ? jp.selectedIds : [];
          const def: string = typeof jp?.defaultId === 'string' ? jp.defaultId : '';
          setSelectedIds(sel);
          setDefaultId(def);
        }
      } catch {
        // ignore
      } finally {
        setPrefsLoading(false);
      }
    })();
  }, []);

  const toggleAvailability = (id: string) => {
    setSelectedIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const setDefault = (id: string) => {
    setDefaultId(id);
    // Ensure default calendar participates in availability checks unless explicitly deselected later
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const savePreferences = async () => {
    try {
      setPrefsLoading(true);
      const res = await fetch('/api/calendar/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedIds,
          defaultId,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        toast.error(`Failed to save preferences: ${txt}`);
        return;
      }
      toast.success('Calendar preferences saved');
    } catch (e: any) {
      toast.error(`Save error: ${e?.message || e}`);
    } finally {
      setPrefsLoading(false);
    }
  };

  // Availability test state
  const [availStartLocal, setAvailStartLocal] = useState<string>('');
  const [availEndLocal, setAvailEndLocal] = useState<string>('');
  const [busy, setBusy] = useState<BusyInterval[]>([]);
  const [free, setFree] = useState<BusyInterval[]>([]);
  const [calendarsQueried, setCalendarsQueried] = useState<string[]>([]);
  const [availLoading, setAvailLoading] = useState<boolean>(false);
  const availStartRef = useRef<HTMLInputElement | null>(null);
  const availEndRef = useRef<HTMLInputElement | null>(null);

  // Schedule test state
  const [title, setTitle] = useState<string>('Discovery Call');
  const [description, setDescription] = useState<string>('Intro and scoping');
  const [schedStartLocal, setSchedStartLocal] = useState<string>('');
  const [schedEndLocal, setSchedEndLocal] = useState<string>('');
  const schedStartRef = useRef<HTMLInputElement | null>(null);
  const schedEndRef = useRef<HTMLInputElement | null>(null);
  const [attendeesCsv, setAttendeesCsv] = useState<string>('');
  const [location, setLocation] = useState<string>('Google Meet');
  const [leadId, setLeadId] = useState<string>('');
  const [schedLoading, setSchedLoading] = useState<boolean>(false);
  const [eventLink, setEventLink] = useState<{ html?: string; meet?: string } | null>(null);

  // Read query param "google" for post-OAuth feedback
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const google = p.get('google');
      if (google === 'connected') {
        toast.success('Google connected');
        checkGoogleStatus();
      } else if (google === 'error') {
        toast.error('Google connection failed');
      }
    } catch { }
  }, []);

  // Initial connection status check against token presence
  useEffect(() => {
    checkGoogleStatus();

  }, []);

  const checkGoogleStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/google/status');
      if (res.ok) {
        const j = await res.json();
        setConnected(!!j.connected);
        setHasRequiredScopes(typeof j.hasRequiredScopes === 'boolean' ? j.hasRequiredScopes : null);
        setMissingScopes(Array.isArray(j.missingScopes) ? j.missingScopes : []);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  };

  const connectGoogle = async () => {
    try {
      const res = await fetch('/api/google/auth-url');
      if (!res.ok) {
        const t = await res.text();
        toast.error(`Failed to initiate Google OAuth: ${t}`);
        return;
      }
      const j = await res.json();
      const url = j?.url;
      if (!url) {
        toast.error('Missing OAuth URL');
        return;
      }
      window.location.href = url;
    } catch (e: any) {
      toast.error(`Failed to connect: ${e?.message || e}`);
    }
  };

  const checkAvailability = async () => {
    setAvailLoading(true);
    setBusy([]);
    setFree([]);
    try {
      const startISO = toISOFromLocal(availStartLocal);
      const endISO = toISOFromLocal(availEndLocal);
      if (!startISO || !endISO) {
        toast.error('Enter valid start/end');
        setAvailLoading(false);
        return;
      }
      // Validate range order (End must be after Start)
      if (new Date(endISO).getTime() <= new Date(startISO).getTime()) {
        toast.error('End must be after Start');
        setAvailLoading(false);
        return;
      }
      let url = `/api/calendar/availability?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}&timeZone=${encodeURIComponent(timeZone)}`;
      const idsToQuery =
        selectedIds.length > 0
          ? Array.from(new Set([...selectedIds, defaultId].filter(Boolean)))
          : (calendars.length > 0
            ? Array.from(new Set(calendars.map((c) => c.id).filter(Boolean)))
            : (defaultId ? [defaultId] : ["primary"]));
      if (idsToQuery.length > 0) {
        url += `&calendarIds=${encodeURIComponent(idsToQuery.join(','))}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        toast.error(`Availability failed: ${txt}`);
        setAvailLoading(false);
        return;
      }
      const j = await res.json();
      const b = Array.isArray(j?.busy) ? (j.busy as BusyInterval[]) : [];
      const f = Array.isArray(j?.free) ? (j.free as BusyInterval[]) : [];
      const cq = Array.isArray(j?.calendarsQueried) ? (j.calendarsQueried as string[]) : [];
      setBusy(b);
      setFree(f);
      setCalendarsQueried(cq);
      toast.success(`Fetched ${b.length} busy, ${f.length} free intervals from ${cq.length} calendar(s)`);
      setConnected(true);
    } catch (e: any) {
      toast.error(`Availability error: ${e?.message || e}`);
    } finally {
      setAvailLoading(false);
    }
  };

  const scheduleEvent = async () => {
    setSchedLoading(true);
    setEventLink(null);
    try {
      const startISO = toISOFromLocal(schedStartLocal);
      const endISO = toISOFromLocal(schedEndLocal);
      if (!startISO || !endISO) {
        toast.error('Enter valid start/end');
        setSchedLoading(false);
        return;
      }
      const attendees = parseAttendeesCsv(attendeesCsv);
      const payload: any = {
        title,
        description,
        start: startISO,
        end: endISO,
        timeZone,
        attendees,
        location,
        calendarId: defaultId || "primary",
      };
      if (leadId) payload.leadId = leadId;

      const res = await fetch('/api/calendar/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        toast.error(`Schedule failed: ${txt}`);
        setSchedLoading(false);
        return;
      }
      const j = await res.json();
      const htmlLink = j?.htmlLink as string | undefined;
      const hangoutLink = j?.hangoutLink as string | undefined;
      const usedId = (j?.calendarIdUsed as string | undefined) || (defaultId || "primary");
      const calSummary = calendars.find((c) => c.id === usedId)?.summary || usedId;
      setEventLink({ html: htmlLink, meet: hangoutLink });
      toast.success(`Event scheduled on "${calSummary}"`);
      setConnected(true);
    } catch (e: any) {
      toast.error(`Schedule error: ${e?.message || e}`);
    } finally {
      setSchedLoading(false);
    }
  };

  const connectionLabel = useMemo(() => {
    if (checking) return 'Checking…';
    if (connected === true) return 'Connected';
    if (connected === false) return 'Not Connected';
    return 'Unknown';
  }, [checking, connected]);

  return (
    <div className="space-y-6">
      {/* Consolidated calendar settings */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Calendar Preferences</h4>
          <div className="relative overflow-visible">
            <Button onClick={savePreferences} disabled={prefsLoading}>
              {prefsLoading ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
        {calendars.length === 0 ? (
          <div className="text-xs text-muted-foreground">No calendars detected. Connect Google and refresh.</div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Choose one Default target calendar for scheduling, and check which calendars should be included when checking availability.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {calendars.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded border p-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.summary}</div>
                    <div className="text-[10px] text-muted-foreground">{c.primary ? 'Primary' : ''}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Default target (single select) */}
                    <label className="text-xs flex items-center gap-1">
                      <input
                        type="radio"
                        name="defaultCalendar"
                        checked={defaultId === c.id}
                        onChange={() => setDefault(c.id)}
                      />
                      Default
                    </label>
                    {/* Availability set (multi-select) */}
                    <label className="text-xs flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleAvailability(c.id)}
                      />
                      Availability
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Google Calendar Integration</h3>
          <div className="text-sm text-muted-foreground">
            Status: <span className={connected ? 'text-green-600' : 'text-red-600'}>{connectionLabel}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Permissions:{" "}
            <span className={hasRequiredScopes ? 'text-green-600' : 'text-yellow-600'}>
              {hasRequiredScopes === null ? 'Unknown' : hasRequiredScopes ? 'Complete' : 'Missing'}
            </span>
          </div>
          {hasRequiredScopes === false && missingScopes.length > 0 ? (
            <div className="text-xs text-yellow-700 mt-1">
              Missing: {missingScopes.join(', ')}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-56"
            placeholder="Time Zone (e.g. America/Denver)"
          />
          <Button onClick={connectGoogle} variant={connected ? 'outline' : 'default'}>
            {connected ? (hasRequiredScopes ? 'Reconnect Google' : 'Grant Permissions') : 'Connect Google'}
          </Button>

          <Button
            onClick={() => window.location.href = "/api/microsoft/auth"}
            variant="outline"
            className="border-blue-200 hover:bg-blue-50 text-blue-700"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft Logo" className="w-4 h-4 mr-2" />
            Connect Outlook
          </Button>

          <Button onClick={checkGoogleStatus} variant="outline">Refresh Status</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Availability Test */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Check Availability</h4>
            <Button onClick={checkAvailability} disabled={availLoading}>
              {availLoading ? 'Checking…' : 'Check'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Start</label>
              <div className="relative overflow-visible isolate z-20 min-h-[2.75rem]">
                <Input
                  ref={availStartRef}
                  type="datetime-local"
                  value={availStartLocal}
                  onChange={(e) => setAvailStartLocal(e.target.value)}
                  className="pr-16"
                  step="300"
                />
                <DateTimePickerButton inputRef={availStartRef} value={availStartLocal} onChange={setAvailStartLocal} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">End</label>
              <div className="relative overflow-visible isolate z-10 min-h-[2.75rem]">
                <Input
                  ref={availEndRef}
                  type="datetime-local"
                  value={availEndLocal}
                  onChange={(e) => setAvailEndLocal(e.target.value)}
                  className="pr-16"
                  step="300"
                />
                <DateTimePickerButton inputRef={availEndRef} value={availEndLocal} onChange={setAvailEndLocal} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium">Busy Intervals</div>
            {busy.length === 0 ? (
              <div className="text-xs text-muted-foreground">None</div>
            ) : (
              <ul className="text-xs">
                {busy.map((b, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{new Date(b.start).toLocaleString()}</span>
                    <span>→</span>
                    <span>{new Date(b.end).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Optional: show free intervals if backend provides them */}
          <div className="space-y-2">
            <div className="text-xs font-medium">Free Intervals</div>
            {free.length === 0 ? (
              <div className="text-xs text-muted-foreground">None</div>
            ) : (
              <ul className="text-xs">
                {free.map((b, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{new Date(b.start).toLocaleString()}</span>
                    <span>→</span>
                    <span>{new Date(b.end).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Schedule Test */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Schedule Test Event</h4>
            <Button onClick={scheduleEvent} disabled={schedLoading}>
              {schedLoading ? 'Scheduling…' : 'Schedule'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Start</label>
              <div className="relative overflow-visible isolate z-20 min-h-[2.75rem]">
                <Input
                  ref={schedStartRef}
                  type="datetime-local"
                  value={schedStartLocal}
                  onChange={(e) => setSchedStartLocal(e.target.value)}
                  className="pr-16"
                  step="300"
                />
                <DateTimePickerButton inputRef={schedStartRef} value={schedStartLocal} onChange={setSchedStartLocal} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">End</label>
              <div className="relative overflow-visible isolate z-10 min-h-[2.75rem]">
                <Input
                  ref={schedEndRef}
                  type="datetime-local"
                  value={schedEndLocal}
                  onChange={(e) => setSchedEndLocal(e.target.value)}
                  className="pr-16"
                  step="300"
                />
                <DateTimePickerButton inputRef={schedEndRef} value={schedEndLocal} onChange={setSchedEndLocal} />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Attendees (comma-separated emails)</label>
            <Textarea rows={2} value={attendeesCsv} onChange={(e) => setAttendeesCsv(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Lead ID (optional)</label>
              <Input value={leadId} onChange={(e) => setLeadId(e.target.value)} placeholder="crm_Leads.id" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Description</label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          {eventLink ? (
            <div className="text-xs space-y-1">
              <div className="font-medium">Event Links</div>
              {eventLink.meet ? (
                <div>
                  Meet:{" "}
                  <a href={eventLink.meet} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    {eventLink.meet}
                  </a>
                </div>
              ) : null}
              {eventLink.html ? (
                <div>
                  Calendar:{" "}
                  <a href={eventLink.html} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    {eventLink.html}
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
