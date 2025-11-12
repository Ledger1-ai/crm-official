import { Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import React from "react";

type Props = {
  open: boolean;
  title: string;
};

const DashboardMenu = ({ open, title }: Props) => {
  const pathname = usePathname();
  const isPath = pathname.split("/").filter(Boolean).length === 1;
  return (
    <div className="flex flex-row items-center p-2 w-full">
      <Link
        href={"/"}
        className={`menu-item ${isPath ? "menu-item-active" : ""}`}
      >
        <Home className="w-6 icon" />
        <span className={open ? "" : "hidden"}>{title}</span>
      </Link>
    </div>
  );
};

export default DashboardMenu;
