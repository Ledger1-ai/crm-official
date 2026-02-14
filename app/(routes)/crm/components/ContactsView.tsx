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

import { columns } from "../contacts/table-components/columns";
import { NewContactForm } from "../contacts/components/NewContactForm";
import { ContactsDataTable } from "../contacts/table-components/data-table";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { NavigationCard } from "@/components/NavigationCard";

const ContactsView = ({ data, crmData }: any) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const { users, accounts } = crmData;

  const card = {
    title: "Create Contact",
    description: "Add a new contact",
    icon: UserPlus,
    color: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-400"
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
              <SheetTitle>Create new Contact</SheetTitle>
            </SheetHeader>
            <div className="h-full overflow-y-auto">
              <NewContactForm
                users={users}
                accounts={accounts}
                onFinish={() => setOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {!data || data.length === 0 ? (
        <Card>
          <CardContent className="p-5">No assigned contacts found</CardContent>
        </Card>
      ) : (
        <ContactsDataTable
          data={data}
          columns={columns}
        />
      )}
    </div>
  );
};

export default ContactsView;
