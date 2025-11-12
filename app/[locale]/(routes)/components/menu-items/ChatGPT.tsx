"use client";

import { Bot } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import React from "react";

type Props = {
  open: boolean;
};

const ChatGPTModuleMenu = ({ open }: Props) => {
  const pathname = usePathname();
  const isPath = pathname.includes("openAi");
  return (
    <div className="flex flex-row items-center mx-auto p-2">
      <Link href={"/openAi"} className={`menu-item ${isPath ? "menu-item-active" : ""}`}>
        <Bot className="w-6 icon" />
        <span className={open ? "" : "hidden"}>Varuni</span>
      </Link>
    </div>
  );
};

export default ChatGPTModuleMenu;
