'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

type CalendarItem = { id: string; summary: string; primary?: boolean };
type Interval = { start: string; end: string };

function startOfDayISO(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function endOfDayISO(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
function toMillis(iso: string) {
  return new Date(iso).getTime();
}

/**
 * Given the day's [startISO, endISO] and merged busy intervals, compute free intervals.
 */
function computeFreeIntervals(dayStartISO: string, dayEndISO: string, busy: Interval[]): Interval[] {
  const free: Interval[] = [];
  let cursor = toMillis(dayStartISO);

  const dayEnd = toMillis(dayEndISO);
  const sorted = [...busy].sort((a, b) => toMillis(a.start) - toMillis(b.start));

  for (const b of sorted) {
    const bStart = toMillis(b.start);
    const bEnd = toMillis(b.end);
    if (bEnd <= cursor) continue; // busy ends before cursor
    if (bStart > cursor) {
      free.push({ start: new Date(cursor).toISOString(), end: new Date(bStart).toISOString() });
    }
    cursor = Math.max(cursor, bEnd);
    if (cursor >= dayEnd) break;
  }
  if (cursor < dayEnd) {
    free.push({ start: new Date(cursor).toISOString(), end: new Date(dayEnd).toISOString() });
  }
  return free;
}

export default function CalendarAvailabilityPanel() {
  const [timeZone, setTimeZone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });

  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);

  const [day, setDay] = useState<Date | undefined>(new Date());
  const [busy, setBusy] = useState<Interval[]>([]);
  const [free, setFree] = useState<Interval[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);

  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [gmailEmail, setGmailEmail] = useState<string | undefined>(undefined);
  const [statusLoading, setStatusLoading] = useState(false);

  // Load Gmail status
  useEffect(() => {
    (async () => {
      setStatusLoading(true);
      try {
        const res = await fetch('/api/gmail/status');
        if (res.ok) {
          const j = await res.json();
          setGmailConnected(!!j.connected);
          setGmailEmail(j.emailAddress || undefined);
        } else {
          setGmailConnected(false);
        }
      } catch {
        setGmailConnected(false);
      } finally {
        setStatusLoading(false);
      }
    })();
  }, []);

  // Load calendar list
  useEffect(() => {
    (async () => {
      setLoadingCalendars(true);
      try {
        const res = await fetch('/api/calendar/list');
        if (!res.ok) {
          const t = await res.text();
          toast.error(`Failed to load calendars: ${t}`);
          return;
        }
        const j = await res.json();
        const list: CalendarItem[] = Array.isArray(j?.calendars) ? j.calendars : [];
        setCalendars(list);
        // Default selected: primary if present, otherwise just first calendar
        const prim = list.filter((c) => c.primary);
        if (prim.length > 0) {
          setSelectedCalendarIds(prim.map((c) => c.id));
        } else if (list.length > 0) {
          // Fix: Ensure we select the first calendar if no primary is found to avoid "Select at least one" error
          setSelectedCalendarIds([list[0].id]);
        }
      } catch (e: any) {
        toast.error(`Failed to load calendars: ${e?.message || e}`);
      } finally {
        setLoadingCalendars(false);
      }
    })();
  }, []);

  const refreshStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/gmail/status');
      if (res.ok) {
        const j = await res.json();
        setGmailConnected(!!j.connected);
        setGmailEmail(j.emailAddress || undefined);
      } else {
        setGmailConnected(false);
      }
    } catch {
      setGmailConnected(false);
    } finally {
      setStatusLoading(false);
    }
  };

  const toggleCalendar = (id: string) => {
    setSelectedCalendarIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const fetchAvailability = async () => {
    if (!day) {
      toast.error('Select a day');
      return;
    }
    if (selectedCalendarIds.length === 0) {
      toast.error('Select at least one calendar');
      return;
    }
    setLoadingAvail(true);
    setBusy([]);
    setFree([]);
    try {
      const startISO = startOfDayISO(day);
      const endISO = endOfDayISO(day);
      const url =
        `/api/calendar/availability?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}` +
        `&timeZone=${encodeURIComponent(timeZone)}` +
        `&calendarIds=${encodeURIComponent(selectedCalendarIds.join(','))}`;
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        toast.error(`Availability failed: ${txt}`);
        setLoadingAvail(false);
        return;
      }
      const j = await res.json();
      const mergedBusy: Interval[] = Array.isArray(j?.busy) ? j.busy : [];
      setBusy(mergedBusy);
      setFree(computeFreeIntervals(startISO, endISO, mergedBusy));
      toast.success(`Loaded availability from ${selectedCalendarIds.length} calendars`);
    } catch (e: any) {
      toast.error(`Availability error: ${e?.message || e}`);
    } finally {
      setLoadingAvail(false);
    }
  };

  const connectionLabel = useMemo(() => {
    if (statusLoading) return 'Checking…';
    if (gmailConnected === true) return `Connected${gmailEmail ? ` (${gmailEmail})` : ''}`;
    if (gmailConnected === false) return 'Not Connected';
    return 'Unknown';
  }, [statusLoading, gmailConnected, gmailEmail]);

  return (
    <div className="space-y-6">
      {/* Header and email status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Availability Calendar</h3>
          <div className="text-sm text-muted-foreground">
            Gmail Status: <span className={gmailConnected ? 'text-green-600' : 'text-red-600'}>{connectionLabel}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Input
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-full sm:w-56"
            placeholder="Time Zone (e.g. America/Denver)"
          />
          <Button onClick={refreshStatus} variant="outline" className="whitespace-nowrap">Refresh Status</Button>
        </div>
      </div>

      {/* Calendar and selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Pick a Day</h4>
          </div>
          <DayPicker
            mode="single"
            selected={day}
            onSelect={setDay}
            showOutsideDays
          />
        </div>

        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Calendars</h4>
            <Button onClick={fetchAvailability} disabled={loadingAvail || loadingCalendars}>
              {loadingAvail ? 'Loading…' : 'Load Availability'}
            </Button>
          </div>

          {loadingCalendars ? (
            <div className="text-sm text-muted-foreground">Loading calendars…</div>
          ) : calendars.length === 0 ? (
            <div className="text-sm text-muted-foreground">No calendars found.</div>
          ) : (
            <div className="space-y-2">
              {calendars.map((c) => {
                const checked = selectedCalendarIds.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCalendar(c.id)}
                    />
                    <span className="font-medium">{c.summary}</span>
                    {c.primary ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">primary</span> : null}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Availability results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Busy Intervals</h4>
          </div>
          {busy.length === 0 ? (
            <div className="text-sm text-muted-foreground">None</div>
          ) : (
            <ul className="text-xs space-y-1">
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

        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Free Intervals</h4>
          </div>
          {free.length === 0 ? (
            <div className="text-sm text-muted-foreground">None</div>
          ) : (
            <ul className="text-xs space-y-1">
              {free.map((f, i) => (
                <li key={i} className="flex justify-between">
                  <span>{new Date(f.start).toLocaleString()}</span>
                  <span>→</span>
                  <span>{new Date(f.end).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
