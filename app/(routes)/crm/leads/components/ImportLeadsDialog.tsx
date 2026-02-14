"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type PoolSummary = {
  id: string;
  name: string;
  description?: string;
};

type PreviewStats = {
  totalRows: number;
  validCandidates: number;
  validContacts: number;
  corruptRows: number;
  duplicates: { candidate: number; contact: number };
  creates: { candidate: number; contact: number };
  updates: { candidate: number; contact: number };
};

type CandidatePreview = {
  dedupeKey: string;
  domain?: string;
  companyName?: string;
  homepageUrl?: string;
  description?: string;
  industry?: string;
  techStack?: string[];
  existingId?: string | null;
  changes?: Record<string, { from: any; to: any }>;
};

type ContactPreview = {
  dedupeKey: string; // email lowercased
  candidateKey?: string; // candidate dedupeKey (domain/company)
  fullName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  existingId?: string | null;
  changes?: Record<string, { from: any; to: any }>;
};

type PreviewResponse = {
  poolId: string | null;
  poolName?: string;
  poolMode: "new" | "existing";
  mapping?: {
    usedColumns?: string[];
    unmappedColumns?: string[];
  };
  stats: PreviewStats;
  creates: { candidates: CandidatePreview[]; contacts: ContactPreview[] };
  updates: { candidates: CandidatePreview[]; contacts: ContactPreview[] };
  corruptRows: { index: number; errors: string[] }[];
};

type CommitResponse = {
  created: { candidates: number; contacts: number };
  updated: { candidates: number; contacts: number };
};

type Props = {
  pools: PoolSummary[];
  onCommitted?: () => void;
};

export default function ImportLeadsDialog({ pools, onCommitted }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [poolId, setPoolId] = useState<string>(pools[0]?.id ?? "");
  const [createNewPool, setCreateNewPool] = useState<boolean>(false);
  const [newPoolName, setNewPoolName] = useState<string>("");
  const [newPoolDescription, setNewPoolDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(null);
    setCommitResult(null);
    setError(null);
  };

  const startPreview = async () => {
    if (!file) {
      setError("Please select a CSV or XLSX file.");
      return;
    }
    if (createNewPool) {
      if (!newPoolName.trim()) {
        setError("Please enter a name for the new Lead Pool.");
        return;
      }
    } else {
      if (!poolId) {
        setError("Please select a target Lead Pool.");
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    setPreview(null);
    setCommitResult(null);

    try {
      const form = new FormData();
      form.append("file", file);
      if (createNewPool) {
        form.append("newPoolName", newPoolName);
        if (newPoolDescription.trim()) form.append("newPoolDescription", newPoolDescription);
      } else {
        form.append("poolId", poolId);
      }

      const res = await fetch("/api/leads/pools/import/preview", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to preview import");
      }
      const data = (await res.json()) as PreviewResponse;
      setPreview(data);
    } catch (e: any) {
      setError(e?.message || "Failed to preview import");
    } finally {
      setSubmitting(false);
    }
  };

  const commitImport = async () => {
    if (!preview) {
      setError("No preview data to commit.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setCommitResult(null);

    try {
      const res = await fetch("/api/leads/pools/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolId: preview.poolId ?? undefined,
          newPool: preview.poolMode === "new" ? { name: preview.poolName || newPoolName, description: newPoolDescription || undefined } : undefined,
          creates: preview.creates,
          updates: preview.updates,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to commit import");
      }
      const data = (await res.json()) as CommitResponse;
      setCommitResult(data);
      if (onCommitted) onCommitted();
    } catch (e: any) {
      setError(e?.message || "Failed to commit import");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setCommitResult(null);
    setError(null);
  };

  const closeDialog = () => {
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 text-white hover:bg-blue-700">Import Leads</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Leads into a Pool</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preview && !commitResult && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Target Lead Pool</label>
                  <div className="mt-1 mb-2 flex items-center gap-2">
                    <Switch
                      id="createNewPool"
                      checked={createNewPool}
                      onCheckedChange={setCreateNewPool}
                    />
                    <label htmlFor="createNewPool" className="text-sm">Create new pool</label>
                  </div>
                  {!createNewPool ? (
                    <>
                      <select
                        className="w-full rounded border p-2"
                        value={poolId}
                        onChange={(e) => setPoolId(e.target.value)}
                      >
                        {pools.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {!pools.length && (
                        <p className="text-xs text-muted-foreground mt-1">
                          No pools found. You can create a new pool with the checkbox above.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <input
                        className="w-full rounded border p-2"
                        placeholder="New pool name"
                        value={newPoolName}
                        onChange={(e) => setNewPoolName(e.target.value)}
                      />
                      <input
                        className="w-full rounded border p-2"
                        placeholder="Description (optional)"
                        value={newPoolDescription}
                        onChange={(e) => setNewPoolDescription(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Upload File (CSV or XLSX)</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    className="mt-1 w-full rounded border p-2"
                    onChange={onFileChange}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={startPreview}
                  disabled={submitting || !file || (!createNewPool && !poolId) || (createNewPool && !newPoolName)}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Analyzing…" : "Preview Import"}
                </Button>
                <Button variant="outline" onClick={reset} disabled={submitting}>
                  Reset
                </Button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}
              <p className="text-xs text-muted-foreground">
                The preview will normalize columns, detect corrupt rows, duplicates, and proposed creates/updates before committing.
              </p>
            </>
          )}

          {preview && !commitResult && (
            <>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Preview Summary</h3>
                <div className="text-sm">
                  <div>Total Rows: {preview.stats.totalRows}</div>
                  <div>Valid Companies: {preview.stats.validCandidates}</div>
                  <div>Valid Contacts: {preview.stats.validContacts}</div>
                  <div>Corrupt Rows: {preview.stats.corruptRows}</div>
                  <div>Duplicates (companies): {preview.stats.duplicates.candidate}</div>
                  <div>Duplicates (contacts): {preview.stats.duplicates.contact}</div>
                  <div>Creates (companies): {preview.stats.creates.candidate}</div>
                  <div>Creates (contacts): {preview.stats.creates.contact}</div>
                  <div>Updates (companies): {preview.stats.updates.candidate}</div>
                  <div>Updates (contacts): {preview.stats.updates.contact}</div>
                </div>
                {preview.mapping && (
                  <div className="text-xs text-muted-foreground">
                    <div>Detected Columns: {preview.mapping.usedColumns?.join(", ")}</div>
                    {preview.mapping.unmappedColumns?.length ? (
                      <div>Unmapped Columns: {preview.mapping.unmappedColumns?.join(", ")}</div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-auto border rounded p-2">
                <div>
                  <h4 className="text-sm font-semibold">Company Updates</h4>
                  <ul className="text-xs space-y-1">
                    {preview.updates.candidates.slice(0, 50).map((c) => (
                      <li key={c.dedupeKey}>
                        {c.companyName || c.domain}:{" "}
                        {c.changes
                          ? Object.keys(c.changes)
                              .map((k) => `${k}: "${c.changes![k].from ?? ""}" → "${c.changes![k].to ?? ""}"`)
                              .join(", ")
                          : "no changes"}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Contact Updates</h4>
                  <ul className="text-xs space-y-1">
                    {preview.updates.contacts.slice(0, 50).map((c) => (
                      <li key={c.dedupeKey}>
                        {c.email || c.fullName}:{" "}
                        {c.changes
                          ? Object.keys(c.changes)
                              .map((k) => `${k}: "${c.changes![k].from ?? ""}" → "${c.changes![k].to ?? ""}"`)
                              .join(", ")
                          : "no changes"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={commitImport}
                  disabled={submitting}
                  className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? "Committing…" : "Commit Import"}
                </Button>
                <Button variant="outline" onClick={() => setPreview(null)} disabled={submitting}>
                  Back
                </Button>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}
            </>
          )}

          {commitResult && (
            <>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Import Complete</h3>
                <div className="text-sm">
                  <div>Created Companies: {commitResult.created.candidates}</div>
                  <div>Created Contacts: {commitResult.created.contacts}</div>
                  <div>Updated Companies: {commitResult.updated.candidates}</div>
                  <div>Updated Contacts: {commitResult.updated.contacts}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={closeDialog} className="bg-blue-600 text-white hover:bg-blue-700">
                  Close
                </Button>
                <Button variant="outline" onClick={reset}>
                  New Import
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
