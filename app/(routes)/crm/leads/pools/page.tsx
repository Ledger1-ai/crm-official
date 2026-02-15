"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import fetcher from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Target,
  Users,
  UserPlus,
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
import FirstContactWizard from "@/components/modals/FirstContactWizard";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AssignPoolMembersModal from "../components/AssignPoolMembersModal";

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
    refreshInterval: 30000,
  });
  const { data: projectsData } = useSWR<{ projects: { id: string; title: string }[] }>("/api/campaigns", fetcher, { refreshInterval: 120000 });
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardLeadIds, setWizardLeadIds] = useState<string[]>([]);
  const [loadingOutreach, setLoadingOutreach] = useState<string | null>(null);
  const [assigningProject, setAssigningProject] = useState<string | null>(null);
  const [assignModalPool, setAssignModalPool] = useState<LeadPool | null>(null);

  // Button set presets per project (Boards)
  const [buttonSets, setButtonSets] = useState<Record<string, { sets: any[] }>>({});
  const [selectedButtonSet, setSelectedButtonSet] = useState<Record<string, string>>({});
  const [savingButtonSet, setSavingButtonSet] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setViewMode("card");
    }
  }, [isMobile]);

  // Cache version check - invalidates SWR cache when server resets at 12 AM PST
  useEffect(() => {
    const checkCacheVersion = async () => {
      try {
        const res = await fetch("/api/cache-version");
        if (!res.ok) return;
        const { version } = await res.json();
        const storedVersion = sessionStorage.getItem("poolsCacheVersion");

        if (storedVersion && version !== storedVersion) {
          // Server cache was reset - invalidate all SWR caches
          console.log("[CACHE] Server version changed, invalidating SWR cache");
          globalMutate(() => true, undefined, { revalidate: true });
        }
        sessionStorage.setItem("poolsCacheVersion", version);
      } catch (e) {
        // Silently fail - not critical
      }
    };

    // Check immediately on mount
    checkCacheVersion();

    // Then check every 60 seconds
    const interval = setInterval(checkCacheVersion, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-load button sets for pools with assigned project and preselect default
  useEffect(() => {
    (async () => {
      try {
        if (!data?.pools) return;
        for (const pool of data.pools) {
          const pid = pool.icpConfig?.assignedProjectId;
          if (!pid) continue;
          // Skip if already loaded
          if (buttonSets[pool.id]?.sets?.length) continue;
          const res = await fetch(`/api/campaigns/${pid}/button-sets`);
          if (!res.ok) continue;
          const j = await res.json();
          const sets = Array.isArray(j?.sets) ? j.sets : [];
          setButtonSets((prev) => ({ ...prev, [pool.id]: { sets } }));
          const def = sets.find((x: any) => x.isDefault);
          if (!selectedButtonSet[pool.id] && !pool.icpConfig?.assignedButtonSetId) {
            setSelectedButtonSet((prev) => ({ ...prev, [pool.id]: def?.id || "" }));
          }
        }
      } catch {
        // noop
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pools]);

  const startFirstContact = async (poolId: string) => {
    try {
      setLoadingOutreach(poolId);
      const res = await fetch(`/api/leads/pools/${encodeURIComponent(poolId)}/leads?mine=true`);
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      const ids: string[] = Array.isArray(j?.leads) ? (j.leads as any[]).filter(l => !!l.email).map(l => l.id) : [];
      setWizardLeadIds(ids);
      setWizardOpen(true);
    } catch (e) {
      console.error(e);
      alert("Failed to load leads for outreach");
    } finally {
      setLoadingOutreach(null);
    }
  };

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
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 lg:p-8 pb-4">
        <div className="flex items-center justify-between">
          <Heading
            title="Lead Pools"
            description="AI-assisted lead generation pools with detailed candidate previews"
          />
          <div className="flex items-center gap-2">
            <ImportLeadsDialog pools={data?.pools ?? []} onCommitted={() => mutate()} />
            {/* View Toggle */}
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>
        <Separator className="mt-4" />
      </div>

      <div className="px-4 md:px-6 lg:px-8 py-6">

        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading pools…</div>
        )}

        {/* Error display removed to prevent phantom errors */}
        {/* {error && !data?.pools && (
          <div className="text-sm text-red-600">Failed to load pools</div>
        )} */}

        <div className="space-y-4">
          {viewMode === "table" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Candidates</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.pools?.map((pool) => (
                    <TableRow key={pool.id}>
                      <TableCell className="font-medium">
                        <div>{pool.name}</div>
                        {pool.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{pool.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {pool.latestJob && (
                          <Badge variant="secondary" className={getStatusColor(pool.latestJob.status)}>
                            {pool.latestJob.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{pool.candidatesCount}</TableCell>
                      <TableCell>{pool.contactsCount}</TableCell>
                      <TableCell>
                        {pool.createdAt ? new Date(pool.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="text-blue-600 hover:underline text-sm mr-2"
                            onClick={() => router.push(`/crm/leads/pools/${pool.id}`)}
                          >
                            View
                          </button>
                          <button
                            className="text-red-600 hover:underline text-sm"
                            onClick={() => onDeletePool(pool.id, pool.name)}
                            disabled={deleting === pool.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Card View */
            data?.pools?.map((pool) => (
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
                  <button
                    className="rounded border px-2 py-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                    onClick={() => setAssignModalPool(pool)}
                    title="Assign team members to this pool"
                  >
                    <UserPlus className="w-4 h-4" />
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
                    {/* Desktop Table */}
                    <table className="hidden md:table w-full text-sm">
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

                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y">
                      {pool.candidatesPreview.slice(0, 5).map((candidate) => (
                        <div key={candidate.id} className="p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{candidate.companyName}</div>
                              <a
                                href={`https://${candidate.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {candidate.domain}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            {candidate.score !== undefined && candidate.score !== null && (
                              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                {candidate.score}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{candidate.industry || "—"}</span>
                            <div className="flex items-center gap-2">
                              {candidate.contacts.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  {candidate.contacts.some(c => c.email) && <Mail className="w-3 h-3 text-green-600" />}
                                  {candidate.contacts.some(c => c.phone) && <Phone className="w-3 h-3 text-blue-600" />}
                                  <span>{candidate.contacts.length} contacts</span>
                                </div>
                              ) : (
                                <span>No contacts</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div
                        className="p-3 text-center text-sm text-blue-600 hover:underline cursor-pointer bg-muted/30"
                        onClick={() => router.push(`/crm/leads/pools/${pool.id}`)}
                      >
                        View All {pool.candidatesCount} Candidates →
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Assignment + Actions */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Project:</label>
                    <select
                      className="rounded border p-1 text-sm bg-background"
                      value={pool.icpConfig?.assignedProjectId || ""}
                      onChange={async (e) => {
                        const projectId = e.target.value;
                        if (!projectId) return;
                        setAssigningProject(pool.id);
                        try {
                          const res = await fetch(`/api/leads/pools/${pool.id}/assign-project`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ projectId })
                          });
                          if (!res.ok) throw new Error(await res.text());

                          // After assigning project, load its button sets and preselect default if none chosen
                          try {
                            const resp = await fetch(`/api/campaigns/${projectId}/button-sets`);
                            if (resp.ok) {
                              const j = await resp.json();
                              const sets = Array.isArray(j?.sets) ? j.sets : [];
                              setButtonSets((prev) => ({ ...prev, [pool.id]: { sets } }));
                              const def = sets.find((x: any) => x.isDefault);
                              setSelectedButtonSet((prev) => ({ ...prev, [pool.id]: def?.id || "" }));
                            }
                          } catch (_e) {
                            // ignore
                          }

                          mutate();
                        } catch (err) {
                          alert("Failed to assign project");
                        } finally {
                          setAssigningProject(null);
                        }
                      }}
                      disabled={assigningProject === pool.id}
                    >
                      <option value="">-- Select a project --</option>
                      {(projectsData?.projects || []).map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    {pool.icpConfig?.assignedProjectId && (
                      <button
                        className="rounded border px-3 py-1 text-xs hover:bg-muted/50"
                        onClick={() => router.push(`/documents?boardId=${pool.icpConfig.assignedProjectId}`)}
                        title="Manage Documents for this project"
                      >
                        Manage Documents
                      </button>
                    )}
                  </div>

                  {/* Button Set selection & save */}
                  {pool.icpConfig?.assignedProjectId && (
                    <div className="flex items-center gap-2 mt-2">
                      <label className="text-sm">Button Set:</label>
                      <select
                        className="rounded border p-1 text-sm bg-background"
                        value={selectedButtonSet[pool.id] || pool.icpConfig?.assignedButtonSetId || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSelectedButtonSet((prev) => ({ ...prev, [pool.id]: v }));
                        }}
                      >
                        <option value="">-- Select a button set --</option>
                        {(buttonSets[pool.id]?.sets || []).map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name}{s.isDefault ? " (default)" : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        className="rounded border px-3 py-1 text-xs hover:bg-muted/50"
                        onClick={async () => {
                          const pid = pool.icpConfig?.assignedProjectId;
                          if (!pid) { alert("Select a project first"); return; }
                          try {
                            const res = await fetch(`/api/campaigns/${pid}/button-sets`);
                            if (!res.ok) throw new Error(await res.text());
                            const j = await res.json();
                            const sets = Array.isArray(j?.sets) ? j.sets : [];
                            setButtonSets((prev) => ({ ...prev, [pool.id]: { sets } }));
                            // Auto-select default if none selected
                            if (!selectedButtonSet[pool.id]) {
                              const def = sets.find((x: any) => x.isDefault);
                              setSelectedButtonSet((prev) => ({ ...prev, [pool.id]: def?.id || "" }));
                            }
                          } catch (e) {
                            alert("Failed to load button sets");
                          }
                        }}
                      >
                        Load Sets
                      </button>
                      <button
                        className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                        onClick={async () => {
                          const pid = pool.icpConfig?.assignedProjectId;
                          const sid = selectedButtonSet[pool.id];
                          if (!pid || !sid) { alert("Select a project and button set"); return; }
                          setSavingButtonSet(pool.id);
                          try {
                            const res = await fetch(`/api/leads/pools/${pool.id}/assign-button-set`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ projectId: pid, buttonSetId: sid })
                            });
                            if (!res.ok) throw new Error(await res.text());
                            mutate();
                            alert("Button set assigned");
                          } catch (e) {
                            alert("Failed to assign button set");
                          } finally {
                            setSavingButtonSet(null);
                          }
                        }}
                        disabled={savingButtonSet === pool.id}
                      >
                        {savingButtonSet === pool.id ? "Saving…" : "Save Button Set"}
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      onClick={() => router.push(`/crm/leads/pools/${pool.id}`)}
                    >
                      Work Pool
                    </button>
                    <button
                      className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                      onClick={() => startFirstContact(pool.id)}
                      disabled={loadingOutreach === pool.id}
                      title="Initiate First Contact for your assigned leads in this pool"
                    >
                      {loadingOutreach === pool.id ? "Preparing…" : "Initiate First Contact"}
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
              </div>
            ))
          )}

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
      {/* Assign Pool Members Modal */}
      {assignModalPool && (
        <AssignPoolMembersModal
          poolId={assignModalPool.id}
          poolName={assignModalPool.name}
          isOpen={true}
          onClose={() => setAssignModalPool(null)}
          onUpdate={() => mutate()}
        />
      )}
      {/* First Contact Wizard */}
      <FirstContactWizard
        isOpen={!!wizardOpen}
        onClose={() => setWizardOpen(false)}
        leadIds={wizardLeadIds}
      />
    </div>
  );
}
