"use client";

import React from "react";
import { Users } from "lucide-react";
import { usePathname } from "next/navigation";
import MenuItem from "./MenuItem";

type Props = {
  open: boolean;
  isMobile?: boolean;
};

const EmployeesModuleMenu = ({ open, isMobile = false }: Props) => {
  const pathname = usePathname();
  const isPath = /^\/([a-z]{2}\/)?employees(\/|$)/.test(pathname);

  return (
    <MenuItem
      href="/employees"
      icon={Users}
      title="Employees"
      isOpen={open}
      isActive={isPath}
      isMobile={isMobile}
    />
  );
};

export default EmployeesModuleMenu;
