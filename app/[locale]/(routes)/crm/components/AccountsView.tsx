"use client";

import React, { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { columns } from "../accounts/table-components/columns";
import { NewAccountForm } from "../accounts/components/NewAccountForm";
import { AccountDataTable } from "../accounts/table-components/data-table";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { NavigationCard } from "@/components/NavigationCard";

const AccountsView = ({ data, crmData }: any) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const { users, industries } = crmData;

  const card = {
    title: "Create Account",
    description: "Add a new company account",
    icon: Building2,
    color: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-400"
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <div onClick={() => setOpen(true)}>
            <NavigationCard card={card} />
          </div>
          <SheetContent className="min-w-[1000px] space-y-2">
            <SheetHeader>
              <SheetTitle>Create new Account</SheetTitle>
            </SheetHeader>
            <div className="h-full overflow-y-auto">
              <NewAccountForm
                industries={industries}
                users={users}
                onFinish={() => setOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <AccountDataTable
        data={data || []}
        columns={columns}
        industries={industries}
        users={users}
      />
    </div>
  );
};

export default AccountsView;
