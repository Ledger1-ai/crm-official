"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
}

type Project = { id: string; title: string };

export default function AssignProjectModal({ isOpen, onClose, documentId }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFetching(true);
    fetch("/api/campaigns")
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const list: Project[] = (data?.projects || []).map((b: any) => ({ id: b.id, title: b.title }));
        setProjects(list);
        if (list.length > 0) setSelected(list[0].id);
      })
      .catch((e) => {
        console.error("Failed to fetch projects:", e);
      })
      .finally(() => setFetching(false));
  }, [isOpen]);

  const assign = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${selected}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      onClose();
      router.refresh();
    } catch (e) {
      console.error("Failed to assign document:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fetching ? (
            <div className="h-1 w-full bg-muted rounded overflow-hidden">
              <div className="h-full w-1/3 bg-primary animate-pulse" />
            </div>
          ) : (
            <select
              className="w-full border rounded px-2 py-2"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={assign} disabled={loading || !selected}>
              {loading ? (
                <span className="inline-flex items-center">Assigning
                  <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                </span>
              ) : (
                "Assign"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
