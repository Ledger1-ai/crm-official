import { FileText } from "lucide-react";
import Link from "next/link";

import { usePathname } from "next/navigation";
import React from "react";

type Props = {
  open: boolean;
  title: string;
};

const DocumentsModuleMenu = ({ open, title }: Props) => {
  const pathname = usePathname();
  const isPath = pathname.includes("documents");
  return (
    <div className="flex flex-row items-center mx-auto p-2">
      <Link href={"/documents"} className={`menu-item ${isPath ? "menu-item-active" : ""}`}>
        <FileText className="w-6 icon" />
        <span className={open ? "" : "hidden"}>{title}</span>
      </Link>
    </div>
  );
};

export default DocumentsModuleMenu;
