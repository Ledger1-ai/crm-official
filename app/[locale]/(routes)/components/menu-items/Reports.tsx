import { FileBarChart } from "lucide-react";
import Link from "next/link";

import { usePathname } from "next/navigation";
import React from "react";

type Props = {
  open: boolean;
  title: string;
};

const ReportsModuleMenu = ({ open, title }: Props) => {
  const pathname = usePathname();
  const isPath = pathname.includes("reports");
  return (
    <div className={`flex flex-row items-center mx-auto p-2`}>
      <Link
        href={"/reports"}
        className={`menu-item ${isPath ? "menu-item-active" : ""}`}
      >
        <FileBarChart className="w-6 icon" />
        <span className={open ? "" : "hidden"}>{title}</span>
      </Link>
    </div>
  );
};

export default ReportsModuleMenu;
