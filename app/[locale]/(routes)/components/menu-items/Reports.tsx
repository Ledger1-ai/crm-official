import React from "react";
import { FileBarChart } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  title: string;
  isMobile?: boolean;
};

const ReportsModuleMenu = ({ open, title, isMobile = false }: Props) => {
  const pathname = usePathname();
  const isPath = /^\/([a-z]{2}\/)?reports(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/reports"
      icon={FileBarChart}
      title={title}
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default ReportsModuleMenu;
