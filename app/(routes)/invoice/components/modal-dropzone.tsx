"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import UploadFileModal from "@/components/modals/upload-file-modal";
import { Button } from "@/components/ui/button";

import { FileInput } from "./FileInput";

type Props = {
  buttonLabel?: string;
  customTrigger?: React.ReactNode;
};

const ModalDropzone = ({ buttonLabel, customTrigger }: Props) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div>
      {customTrigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {customTrigger}
        </div>
      ) : (
        <Button onClick={() => setOpen(true)}>{buttonLabel}</Button>
      )}
      <UploadFileModal
        isOpen={open}
        onClose={() => {
          router.refresh();
          setOpen(false);
        }}
      >
        <FileInput onClose={() => setOpen(false)} />
      </UploadFileModal>
    </div>
  );
};

export default ModalDropzone;
