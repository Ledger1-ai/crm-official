import React from "react";
import { Home } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  title: string;
  isMobile?: boolean;
  teamRole?: string;
};

const DashboardMenu = ({ open, title, isMobile = false }: Props) => {
  const pathname = usePathname();
  // Strictly match /dashboard or /<locale>/dashboard. 
  const isPath = pathname === "/dashboard" || /^\/[a-zA-Z0-9-]+\/dashboard(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/dashboard"
      icon={Home}
      title={title}
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default DashboardMenu;
