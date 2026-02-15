"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  uploader: "pdfUploader" | "imageUploader" | "docUploader" | "profilePhotoUploader";
  onUploadSuccess?: () => void;
  boardId?: string; // if provided, will upload to the project-specific endpoint
};

// Azure Blob-based dropzone replacement (no UploadThing)
export const FileUploaderDropzone = ({ uploader, onUploadSuccess, boardId }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = (() => {
    if (uploader === "profilePhotoUploader") return "/api/profile/upload-photo";
    if (boardId) return `/api/campaigns/${boardId}/upload-document`;
    return "/api/documents/upload"; // generic documents
  })();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!file) { setError("Select a file"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      onUploadSuccess?.();
      setFile(null);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full" />
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>{loading ? "Uploading…" : "Upload"}</Button>
      </div>
    </form>
  );
};
