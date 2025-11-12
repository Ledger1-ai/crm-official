import { FileCheck } from "lucide-react";
import Link from "next/link";

import { usePathname } from "next/navigation";
import React from "react";

type Props = {
  open: boolean;
  title: string;
};

const InvoicesModuleMenu = ({ open, title }: Props) => {
  const pathname = usePathname();
  const isPath = pathname.includes("invoice");
  return (
    <div className="flex flex-row items-center mx-auto p-2">
      <Link href={"/invoice"} className={`menu-item ${isPath ? "menu-item-active" : ""}`}>
        <FileCheck className="w-6 icon" />
        <span className={open ? "" : "hidden"}>{title}</span>
      </Link>
    </div>
  );
};

export default InvoicesModuleMenu;
