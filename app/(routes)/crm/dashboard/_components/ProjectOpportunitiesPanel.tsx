"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

type Project = { id: string; title: string; description?: string };

type Opportunity = {
  id: string;
  title: string;
  description?: string | null;
  category: "FEATURE_BUILDOUT" | "COMMISSIONED_WORK" | "OTHER";
  status: "OPEN" | "WON" | "LOST" | "ARCHIVED";
  valueEstimate?: number | null;
  relatedTasksIDs?: string[];
  createdAt?: string;
};

export default function ProjectOpportunitiesPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"FEATURE_BUILDOUT" | "COMMISSIONED_WORK" | "OTHER">("FEATURE_BUILDOUT");
  const [description, setDescription] = useState("");
  const [valueEstimate, setValueEstimate] = useState<string>("");

  const { toast } = useToast();

  useEffect(() => {
    // Fetch accessible projects
    (async () => {
      try {
        const res = await fetch("/api/campaigns", { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          setProjects((j?.projects || []) as Project[]);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setIsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/campaigns/${encodeURIComponent(selectedProjectId)}/opportunities`, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          setOpportunities(((j?.opportunities || []) as Opportunity[]).filter(o => o.status !== 'ARCHIVED'));
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedProjectId]);

  async function onCreateOpportunity() {
    if (!selectedProjectId) {
      toast({ title: "Select campaign", description: "Choose a campaign first" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Missing title", description: "Enter a title for the opportunity" });
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`/api/campaigns/${encodeURIComponent(selectedProjectId)}/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, description: description || null, valueEstimate: valueEstimate ? Number(valueEstimate) : undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      toast({ title: "Request submitted", description: j?.opportunity?.title });
      setTitle("");
      setDescription("");
      setValueEstimate("");
      // refresh
      const res2 = await fetch(`/api/campaigns/${encodeURIComponent(selectedProjectId)}/opportunities`, { cache: "no-store" });
      const j2 = await res2.json();
      setOpportunities((j2?.opportunities || []) as Opportunity[]);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e?.message || "Failed to create opportunity" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
        <div className="w-full md:w-64">
          <label className="text-sm">Campaign</label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Create New Request</h3>
          <span className="text-xs text-muted-foreground">Feature buildouts & commissioned work</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., White-label integration for Client X" />
          </div>
          <div>
            <label className="text-xs">Category</label>
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FEATURE_BUILDOUT">Feature buildout</SelectItem>
                <SelectItem value="COMMISSIONED_WORK">Commissioned work</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs">Value estimate (USD)</label>
            <Input type="number" value={valueEstimate} onChange={(e) => setValueEstimate(e.target.value)} placeholder="e.g., 25000" />
          </div>
        </div>
        <div>
          <label className="text-xs">Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
        </div>
        <div className="flex justify-end">
          <Button disabled={isLoading} onClick={onCreateOpportunity}>Submit Request</Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Posted Requests</h3>
          <span className="text-xs text-muted-foreground">{opportunities.length} items</span>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {(!selectedProjectId || opportunities.length === 0) && (
            <div className="text-sm text-muted-foreground">{!selectedProjectId ? "Select a campaign to view its opportunities" : "No opportunities yet"}</div>
          )}
          {opportunities.map((o) => (
            <div key={o.id} className="p-3 rounded border bg-background">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-medium">{o.title}</div>
                  <div className="text-xs text-muted-foreground">{o.category.replace("_", " ")} · {o.status}</div>
                </div>
                {typeof o.valueEstimate === "number" && (
                  <div className="text-sm font-semibold">${o.valueEstimate.toLocaleString()}</div>
                )}
              </div>
              {o.description && (
                <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{o.description}</div>
              )}
              {Array.isArray(o.relatedTasksIDs) && o.relatedTasksIDs.length > 0 && (
                <div className="mt-2 text-[11px] text-muted-foreground">Linked tasks: {o.relatedTasksIDs.length}</div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
