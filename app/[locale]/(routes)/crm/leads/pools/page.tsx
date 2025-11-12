"use client";

import { useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  Target, 
  Users, 
  Calendar, 
  TrendingUp, 
  Building2,
  Mail,
  Phone,
  ExternalLink,
  FileText,
  X,
  ChevronRight
} from "lucide-react";
import ImportLeadsDialog from "../components/ImportLeadsDialog";

type LeadPool = {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  latestJob?: {
    id: string;
    status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED";
    startedAt?: string;
    finishedAt?: string;
    counters?: Record<string, number>;
    queryTemplates?: string[];
  } | null;
  candidatesCount: number;
  contactsCount: number;
  candidatesPreview?: Array<{
    id: string;
    domain: string;
    companyName: string;
    industry?: string;
    score?: number;
    contacts: Array<{
      email?: string;
      phone?: string;
    }>;
  }>;
  icpConfig?: any;
};

type PoolsResponse = {
  pools: LeadPool[];
};

export default function LeadPoolsPage() {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [icpModalPool, setIcpModalPool] = useState<LeadPool | null>(null);
  const { data, error, isLoading, mutate } = useSWR<PoolsResponse>("/api/leads/pools", fetcher, {
    refreshInterval: 10000,
  });

  const onDeletePool = async (poolId: string, poolName: string) => {
    if (!confirm(`Delete pool "${poolName}"? This will remove all candidates, contacts, and jobs. This action cannot be undone.`)) {
      return;
    }

    setDeleting(poolId);
    try {
      const res = await fetch(`/api/leads/pools?poolId=${poolId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Failed to delete pool");
      }

      mutate();
    } catch (error) {
      alert("Failed to delete pool");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "SUCCESS":
        return "text-green-600 bg-green-50 dark:bg-green-950";
      case "RUNNING":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950";
      case "FAILED":
        return "text-red-600 bg-red-50 dark:bg-red-950";
      case "QUEUED":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950";
    }
  };

  const formatPrompt = (pool: LeadPool): string => {
    if (pool.latestJob?.queryTemplates && pool.latestJob.queryTemplates.length > 0) {
      return pool.latestJob.queryTemplates[0];
    }
    if (pool.icpConfig?.prompt) {
      return pool.icpConfig.prompt;
    }
    return pool.description || "No AI prompt available";
  };

  return (
    <div className="flex flex-col">
      <div className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Lead Pools</h1>
            <p className="text-sm text-muted-foreground">
              AI-assisted lead generation pools with detailed candidate previews
            </p>
          </div>
          <ImportLeadsDialog pools={data?.pools ?? []} onCommitted={() => mutate()} />
        </div>
      </div>

      <div className="py-6">
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading pools…</div>
        )}
        
        {error && (
          <div className="text-sm text-red-600">Failed to load pools</div>
        )}

        <div className="space-y-4">
          {data?.pools?.map((pool) => (
            <div 
              key={pool.id} 
              className="border rounded-lg p-4 space-y-4"
            >
              {/* Header Section */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-medium">{pool.name}</h2>
                    {pool.latestJob && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(pool.latestJob.status)}`}>
                        {pool.latestJob.status}
                      </span>
                    )}
                  </div>
                  {pool.description && (
                    <p className="text-sm text-muted-foreground">{pool.description}</p>
                  )}
                </div>
                <button
                  className="rounded border px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
                  onClick={() => onDeletePool(pool.id, pool.name)}
                  disabled={deleting === pool.id}
                  title="Delete pool"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Stats and Info */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{pool.candidatesCount}</span>
                  <span className="text-muted-foreground">candidates</span>
                </div>
                
                {pool.contactsCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{pool.contactsCount}</span>
                    <span className="text-muted-foreground">contacts</span>
                  </div>
                )}

                {pool.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {new Date(pool.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* AI Prompt */}
              {(pool.latestJob?.queryTemplates?.[0] || pool.icpConfig?.prompt) && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Prompt: </span>
                  <span className="italic">"{formatPrompt(pool)}"</span>
                  {pool.icpConfig && (
                    <button
                      onClick={() => setIcpModalPool(pool)}
                      className="ml-2 text-xs text-blue-600 hover:underline"
                    >
                      View ICP
                    </button>
                  )}
                </div>
              )}

              {/* Preview Table */}
              {pool.candidatesPreview && pool.candidatesPreview.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">Company</th>
                        <th className="text-left p-3 font-medium">Domain</th>
                        <th className="text-left p-3 font-medium">Industry</th>
                        <th className="text-center p-3 font-medium">Contacts</th>
                        <th className="text-center p-3 font-medium">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pool.candidatesPreview.slice(0, 5).map((candidate) => (
                        <tr 
                          key={candidate.id}
                          className="hover:bg-muted/50"
                        >
                          <td className="p-3 font-medium">{candidate.companyName}</td>
                          <td className="p-3">
                            <a 
                              href={`https://${candidate.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {candidate.domain}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {candidate.industry || "—"}
                          </td>
                          <td className="p-3 text-center">
                            {candidate.contacts.length > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                {candidate.contacts.some(c => c.email) && (
                                  <Mail className="w-4 h-4 text-green-600" />
                                )}
                                {candidate.contacts.some(c => c.phone) && (
                                  <Phone className="w-4 h-4 text-blue-600" />
                                )}
                                <span>{candidate.contacts.length}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {candidate.score !== undefined && candidate.score !== null ? (
                              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                {candidate.score}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/crm/leads/pools/${pool.id}`)}
                      >
                        <td colSpan={5} className="p-3 text-center text-sm text-blue-600 hover:underline">
                          View All {pool.candidatesCount} Candidates →
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  onClick={() => router.push(`/crm/leads/pools/${pool.id}`)}
                >
                  Work Pool
                </button>
                {pool.latestJob && (
                  <button
                    className="rounded border px-3 py-2 hover:bg-muted/50"
                    onClick={() => router.push(`/crm/leads/jobs/${pool.latestJob!.id}`)}
                  >
                    View Job
                  </button>
                )}
                <button
                  className="rounded border px-3 py-2 hover:bg-muted/50"
                  onClick={() => router.push("/crm/leads?tab=wizard")}
                >
                  New Job
                </button>
              </div>
            </div>
          ))}

          {!isLoading && (data?.pools?.length ?? 0) === 0 && (
            <div className="text-sm text-muted-foreground">
              No lead pools yet. Create one with the wizard.
            </div>
          )}
        </div>
      </div>

      {/* ICP Config Modal */}
      {icpModalPool && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIcpModalPool(null)}
        >
          <div 
            className="bg-card rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">ICP Configuration</h2>
                <p className="text-sm text-muted-foreground">{icpModalPool.name}</p>
              </div>
              <button
                onClick={() => setIcpModalPool(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-x-auto border">
                {JSON.stringify(icpModalPool.icpConfig, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
