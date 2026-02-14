"use client";

import React from "react";
import { Bot } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  isMobile?: boolean;
};

const ChatGPTModuleMenu = ({ open, isMobile = false }: Props) => {
  const pathname = usePathname();
  const isPath = /^\/([a-z]{2}\/)?openAi(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/openAi"
      icon={Bot}
      title="Varuni"
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default ChatGPTModuleMenu;
