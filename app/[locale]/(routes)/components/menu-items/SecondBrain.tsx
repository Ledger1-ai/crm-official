"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lightbulb, ServerIcon, UserIcon } from "lucide-react";
import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";
import React from "react";

type Props = {
  open: boolean;
};

const SecondBrainModuleMenu = ({ open }: Props) => {
  const pathname = usePathname();
  const isPath = pathname.includes("secondBrain");
  return (
    <div className="flex flex-row items-center mx-auto p-2">
      <Link href={"/secondBrain"} className={`menu-item ${isPath ? "menu-item-active" : ""}`}>
        <Lightbulb className="w-6 icon" />
        <span className={open ? "" : "hidden"}>Second brain</span>
      </Link>
    </div>
  );
};

export default SecondBrainModuleMenu;
