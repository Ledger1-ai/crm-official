import React from "react";
import { FileCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  title: string;
  isMobile?: boolean;
};

const InvoicesModuleMenu = ({ open, title, isMobile = false }: Props) => {
  const pathname = usePathname();
  const isPath = /^\/([a-z]{2}\/)?invoice(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/invoice"
      icon={FileCheck}
      title={title}
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default InvoicesModuleMenu;
