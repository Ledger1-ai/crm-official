"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import UploadFileModal from "@/components/modals/upload-file-modal";
import { Button } from "@/components/ui/button";
// Replaced UploadThing dropzone with Azure Blob upload form

type Props = {
  buttonLabel: string;
  fileType:
  | "pdfUploader"
  | "imageUploader"
  | "docUploader"
  | "docUploader"
  | "profilePhotoUploader";
  customTrigger?: React.ReactNode;
};

const ModalDropzone = ({ buttonLabel, fileType, customTrigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardId = searchParams.get("boardId");

  return (
    <div>
      {customTrigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">{customTrigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)}>{buttonLabel}</Button>
      )}
      <UploadFileModal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setUploading(false);
          router.refresh();
        }}
      >
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const input = e.currentTarget.querySelector("input[type=file]") as HTMLInputElement | null;
            const file = input?.files?.[0];
            if (!file) return;
            setUploading(true);
            const fd = new FormData();
            fd.append("file", file);
            const uploadUrl = boardId ? `/api/projects/${boardId}/upload-document` : "/api/documents/upload";
            const res = await fetch(uploadUrl, { method: "POST", body: fd });
            if (res.ok) {
              setUploading(false);
              setOpen(false);
              router.refresh();
            } else {
              const txt = await res.text();
              console.error("Upload failed:", txt);
              setUploading(false);
            }
          }}
        >
          {uploading && (
            <div className="h-1 w-full bg-muted rounded overflow-hidden">
              <div className="h-full w-1/3 bg-primary animate-pulse" />
            </div>
          )}
          <input type="file" className="block w-full" disabled={uploading} />
          <div className="flex justify-end">
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <span className="inline-flex items-center">
                  Uploading
                  <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                </span>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </form>
      </UploadFileModal>
    </div>
  );
};

export default ModalDropzone;
