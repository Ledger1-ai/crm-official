'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

type CalendarMeta = { id: string; summary: string; backgroundColor?: string; foregroundColor?: string; primary?: boolean };
type ApiEvent = {
  id: string;
  calendarId: string;
  calendarSummary: string;
  summary?: string;
  description?: string;
  startISO: string;
  endISO: string;
  allDay?: boolean;
  location?: string;
  color?: { background: string; foreground: string; source: 'event' | 'calendar' };
};

type ViewMode = 'day' | 'week' | 'month';

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  return startOfDay(d);
}
function endOfWeek(date: Date) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return endOfDay(e);
}
function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfDay(d);
}
function endOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return endOfDay(d);
}

function toISO(d: Date) {
  return d.toISOString();
}
function parseISO(iso: string) {
  return new Date(iso);
}

function getEventColor(ev: ApiEvent, calendarsById: Record<string, CalendarMeta>): { bg: string; fg: string } {
  if (ev.color?.background) return { bg: ev.color.background, fg: ev.color.foreground || '#000' };
  const meta = calendarsById[ev.calendarId];
  return { bg: meta?.backgroundColor || '#e5e7eb', fg: meta?.foregroundColor || '#111' };
}

// Simple layout helpers
function minutesSinceMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}
function durationMinutes(a: Date, b: Date) {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 60000));
}

export default function CalendarEventsPanel() {
  const [timeZone, setTimeZone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });

  const [view, setView] = useState<ViewMode>('week');
  const [anchorDay, setAnchorDay] = useState<Date>(new Date());

  const [calendars, setCalendars] = useState<CalendarMeta[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [defaultId, setDefaultId] = useState<string | undefined>(undefined);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [loadingCalendars, setLoadingCalendars] = useState(false);

  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const calendarsById = useMemo(() => {
    const map: Record<string, CalendarMeta> = {};
    for (const c of calendars) map[c.id] = c;
    return map;
  }, [calendars]);

  // Load calendars list (paginated via API)
  useEffect(() => {
    (async () => {
      setLoadingCalendars(true);
      try {
        const res = await fetch('/api/calendar/list');
        if (!res.ok) throw new Error(await res.text());
        const j = await res.json();
        const list: CalendarMeta[] = Array.isArray(j?.calendars) ? j.calendars : [];
        setCalendars(list);
      } catch (e: any) {
        toast.error(`Failed to load calendars: ${e?.message || e}`);
      } finally {
        setLoadingCalendars(false);
      }
    })();
  }, []);

  // Load preferences
  useEffect(() => {
    (async () => {
      setLoadingPrefs(true);
      try {
        const res = await fetch('/api/calendar/preferences');
        if (!res.ok) throw new Error(await res.text());
        const j = await res.json();
        const selected = Array.isArray(j?.selectedIds) ? j.selectedIds : [];
        const def = typeof j?.defaultId === 'string' ? j.defaultId : undefined;

        // If no prefs yet, default to primary if available
        const pri = calendars.find((c) => c.primary);
        setSelectedIds(selected.length ? selected : pri ? [pri.id] : calendars.length ? [calendars[0].id] : []);
        setDefaultId(def || pri?.id || (calendars.length ? calendars[0].id : undefined));
      } catch (e: any) {
        // fallback selection if prefs endpoint fails
        const pri = calendars.find((c) => c.primary);
        setSelectedIds(pri ? [pri.id] : calendars.length ? [calendars[0].id] : []);
        setDefaultId(pri?.id || (calendars.length ? calendars[0].id : undefined));
      } finally {
        setLoadingPrefs(false);
      }
    })();
     
  }, [calendars]);

  const savePreferences = async () => {
    try {
      const res = await fetch('/api/calendar/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedIds, defaultId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Calendar preferences saved');
    } catch (e: any) {
      toast.error(`Failed to save preferences: ${e?.message || e}`);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const computeRange = (v: ViewMode, d: Date): { startISO: string; endISO: string } => {
    switch (v) {
      case 'day': {
        const s = startOfDay(d);
        const e = endOfDay(d);
        return { startISO: toISO(s), endISO: toISO(e) };
      }
      case 'week': {
        const s = startOfWeek(d);
        const e = endOfWeek(d);
        return { startISO: toISO(s), endISO: toISO(e) };
      }
      case 'month': {
        const s = startOfMonth(d);
        const e = endOfMonth(d);
        return { startISO: toISO(s), endISO: toISO(e) };
      }
      default: {
        const s = startOfWeek(d);
        const e = endOfWeek(d);
        return { startISO: toISO(s), endISO: toISO(e) };
      }
    }
  };

  const loadEvents = async () => {
    if (!selectedIds.length) {
      toast.error('Select at least one calendar to view');
      return;
    }
    setLoadingEvents(true);
    setEvents([]);
    try {
      const { startISO, endISO } = computeRange(view, anchorDay);
      const url =
        `/api/calendar/events?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}` +
        `&calendarIds=${encodeURIComponent(selectedIds.join(','))}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      const evs: ApiEvent[] = Array.isArray(j?.events) ? j.events : [];
      setEvents(evs);
    } catch (e: any) {
      toast.error(`Failed to load events: ${e?.message || e}`);
    } finally {
      setLoadingEvents(false);
    }
  };

  const weekDays = useMemo(() => {
    const s = startOfWeek(anchorDay);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      return d;
    });
  }, [anchorDay]);

  // Renderers
  const renderMonthGrid = () => {
    return (
      <div className="space-y-2">
        <DayPicker mode="single" selected={anchorDay} onSelect={(d) => d && setAnchorDay(d)} showOutsideDays />
        <Button onClick={loadEvents} disabled={loadingEvents || loadingPrefs || loadingCalendars}>
          {loadingEvents ? 'Loading…' : 'Load Events'}
        </Button>
        <div className="space-y-2">
          {events.length === 0 ? (
            <div className="text-sm text-muted-foreground">No events in selected month.</div>
          ) : (
            <ul className="text-xs space-y-1">
              {events
                .map((ev) => ({ ev, dayKey: startOfDay(parseISO(ev.startISO)).toDateString() }))
                .sort((a, b) => parseISO(a.ev.startISO).getTime() - parseISO(b.ev.startISO).getTime())
                .map((x, i) => {
                  const { ev } = x;
                  const { bg, fg } = getEventColor(ev, calendarsById);
                  return (
                    <li key={`${ev.id}-${i}`} className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: bg }} />
                      <span style={{ color: fg }}>
                        {new Date(ev.startISO).toLocaleString()} — {ev.summary || '(No title)'} [{ev.calendarSummary}]
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    // Simple columns with event chips (not overlapping layout)
    const grouped: Record<string, ApiEvent[]> = {};
    for (const d of weekDays) grouped[d.toDateString()] = [];
    for (const ev of events) {
      const key = startOfDay(parseISO(ev.startISO)).toDateString();
      (grouped[key] || (grouped[key] = [])).push(ev);
    }
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button onClick={() => setAnchorDay(new Date(anchorDay.getFullYear(), anchorDay.getMonth(), anchorDay.getDate() - 7))} variant="outline">
            ← Prev
          </Button>
          <Button onClick={() => setAnchorDay(new Date())} variant="outline">
            Today
          </Button>
          <Button onClick={() => setAnchorDay(new Date(anchorDay.getFullYear(), anchorDay.getMonth(), anchorDay.getDate() + 7))} variant="outline">
            Next →
          </Button>
          <Button onClick={loadEvents} disabled={loadingEvents || loadingPrefs || loadingCalendars}>
            {loadingEvents ? 'Loading…' : 'Load Events'}
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d) => {
            const list = grouped[d.toDateString()] || [];
            return (
              <div key={d.toDateString()} className="border rounded p-2 min-h-[160px]">
                <div className="text-xs font-semibold mb-2">{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                {list.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No events</div>
                ) : (
                  <ul className="space-y-1">
                    {list.map((ev, i) => {
                      const { bg, fg } = getEventColor(ev, calendarsById);
                      return (
                        <li key={`${ev.id}-${i}`} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: bg, color: fg }}>
                          {new Date(ev.startISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —{' '}
                          {new Date(ev.endISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {ev.summary || '(No title)'}
                          <div className="opacity-75">[{ev.calendarSummary}]</div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    // Simple list view with colored blocks
    const dayStart = startOfDay(anchorDay);
    const dayEnd = endOfDay(anchorDay);
    const dayEvents = events
      .filter((ev) => {
        const s = parseISO(ev.startISO);
        return s >= dayStart && s <= dayEnd;
      })
      .sort((a, b) => parseISO(a.startISO).getTime() - parseISO(b.startISO).getTime());

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-56"
            placeholder="Time Zone (e.g. America/Denver)"
          />
          <Button onClick={() => setAnchorDay(new Date(anchorDay.getFullYear(), anchorDay.getMonth(), anchorDay.getDate() - 1))} variant="outline">
            ← Prev
          </Button>
          <Button onClick={() => setAnchorDay(new Date())} variant="outline">
            Today
          </Button>
          <Button onClick={() => setAnchorDay(new Date(anchorDay.getFullYear(), anchorDay.getMonth(), anchorDay.getDate() + 1))} variant="outline">
            Next →
          </Button>
          <Button onClick={loadEvents} disabled={loadingEvents || loadingPrefs || loadingCalendars}>
            {loadingEvents ? 'Loading…' : 'Load Events'}
          </Button>
        </div>
        {dayEvents.length === 0 ? (
          <div className="text-sm text-muted-foreground">No events today.</div>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((ev, i) => {
              const s = parseISO(ev.startISO);
              const e = parseISO(ev.endISO);
              const mins = durationMinutes(s, e);
              const { bg, fg } = getEventColor(ev, calendarsById);
              return (
                <li key={`${ev.id}-${i}`} className="border rounded p-2" style={{ borderColor: bg }}>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded" style={{ backgroundColor: bg }} />
                    <span className="text-xs" style={{ color: fg }}>
                      {s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      ({mins} min)
                    </span>
                  </div>
                  <div className="text-sm font-medium">{ev.summary || '(No title)'}</div>
                  <div className="text-xs opacity-75">[{ev.calendarSummary}] {ev.location ? ` · ${ev.location}` : ''}</div>
                  {ev.description ? <div className="text-xs mt-1">{ev.description}</div> : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scheduled Events</h3>
          <div className="text-xs text-muted-foreground">Shows events across selected Google calendars with calendar colors</div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded border p-2 text-sm bg-background"
            value={view}
            onChange={(e) => setView(e.target.value as ViewMode)}
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <Button onClick={loadEvents} disabled={loadingEvents || loadingPrefs || loadingCalendars}>
            {loadingEvents ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Calendar selection and default calendar */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Calendars</h4>
          <div className="flex items-center gap-2">
            <Button onClick={savePreferences} variant="outline">Save Preferences</Button>
          </div>
        </div>
        {loadingCalendars ? (
          <div className="text-sm text-muted-foreground">Loading calendars…</div>
        ) : calendars.length === 0 ? (
          <div className="text-sm text-muted-foreground">No calendars found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {calendars.map((c) => {
              const checked = selectedIds.includes(c.id);
              return (
                <div key={c.id} className="flex items-center justify-between border rounded p-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={checked} onChange={() => toggleSelected(c.id)} />
                    <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: c.backgroundColor || '#e5e7eb' }} />
                    <span className="font-medium">{c.summary}</span>
                    {c.primary ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">primary</span> : null}
                  </label>
                  <label className="text-xs flex items-center gap-1">
                    <input
                      type="radio"
                      name="defaultCalendar"
                      checked={defaultId === c.id}
                      onChange={() => setDefaultId(c.id)}
                    />
                    Default target
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View renderers */}
      {view === 'month' ? (
        renderMonthGrid()
      ) : view === 'week' ? (
        renderWeekView()
      ) : (
        renderDayView()
      )}
    </div>
  );
}
