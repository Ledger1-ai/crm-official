"use client";

import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
}

export default function UploadFileModal({
  isOpen,
  onClose,
  children,
  title = "Upload File",
}: ModalProps) {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className=" py-10">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
