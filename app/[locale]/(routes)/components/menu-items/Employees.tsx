import { Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import React from "react";

type Props = {
  open: boolean;
};

const EmployeesModuleMenu = ({ open }: Props) => {
  const pathname = usePathname();
  const isPath = pathname.includes("employees");
  return (
    <div className="flex flex-row items-center mx-auto p-2">
      <Link href={"/employees"} className={`menu-item ${isPath ? "menu-item-active" : ""}`}>
        <Users className="w-6 icon" />
        <span className={open ? "" : "hidden"}>Employees</span>
      </Link>
    </div>
  );
};

export default EmployeesModuleMenu;
