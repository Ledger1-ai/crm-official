"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coins } from "lucide-react";

import { usePathname, useRouter } from "next/navigation";

const AnyDropdownMenu = DropdownMenu as any;
const AnyDropdownMenuTrigger = DropdownMenuTrigger as any;
const AnyDropdownMenuContent = DropdownMenuContent as any;
const AnyDropdownMenuItem = DropdownMenuItem as any;
const AnyDropdownMenuSeparator = DropdownMenuSeparator as any;
const AnyCoins = Coins as any;

type Props = {
  open: boolean;
  localizations: any;
};

const CrmModuleMenu = ({ open, localizations }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const isPath = pathname.includes("crm");

  return (
    <div className="flex flex-row items-center mx-auto p-2">
      <AnyDropdownMenu>
        <AnyDropdownMenuTrigger
          className={`menu-item ${isPath ? "menu-item-active" : ""} w-full`}
        >
          <div className="flex items-center gap-2">
            <AnyCoins className="w-6 icon" />
            <span className={open ? "" : "hidden"}>{localizations.title}</span>
          </div>
        </AnyDropdownMenuTrigger>
        <AnyDropdownMenuContent className="w-[250px] ml-10">
          <AnyDropdownMenuItem onClick={() => router.push("/crm/dashboard")}>
            Dashboard
          </AnyDropdownMenuItem>
          <AnyDropdownMenuItem onClick={() => router.push("/crm/dashboard/user")}>
            My Dashboard
          </AnyDropdownMenuItem>
          <AnyDropdownMenuItem onClick={() => router.push("/crm")}>
            Overview
          </AnyDropdownMenuItem>
          <AnyDropdownMenuSeparator />
          <AnyDropdownMenuItem onClick={() => router.push("/crm/accounts")}>
            {localizations.accounts}
          </AnyDropdownMenuItem>
          <AnyDropdownMenuItem onClick={() => router.push("/crm/contacts")}>
            {localizations.contacts}
          </AnyDropdownMenuItem>
          <AnyDropdownMenuItem onClick={() => router.push("/crm/leads")}>
            Leads Manager
          </AnyDropdownMenuItem>
          <AnyDropdownMenuItem onClick={() => router.push("/crm/dialer")}>
            Dialer
          </AnyDropdownMenuItem>
          <AnyDropdownMenuItem onClick={() => router.push("/crm/opportunities")}>
            {localizations.opportunities}
          </AnyDropdownMenuItem>
          <AnyDropdownMenuItem onClick={() => router.push("/crm/contracts")}>
            {localizations.contracts}
          </AnyDropdownMenuItem>
        </AnyDropdownMenuContent>
      </AnyDropdownMenu>
    </div>
  );
};

export default CrmModuleMenu;
