"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

/**
 * Azure Blob-based file uploader - replaces UploadThing usage.
 * Props:
 * - endpoint: one of "documents" | "generic" | "project"
 * - projectId?: required when endpoint === "project"
 */
export default function FileUploader({ endpoint = "documents", projectId }: { endpoint?: "documents" | "generic" | "project"; projectId?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const targetUrl = endpoint === "project" && projectId
    ? `/api/campaigns/${projectId}/upload-document`
    : endpoint === "generic"
      ? "/api/upload"
      : "/api/documents/upload";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Select a file" });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(targetUrl, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Uploaded", description: "File uploaded successfully" });
      setFile(null);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Unexpected error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      {file ? <div className="text-xs text-muted-foreground">{file.name}</div> : null}
      <Button type="submit" disabled={loading}>{loading ? "Uploading…" : "Upload"}</Button>
    </form>
  );
}
