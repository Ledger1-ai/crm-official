"use client";

import { use, useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import { Bot, Search, Globe, CheckCircle, Loader2, AlertCircle, Play, Pause, Square } from "lucide-react";

type JobStatus = "QUEUED" | "RUNNING" | "PAUSED" | "STOPPED" | "SUCCESS" | "FAILED";

type JobStatusResponse = {
  job: {
    id: string;
    status: JobStatus;
    startedAt?: string;
    finishedAt?: string;
    counters: Record<string, number>;
    logs?: Array<{
      ts?: string;
      msg?: string;
      level?: string;
    }>;
  };
  pool: {
    id: string;
    name?: string;
  };
  sourceEventsCount: number;
  candidatesCount: number;
};

export default function LeadGenJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const router = useRouter();
  const [controlling, setControlling] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<JobStatusResponse>(
    `/api/leads/autogen/status/${jobId}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  const handleControl = async (action: "pause" | "resume" | "stop") => {
    setControlling(true);
    try {
      const res = await fetch(`/api/leads/autogen/control/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Control action failed");
      }

      // Refresh data immediately
      await mutate();
    } catch (err: any) {
      alert(err.message || "Failed to control job");
    } finally {
      setControlling(false);
    }
  };

  const statusBadge = (s?: JobStatus) => {
    const base = "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium";
    switch (s) {
      case "QUEUED":
        return <span className={`${base} bg-gray-100 text-gray-700`}>Queued</span>;
      case "RUNNING":
        return <span className={`${base} bg-blue-100 text-blue-700`}>Running</span>;
      case "PAUSED":
        return <span className={`${base} bg-orange-100 text-orange-700`}>Paused</span>;
      case "STOPPED":
        return <span className={`${base} bg-gray-100 text-gray-700`}>Stopped</span>;
      case "SUCCESS":
        return <span className={`${base} bg-green-100 text-green-700`}>Success</span>;
      case "FAILED":
        return <span className={`${base} bg-red-100 text-red-700`}>Failed</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-700`}>Unknown</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lead Generation Job</h1>
          <p className="text-sm text-muted-foreground">
            Track progress and jump to the Lead Pool to work candidates and start an email blast.
          </p>
        </div>
        <div className="flex gap-2">
          {data?.pool?.id && (
            <button
              className="rounded border px-3 py-1"
              onClick={() => router.push(`/crm/leads/pools/${data.pool.id}`)}
            >
              Go to Lead Pool
            </button>
          )}
          <button className="rounded border px-3 py-1" onClick={() => router.push("/crm/leads/pools")}>
            All Lead Pools
          </button>
        </div>
      </div>

      {isLoading && <div className="text-sm">Loading job status…</div>}
      {error && <div className="text-sm text-red-600">Failed to load job</div>}

      {data && (
        <>
          {/* Job Controls */}
          {(data.job?.status === "RUNNING" || data.job?.status === "PAUSED") && (
            <div className="border rounded-lg p-4 bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                {data.job?.status === "RUNNING" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="font-medium">AI Agent Running</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-600">Job Paused</span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {data.job?.status === "RUNNING" ? (
                  <button
                    onClick={() => handleControl("pause")}
                    disabled={controlling}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-orange-600 text-orange-600 hover:bg-orange-50 disabled:opacity-50 transition-all"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => handleControl("resume")}
                    disabled={controlling}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}
                <button
                  onClick={() => handleControl("stop")}
                  disabled={controlling}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {data.job?.status === "RUNNING" && (
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <h2 className="text-lg font-semibold">Progress</h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span className="font-medium">
                    {data.candidatesCount} / {data.job.counters?.companiesFound || 100} companies
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        ((data.candidatesCount || 0) / (data.job.counters?.companiesFound || 100)) * 100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Job</h2>
              {statusBadge(data.job?.status)}
            </div>
            <div className="text-sm">
              <div>
                <span className="text-muted-foreground">Job ID:</span> {data.job.id}
              </div>
              <div>
                <span className="text-muted-foreground">Started:</span>{" "}
                {data.job.startedAt ? new Date(data.job.startedAt).toLocaleString() : "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Finished:</span>{" "}
                {data.job.finishedAt ? new Date(data.job.finishedAt).toLocaleString() : "—"}
              </div>
            </div>
          </div>

          <div className="border rounded p-4 space-y-2">
            <h2 className="text-lg font-medium">Counters</h2>
            <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(data.job.counters || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{String(v)}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source events</span>
                <span className="font-medium">{data.sourceEventsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Candidates</span>
                <span className="font-medium">{data.candidatesCount}</span>
              </div>
            </div>
          </div>

          <div className="border rounded p-4 space-y-3">
            <h2 className="text-lg font-medium">Next Actions</h2>
            <p className="text-sm text-muted-foreground">
              When the job reaches Success, review candidates in the Lead Pool and start an automated email blast.
            </p>
            <div className="flex gap-2">
              {data?.pool?.id && (
                <button
                  className="rounded bg-blue-600 px-4 py-2 text-white"
                  onClick={() => router.push(`/crm/leads/pools/${data.pool.id}`)}
                >
                  Work This Pool
                </button>
              )}
              <button className="rounded border px-3 py-1" onClick={() => router.refresh()}>
                Refresh
              </button>
            </div>
          </div>

          {/* AI Reasoning Stream */}
          {data.job?.logs && Array.isArray(data.job.logs) && data.job.logs.length > 0 && (
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">AI Agent Reasoning Stream</h2>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {data.job.logs
                  .slice(-7)
                  .reverse()
                  .map((log: any, idx: number) => {
                    const isToolCall = log.msg?.includes("Agent action:");
                    const isError = log.level === "ERROR" || log.level === "WARN";
                    
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          isError
                            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                            : isToolCall
                            ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {isError ? (
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          ) : isToolCall ? (
                            <Bot className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground mb-1">
                              {log.ts ? new Date(log.ts).toLocaleTimeString() : ""}
                            </div>
                            <div className="text-sm break-words">{log.msg || "..."}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}
