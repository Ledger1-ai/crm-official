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

import { useRouter } from "next/navigation";
import { ContractsDataTable } from "../contracts/table-components/data-table";

import CreateContractForm from "../contracts/_forms/create-contract";
import { NavigationCard } from "@/components/NavigationCard";
import { FileText } from "lucide-react";

const ContractsView = ({ data, crmData, accountId }: any) => {
  const router = useRouter();
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CreateContractForm
          users={users}
          accounts={accounts}
          accountId={accountId}
          customTrigger={<NavigationCard card={card} />}
        />
      </div>

      <ContractsDataTable
        data={data || []}
        columns={columns}
      />
    </div>
  );
};

export default ContractsView;
