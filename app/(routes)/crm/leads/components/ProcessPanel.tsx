"use client";

import React, { useEffect, useMemo, useState } from "react";
import StageProgressBar, { type StageDatum } from "@/components/StageProgressBar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { STAGE_TEXT_CLASS, type PipelineStage } from "@/components/stageStyles";
import { toast } from "react-hot-toast";

// Minimal lead shape used by the panel
type LeadLite = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  pipeline_stage?: PipelineStage | null;
  outreach_status?: string | null;
  outreach_meeting_link?: string | null;
};

type Props = {
  leads?: LeadLite[]; // optional: can be passed from server page
  crmData?: any; // for rendering LeadsView in Identify
};

const STAGES: PipelineStage[] = [
  "Identify",
  "Engage_AI",
  "Engage_Human",
  "Offering",
  "Finalizing",
  "Closed",
];

export default function ProcessPanel({ leads: leadsProp, crmData: _crmData }: Props) {
  const [leads, setLeads] = useState<LeadLite[]>(leadsProp || []);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [activeStage, setActiveStage] = useState<PipelineStage>("Identify");
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [brandPrimaryColor, setBrandPrimaryColor] = useState<string | null>(null);
  // SMS quick send state
  const [smsPrompt, setSmsPrompt] = useState("");
  const [sendingSms, setSendingSms] = useState(false);
  // Softphone control UI state
  const [softphoneNumber, setSoftphoneNumber] = useState<string>("");
  const [softphoneStatus, setSoftphoneStatus] = useState<string>("");

  async function reloadActivities(leadId?: string) {
    const id = leadId || selectedLeadId;
    if (!id) return;
    try {
      setLoadingActivities(true);
      const res = await fetch(`/api/leads/activities/${encodeURIComponent(id)}`);
      if (res.ok) {
        const j = await res.json();
        setActivities(Array.isArray(j?.activities) ? j.activities : []);
      }
    } catch {
      /* noop */
    } finally {
      setLoadingActivities(false);
    }
  }

  // If no leads passed, attempt a lightweight fetch (scoped to current user)
  useEffect(() => {
    if (leadsProp && leadsProp.length) return;
    (async () => {
      try {
        const res = await fetch("/api/leads/team-members"); // placeholder; replace with dedicated leads endpoint when available
        if (res.ok) {
          const j = await res.json();
          const fetched: LeadLite[] = Array.isArray(j?.leads) ? j.leads : [];
          if (fetched.length) {
            setLeads(fetched);
            setSelectedLeadId(fetched[0].id);
            setActiveStage((fetched[0].pipeline_stage as any) || "Identify");
          }
        }
      } catch {
        /* noop */
      }
    })();
  }, [leadsProp]);

  const selectedLead = useMemo(() => leads.find((l) => l.id === selectedLeadId) || leads[0], [leads, selectedLeadId]);

  function leadDisplayParts(l: LeadLite) {
    const primary = l.email?.trim() || l.phone?.trim() || [l.firstName, l.lastName].filter(Boolean).join(" ").trim() || "Lead";
    const company = l.company?.trim();
    return { primary, company };
  }

  useEffect(() => {
    if (selectedLead?.pipeline_stage) {
      setActiveStage(selectedLead.pipeline_stage);
    }
  }, [selectedLead?.pipeline_stage]);

  useEffect(() => {
    if (selectedLeadId) {
      reloadActivities(selectedLeadId);
      reloadNotes(selectedLeadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeadId]);

  // Softphone status listener and default number binding from selected lead
  useEffect(() => {
    // default number from selected lead
    const def = (selectedLead?.phone || "").trim();
    if (def) setSoftphoneNumber(def);

    function onMessage(ev: MessageEvent) {
      try {
        const data: any = ev.data || {};
        if (data?.type === "softphone:status") {
          setSoftphoneStatus(String(data?.status || ""));
        }
      } catch { }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [selectedLead?.phone]);

  async function reloadNotes(leadId?: string) {
    const id = leadId || selectedLeadId;
    if (!id) return;
    try {
      setLoadingNotes(true);
      const res = await fetch(`/api/leads/notes/${encodeURIComponent(id)}`);
      if (res.ok) {
        const j = await res.json();
        setNotes(Array.isArray(j?.notes) ? j.notes : []);
      }
    } catch {
      /* noop */
    } finally {
      setLoadingNotes(false);
    }
  }

  async function postNote() {
    const id = selectedLeadId;
    if (!id || !noteText.trim()) return;
    try {
      const mentions = Array.from(noteText.matchAll(/@([\w.-]{2,64})/g)).map((m) => m[1]);
      const res = await fetch(`/api/leads/notes/${encodeURIComponent(id)}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: noteText, mentions }) });
      if (res.ok) {
        setNoteText("");
        reloadNotes(id);
        toast.success("Note posted");
      } else {
        const txt = await res.text();
        toast.error(txt || "Failed to post note");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to post note");
    }
  }

  async function setClosed() {
    const id = selectedLeadId;
    if (!id) return;
    try {
      const res = await fetch(`/api/outreach/close/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Closed via Process panel" })
      });
      if (res.ok) {
        toast.success("Lead marked as closed");
        setActiveStage("Closed");
        reloadActivities(id);
      } else {
        const txt = await res.text();
        toast.error(txt || "Failed to close lead");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to close lead");
    }
  }

  // Build StageProgressBar data for a single lead: mark only current stage as count=1
  const stageData: StageDatum[] = useMemo(() => {
    const cur: PipelineStage = selectedLead?.pipeline_stage || "Identify";
    return STAGES.map((s) => ({ key: s, label: s.replace("_", " "), count: s === cur ? 1 : 0 }));
  }, [selectedLead?.pipeline_stage]);

  const total = 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-full">
      {/* Sidebar: lead selection + stage progress */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div>
          <div className="text-sm font-semibold mb-2">Select Lead</div>
          <Select value={selectedLeadId} onValueChange={(v) => setSelectedLeadId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a lead" />
            </SelectTrigger>
            <SelectContent>
              {leads.map((l) => {
                const { primary, company } = leadDisplayParts(l);
                return (
                  <SelectItem key={l.id} value={l.id}>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium truncate">{primary}</div>
                      {company && (
                        <div className="text-xs text-muted-foreground truncate">{company}</div>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="text-sm font-semibold mb-2">Progress</div>
          <StageProgressBar
            stages={stageData}
            total={total}
            orientation="vertical"
            nodeSize={20}
            trackHeight={420}
            showMetadata={true}
            onStageClick={(s) => setActiveStage(s)}
            coloringMode="activated"
            activeStageKey={selectedLead?.pipeline_stage || "Identify"}
            isClosed={selectedLead?.pipeline_stage === "Closed"}
            showMicroStatus
            microStatusText={selectedLead?.pipeline_stage === "Closed" ? "Complete" : "In Progress"}
          />
        </div>
      </div>

      {/* Main pane: stage-specific information */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`text-lg font-semibold ${STAGE_TEXT_CLASS[activeStage]}`}>{activeStage.replace("_", " ")}</div>
          <div className="flex items-center gap-2">
            {brandPrimaryColor && (
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: brandPrimaryColor }} />
            )}
            {brandLogoUrl && (
              <img src={brandLogoUrl} alt="Brand" className="h-6 w-6 rounded object-contain" />
            )}
            <div className="text-sm text-muted-foreground">
              {(() => {
                const parts = selectedLead ? leadDisplayParts(selectedLead) : { primary: "-", company: undefined };
                return (
                  <span>
                    Lead: {parts.primary} {parts.company ? (<span className="text-muted-foreground">· {parts.company}</span>) : null}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {activeStage === "Identify" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">AI Rating & ICP fit will appear here (coming from icp-scoring and enrichment).</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border p-2 bg-card">
                <div className="text-xs font-semibold mb-1">ICP Score</div>
                <div className="text-sm">—</div>
              </div>
              <div className="rounded border p-2 bg-card">
                <div className="text-xs font-semibold mb-1">Signals</div>
                <div className="text-sm">—</div>
              </div>
            </div>
          </div>
        )}

        {activeStage === "Engage_AI" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Sent email subject/body and open status.</div>
              <Button size="sm" variant="secondary" onClick={() => reloadActivities()} disabled={loadingActivities}>
                {loadingActivities ? "Loading..." : "Refresh"}
              </Button>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs font-semibold">Subject</div>
              <div className="text-sm">{activities.find((a: any) => a.type === "email_sent")?.metadata?.subject || "-"}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs font-semibold">Body (plain text)</div>
              <div className="text-sm whitespace-pre-wrap">{activities.find((a: any) => a.type === "email_sent")?.metadata?.bodyText || "(no body saved)"}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs font-semibold">Open Status</div>
              <div className="text-sm">{selectedLead?.outreach_status || "-"}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs font-semibold">Meeting Link</div>
              <div className="text-sm break-all">{activities.find((a: any) => a.type === "email_sent")?.metadata?.meetingLink || selectedLead?.outreach_meeting_link || "(none)"}</div>
            </div>

            {(() => {
              const AzureSalesAgentPanel = require("@/components/voice/AzureSalesAgentPanel").default;
              return <AzureSalesAgentPanel leadId={selectedLeadId} />;
            })()}

            {/* Live Transcript */}
            <div className="rounded border p-2">
              <div className="text-[11px] font-semibold mb-1">Live Transcript (activity feed)</div>
              <div className="text-xs max-h-40 overflow-auto whitespace-pre-wrap break-words">
                {(() => {
                  const segs = activities.filter((a: any) => a.type === 'call_transcript_segment');
                  if (!segs.length) return <div className="text-muted-foreground">No transcript yet.</div>;
                  return (
                    <ol className="list-decimal pl-4 space-y-1">
                      {segs.slice().reverse().map((s: any) => (
                        <li key={s.id}>
                          <span className="text-[10px] text-muted-foreground mr-2">{new Date(s.createdAt).toLocaleTimeString()}</span>
                          <span>{s.metadata?.text || ''}</span>
                        </li>
                      ))}
                    </ol>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {activeStage === "Engage_Human" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Use the softphone and AI coach during calls. Status updates will appear below.</div>
            <div>
              {(() => {
                const AzureCoachPanel = require("@/components/voice/AzureCoachPanel").default;
                return <AzureCoachPanel />;
              })()}
            </div>

            {/* Custom softphone is provided by AzureCoachPanel above. Legacy CCP removed. */}

            {/* Live Transcript */}
            <div className="rounded border p-2">
              <div className="text-[11px] font-semibold mb-1">Live Transcript (activity feed)</div>
              <div className="text-xs max-h-40 overflow-auto whitespace-pre-wrap break-words">
                {(() => {
                  const segs = activities.filter((a: any) => a.type === 'call_transcript_segment');
                  if (!segs.length) return <div className="text-muted-foreground">No transcript yet.</div>;
                  return (
                    <ol className="list-decimal pl-4 space-y-1">
                      {segs.slice().reverse().map((s: any) => (
                        <li key={s.id}>
                          <span className="text-[10px] text-muted-foreground mr-2">{new Date(s.createdAt).toLocaleTimeString()}</span>
                          <span>{s.metadata?.text || ''}</span>
                        </li>
                      ))}
                    </ol>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {activeStage === "Offering" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Project documents with live gamma.app links will be shown here for editing and attaching to email.</div>
            <div className="rounded border p-3">
              <div className="text-xs font-semibold">Meeting Link</div>
              <div className="text-sm break-all">{activities.find((a: any) => a.type === "email_sent")?.metadata?.meetingLink || selectedLead?.outreach_meeting_link || "(none)"}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs font-semibold">SMS</div>
              {(() => {
                const sms = activities.find((a: any) => a.type === 'sms_sent');
                if (!sms) return <div className="text-sm text-muted-foreground">No SMS sent.</div>;
                return (
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">To:</span> {sms.metadata?.to || '-'}</div>
                    <div className="break-words whitespace-pre-wrap"><span className="font-medium">Body:</span> {sms.metadata?.body || '-'}</div>
                    {sms.metadata?.messageId ? (<div><span className="font-medium">MessageId:</span> {sms.metadata.messageId}</div>) : null}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeStage === "Finalizing" && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Attach invoice link and upload/view contracts/agreements.</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border p-3">
                <div className="text-xs font-semibold">Invoice Link</div>
                <Input placeholder="https://..." />
              </div>
              <div className="rounded border p-3">
                <div className="text-xs font-semibold">Contracts/Agreements</div>
                <Button variant="secondary" size="sm">Upload</Button>
              </div>
            </div>
          </div>
        )}

        {activeStage === "Closed" && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Mark lead as closed; pending SuperAdmin review and approval.</div>
            <Button variant="destructive" onClick={setClosed}>Set Closed</Button>
          </div>
        )}

        {/* Messageboard / tagging */}
        <div className="rounded border p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold">Team Notes & Mentions</div>
            <Button size="sm" variant="secondary" onClick={() => reloadNotes()} disabled={loadingNotes}>
              {loadingNotes ? "Loading..." : "Refresh"}
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-auto mb-3">
            {notes.length === 0 && (
              <div className="text-xs text-muted-foreground">No notes yet.</div>
            )}
            {notes.map((n: any) => (
              <div key={n.id} className="rounded border p-2">
                <div className="text-[10px] text-muted-foreground mb-1">{new Date(n.createdAt).toLocaleString()}</div>
                <div className="text-sm whitespace-pre-wrap">
                  {(n.metadata?.text || "").replace(/@([\w.-]{2,64})/g, "@$1")}
                </div>
                {Array.isArray(n.metadata?.mentions) && n.metadata.mentions.length > 0 && (
                  <div className="mt-1 text-[10px] text-muted-foreground">mentions: {n.metadata.mentions.join(", ")}</div>
                )}
              </div>
            ))}
          </div>
          <Textarea rows={3} placeholder="@tag team members and add a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
          <div className="mt-2 flex gap-2 justify-end">
            <Button size="sm" onClick={postNote} disabled={!noteText.trim()}>Post</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
