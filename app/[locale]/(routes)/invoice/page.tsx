import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { getInvoices } from "@/actions/invoice/get-invoices";
import { getAccountSettings } from "@/actions/invoice/get-account-settings";

import { columns } from "./data-table/columns";
import { InvoiceDataTable } from "./data-table/data-table";

import Container from "../components/ui/Container";

import ModalDropzone from "./components/modal-dropzone";
import { MyAccountSettingsForm } from "./components/MyAccountSettingsForm";

import { Button } from "@/components/ui/button";
import RightViewModal from "@/components/modals/right-view-modal";
import { MyAccount } from "@prisma/client";
import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/projects/get-boards";
import NewTaskDialog from "./dialogs/NewTask";

import { SyncInvoiceCard } from "./components/SyncInvoiceCard";

import { UploadCloud, FileText, Settings, Loader2 } from "lucide-react";

const CardContent = ({ card, loading = false }: { card: any, loading?: boolean }) => (
  <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 md:p-6 hover:bg-accent/50 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] text-left w-full h-full cursor-pointer">
    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-20 group-hover:opacity-60 transition-opacity duration-300`} />
    <div className="relative z-10 flex flex-col items-center justify-center space-y-2 text-center h-full">
      <div className={`p-3 rounded-full bg-gradient-to-br ${card.color} border border-border shadow-lg group-hover:scale-110 transition-transform duration-300 ${card.iconColor} ring-1 ring-white/20 group-hover:ring-white/40`}>
        <card.icon className={`w-6 h-6 md:w-8 md:h-8 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
      </div>
      <div className="space-y-0.5">
        <span className="block text-sm md:text-lg font-medium text-foreground group-hover:text-primary transition-colors">
          {card.title}
        </span>
        <span className="block text-[10px] md:text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
          {card.description}
        </span>
      </div>
    </div>
  </div>
);

const InvoicePage = async () => {
  const session = await getServerSession(authOptions);
  const invoices: any = await getInvoices();
  const myAccountSettings: MyAccount | null = await getAccountSettings();
  const users = await getActiveUsers();
  const boards = await getBoards(session?.user.id!);

  const cards = [
    {
      title: "Upload PDF",
      description: "Upload new invoice",
      icon: UploadCloud,
      color: "from-cyan-500/20 to-sky-500/20",
      iconColor: "text-cyan-400",
      type: "upload"
    },
    {
      title: "My Invoices",
      description: "View my invoice history",
      icon: FileText,
      color: "from-blue-500/20 to-indigo-500/20",
      iconColor: "text-blue-400",
      type: "link",
      href: `/invoice/${session?.user.id}`
    },
    {
      title: "Sync Invoices",
      description: "Check for new invoices",
      icon: Loader2, // Replaced by custom trigger logic
      color: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-400",
      type: "cron"
    },
    {
      title: "Settings",
      description: "Company invoice settings",
      icon: Settings,
      color: "from-violet-500/20 to-purple-500/20",
      iconColor: "text-violet-400",
      type: "settings"
    }
  ];



  return (
    <Container
      title="Invoices"
      description={"Everything you need to know about invoices and TAX"}
      sticky
    >
      <NewTaskDialog users={users} boards={boards} />

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 flex-shrink-0">
        {/* Upload PDF Card */}
        <ModalDropzone
          buttonLabel="Upload pdf"
          customTrigger={<CardContent card={cards[0]} />}
        />

        {/* My Invoices Link Card */}
        <Link href={cards[1].href!} className="block h-full">
          <CardContent card={cards[1]} />
        </Link>

        {/* Sync Cron Card */}
        {(() => {
          const { icon, ...syncCardProps } = cards[2];
          return <SyncInvoiceCard card={syncCardProps} />;
        })()}

        {/* Settings Card */}
        <RightViewModal
          customTrigger
          label={<CardContent card={cards[3]} />}
          title="Your company settings"
          description="This data will be used as default values for your invoices. You can change them at any time. Very important is to set account email which will receive files for import to ERPs"
          width={"w-[900px]"}
        >
          <MyAccountSettingsForm initialData={myAccountSettings} />
        </RightViewModal>
      </div>

      <div>
        <InvoiceDataTable data={invoices} columns={columns} />
      </div>
    </Container>
  );
};

export default InvoicePage;
