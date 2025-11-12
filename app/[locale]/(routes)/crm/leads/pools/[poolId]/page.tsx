"use client";

import { use } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { X, Mail, Phone, Linkedin, Building2, ExternalLink, User, CheckCircle2 } from "lucide-react";

type ContactCandidate = {
  id: string;
  fullName?: string;
  title?: string;
  email?: string;
  emailStatus?: "VALID" | "RISKY" | "INVALID" | "CATCH_ALL" | "UNKNOWN";
  phone?: string;
  linkedinUrl?: string;
  confidence?: number;
  status?: string;
};

type LeadCandidate = {
  id: string;
  domain?: string;
  companyName?: string;
  homepageUrl?: string;
  description?: string;
  industry?: string;
  techStack?: any;
  score?: number;
  freshnessAt?: string;
  status?: string;
  contacts: ContactCandidate[];
};

type CandidatesResponse = {
  candidates: LeadCandidate[];
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
};

export default function PoolDetailPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = use(params);
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<CandidatesResponse>(
    `/api/leads/pools/${poolId}/candidates`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: teamData } = useSWR<{ users: TeamMember[] }>(
    "/api/leads/team-members",
    fetcher
  );

  // Assignment state
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null);
  const [candidateAssignments, setCandidateAssignments] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState(false);
  const [detailsModal, setDetailsModal] = useState<LeadCandidate | null>(null);

  const toggleCandidateAssignment = (candidateId: string) => {
    if (!selectedTeamMember) return;

    setCandidateAssignments((prev) => {
      const newAssignments = { ...prev };
      if (newAssignments[candidateId] === selectedTeamMember.id) {
        // Unassign if clicking same team member
        delete newAssignments[candidateId];
      } else {
        // Assign to selected team member
        newAssignments[candidateId] = selectedTeamMember.id;
      }
      return newAssignments;
    });
  };

  const onConfirmAssignments = async () => {
    const assignments = Object.entries(candidateAssignments).map(([candidateId, userId]) => ({
      candidateId,
      userId,
    }));

    if (assignments.length === 0) {
      alert("No candidates assigned. Please select candidates and assign them to team members.");
      return;
    }

    if (!confirm(`Confirm assignment of ${assignments.length} candidate(s) to team members? This will convert them to Leads.`)) {
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch(`/api/leads/pools/${poolId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });

      if (!res.ok) {
        throw new Error("Failed to assign candidates");
      }

      const result = await res.json();
      alert(`Successfully assigned ${result.assigned} lead(s) to team members!`);
      
      // Reset state and refresh
      setCandidateAssignments({});
      setSelectedTeamMember(null);
      mutate();
      
    } catch (error: any) {
      alert(error.message || "Failed to assign candidates");
    } finally {
      setAssigning(false);
    }
  };

  const getAssignedColor = (candidateId: string) => {
    const userId = candidateAssignments[candidateId];
    if (!userId) return null;
    return teamData?.users.find((u) => u.id === userId)?.color || null;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lead Pool - Assignment</h1>
          <p className="text-sm text-muted-foreground">
            Assign candidates to team members to convert them into Leads
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-1" onClick={() => router.push("../")}>
            All Lead Pools
          </button>
          <button className="rounded border px-3 py-1" onClick={() => router.push("../../autogen")}>
            New Lead Pool
          </button>
        </div>
      </div>

      {/* Team Member Selection & Assignment Controls */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              Select Team Member for Assignment
            </label>
            <select
              className="w-full max-w-sm rounded border p-2 bg-background"
              value={selectedTeamMember?.id || ""}
              onChange={(e) => {
                const member = teamData?.users.find((u) => u.id === e.target.value);
                setSelectedTeamMember(member || null);
              }}
            >
              <option value="">-- Select a team member --</option>
              {teamData?.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {selectedTeamMember && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedTeamMember.color }}
                />
                <span>
                  Click on candidates to assign them to <strong>{selectedTeamMember.name}</strong>
                </span>
              </div>
            )}
          </div>
          <button
            className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            onClick={onConfirmAssignments}
            disabled={assigning || Object.keys(candidateAssignments).length === 0}
          >
            <CheckCircle2 className="w-4 h-4" />
            {assigning ? "Assigning..." : `Confirm Assignments (${Object.keys(candidateAssignments).length})`}
          </button>
        </div>
      </div>

      {isLoading && <div className="text-sm">Loading candidates…</div>}
      {error && <div className="text-sm text-red-600">Failed to load candidates</div>}

      {/* Candidates Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Company</th>
                <th className="text-left p-3 text-sm font-medium">Domain</th>
                <th className="text-left p-3 text-sm font-medium">Industry</th>
                <th className="text-left p-3 text-sm font-medium">Contacts</th>
                <th className="text-left p-3 text-sm font-medium">Tech Stack</th>
                <th className="text-center p-3 text-sm font-medium">Score</th>
                <th className="text-center p-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.candidates ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No candidates found. Run a lead generation job first.
                  </td>
                </tr>
              )}
              {(data?.candidates ?? []).map((cand) => {
                const assignedColor = getAssignedColor(cand.id);
                return (
                <tr 
                  key={cand.id} 
                  className={`hover:bg-muted/50 cursor-pointer transition-colors ${
                    assignedColor ? 'border-l-4' : ''
                  }`}
                  style={assignedColor ? { 
                    backgroundColor: `${assignedColor}15`,
                    borderLeftColor: assignedColor 
                  } : {}}
                  onClick={() => toggleCandidateAssignment(cand.id)}
                >
                  <td className="p-3">
                    <div className="font-medium">{cand.companyName || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {cand.description || "No description"}
                    </div>
                  </td>
                  <td className="p-3">
                    {cand.homepageUrl ? (
                      <a 
                        href={cand.homepageUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        {cand.domain}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-sm">{cand.domain || "—"}</span>
                    )}
                  </td>
                  <td className="p-3 text-sm">{cand.industry || "—"}</td>
                  <td className="p-3">
                    <div className="space-y-1">
                      {cand.contacts.slice(0, 2).map((contact, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="font-medium flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {contact.fullName || "Direct"}
                          </div>
                          {contact.email && (
                            <div className="text-muted-foreground flex items-center gap-1 ml-4">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="text-muted-foreground flex items-center gap-1 ml-4">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      ))}
                      {cand.contacts.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{cand.contacts.length - 2} more contacts
                        </div>
                      )}
                      {cand.contacts.length === 0 && (
                        <div className="text-xs text-muted-foreground">No contacts</div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(cand.techStack) && cand.techStack.length > 0 ? (
                        cand.techStack.slice(0, 2).map((tech: string, idx: number) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                          >
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {Array.isArray(cand.techStack) && cand.techStack.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{cand.techStack.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      {cand.score ?? 0}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      className="rounded border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                      onClick={() => setDetailsModal(cand)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailsModal(null)}>
          <div 
            className="bg-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">{detailsModal.companyName || "Unknown Company"}</h2>
                  <p className="text-sm text-muted-foreground">{detailsModal.domain}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModal(null)}
                className="rounded-full p-2 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Company Info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Company Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Industry:</span>
                    <div className="font-medium">{detailsModal.industry || "—"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ICP Score:</span>
                    <div className="font-medium">{detailsModal.score ?? 0}/100</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="font-medium">{detailsModal.status || "NEW"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Website:</span>
                    {detailsModal.homepageUrl ? (
                      <a 
                        href={detailsModal.homepageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div>—</div>
                    )}
                  </div>
                </div>
                {detailsModal.description && (
                  <div>
                    <span className="text-sm text-muted-foreground">Description:</span>
                    <p className="text-sm mt-1">{detailsModal.description}</p>
                  </div>
                )}
                {Array.isArray(detailsModal.techStack) && detailsModal.techStack.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Tech Stack:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {detailsModal.techStack.map((tech: string, idx: number) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contacts */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contacts ({detailsModal.contacts.length})
                </h3>
                {detailsModal.contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contacts found</p>
                ) : (
                  <div className="space-y-3">
                    {detailsModal.contacts.map((contact, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-base">{contact.fullName || "Direct"}</h4>
                            {contact.title && (
                              <p className="text-sm text-muted-foreground">{contact.title}</p>
                            )}
                          </div>
                          {contact.confidence && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {contact.confidence}% confidence
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0">
                                <a 
                                  href={`mailto:${contact.email}`}
                                  className="text-sm text-blue-600 hover:underline break-all"
                                >
                                  {contact.email}
                                </a>
                                {contact.emailStatus && contact.emailStatus !== "UNKNOWN" && (
                                  <div className={`text-xs mt-0.5 ${
                                    contact.emailStatus === "VALID" ? "text-green-600" :
                                    contact.emailStatus === "RISKY" ? "text-orange-600" :
                                    "text-red-600"
                                  }`}>
                                    {contact.emailStatus}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <a 
                                href={`tel:${contact.phone}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {contact.phone}
                              </a>
                            </div>
                          )}

                          {contact.linkedinUrl && (
                            <div className="flex items-center gap-2 md:col-span-2">
                              <Linkedin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <a 
                                href={contact.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate flex items-center gap-1"
                              >
                                LinkedIn Profile <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>

                        {(!contact.email && !contact.phone && !contact.linkedinUrl) && (
                          <p className="text-sm text-muted-foreground">No contact information available</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
