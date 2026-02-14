"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { columns } from "../contracts/table-components/columns";

import { useRouter, useSearchParams } from "next/navigation";
import { ContractsDataTable } from "../contracts/table-components/data-table";

import CreateContractForm from "../contracts/_forms/create-contract";
import { NavigationCard } from "@/components/NavigationCard";
import { FileText, Globe, LayoutGrid } from "lucide-react";

const ContractsView = ({ data, crmData, accountId }: any) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const { users, accounts } = crmData;

  const card = {
    title: "Create Contract",
    description: "Create a new contract",
    icon: FileText,
    color: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400"
  };

  const dealRoomCard = {
    title: "Deal Rooms",
    description: "Manage digital sales rooms",
    icon: Globe,
    color: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400"
  };

  const allContractsCard = {
    title: "All Contracts",
    description: "View all your contracts",
    icon: LayoutGrid,
    color: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-400"
  };

  const filteredData = view === "deal_rooms"
    ? data.filter((c: any) => c.deal_room && c.deal_room.is_active)
    : data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {view === "deal_rooms" ? (
          <NavigationCard
            card={allContractsCard}
            onClick={() => router.push('/crm/contracts')}
          />
        ) : (
          <CreateContractForm
            users={users}
            accounts={accounts}
            accountId={accountId}
            customTrigger={<NavigationCard card={card} />}
          />
        )}
        <NavigationCard
          card={dealRoomCard}
          onClick={() => router.push('/crm/contracts?view=deal_rooms')}
        />
      </div>

      <ContractsDataTable
        data={filteredData || []}
        columns={columns}
      />
    </div>
  );
};

export default ContractsView;
