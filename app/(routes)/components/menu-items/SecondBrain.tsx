"use client";

import React from "react";
import { Lightbulb } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  isMobile?: boolean;
};

const SecondBrainModuleMenu = ({ open, isMobile = false }: Props) => {
  const pathname = usePathname();
  const isPath = /^\/([a-z]{2}\/)?secondBrain(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/secondBrain"
      icon={Lightbulb}
      title="Second Brain"
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default SecondBrainModuleMenu;
