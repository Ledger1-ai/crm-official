import React from "react";
import { FileText } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  title: string;
  isMobile?: boolean;
};

const DocumentsModuleMenu = ({ open, title, isMobile = false }: Props) => {
  const pathname = usePathname();
  const isPath = /^\/([a-z]{2}\/)?documents(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/documents"
      icon={FileText}
      title={title}
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default DocumentsModuleMenu;
