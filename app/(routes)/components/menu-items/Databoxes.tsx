"use client";

import React from "react";
import { FileEdit } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  isMobile?: boolean;
};

const DataboxModuleMenu = ({ open, isMobile = false }: Props) => {
  const pathname = usePathname();
  const isPath = /^\/([a-z]{2}\/)?databox(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/databox"
      icon={FileEdit}
      title="Databox"
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default DataboxModuleMenu;
