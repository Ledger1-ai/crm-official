"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Title, DateRangePicker, Select, SelectItem } from "@tremor/react";
import { AreaChartDemo } from "@/components/tremor/AreaChart";

type Interval = "day" | "week" | "month";
type DateRangeValue = { from?: Date; to?: Date };

type TimeseriesPoint = { date: string; Total: number };
type TimeseriesResponse = {
    interval: Interval;
    start: string;
    end: string;
    data: TimeseriesPoint[];
};

function toISODate(d?: Date): string | null {
    if (!d) return null;
    // Normalize to YYYY-MM-DD (UTC) for API query
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
}

function defaultLastNDays(n: number): DateRangeValue {
    const end = new Date();
    const start = new Date(end.getTime() - n * 24 * 60 * 60 * 1000);
    return { from: start, to: end };
}

export default function SalesTimeSeries() {
    const [interval, setInterval] = useState<Interval>("day");
    const [range, setRange] = useState<DateRangeValue>(() => defaultLastNDays(30));
    const [data, setData] = useState<TimeseriesPoint[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const query = useMemo(() => {
        const start = toISODate(range.from);
        const end = toISODate(range.to);
        const params = new URLSearchParams();
        if (start) params.set("start", start);
        if (end) params.set("end", end);
        params.set("interval", interval);
        return `/api/sales/timeseries?${params.toString()}`;
    }, [range.from, range.to, interval]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setErrorMsg(null);
            try {
                const res = await fetch(query, { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: TimeseriesResponse = await res.json();
                if (!cancelled) {
                    setData(json.data || []);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setErrorMsg("Failed to load sales data.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [query]);

    const chartData = useMemo(() => {
        // Tremor AreaChart expects categories; we use "Total"
        return (data || []).map((d) => ({ date: d.date, Total: d.Total }));
    }, [data]);

    return (
        <Card className="rounded-lg bg-card text-card-foreground border-border ring-0 shadow-sm">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
                <Title className="text-primary">Sales Over Time</Title>
                <div className="flex w-full flex-col sm:flex-row sm:flex-wrap items-center gap-2">
                    <Select
                        value={interval}
                        onValueChange={(val) => setInterval((val as Interval) || "day")}
                        className="min-w-[140px] sm:w-[160px] shrink-0"
                    >
                        <SelectItem value="day">Daily</SelectItem>
                        <SelectItem value="week">Weekly</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                    </Select>
                    <DateRangePicker
                        value={range}
                        onValueChange={(val) => setRange(val)}
                        className="w-full sm:w-auto md:max-w-[320px] lg:max-w-[360px] shrink-0"
                    />
                </div>
            </div>

            {errorMsg && <div className="mt-4 text-sm text-red-500">{errorMsg}</div>}

            <AreaChartDemo
                chartData={chartData}
                title=""
                categories={["Total"]}
                colors={["cyan"]}
                className="h-80 mt-6"
            />

            {loading && <div className="mt-2 text-sm text-muted-foreground">Loading…</div>}
        </Card>
    );
}
