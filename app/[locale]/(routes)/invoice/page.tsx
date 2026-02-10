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
  <div className="group relative overflow-hidden rounded-2xl border border-[#27272a] bg-[#09090b] p-3 transition-all duration-300 h-[110px] w-full cursor-pointer">
    {/* Giant Watermark Icon - Positioned Right */}
    <card.icon
      className={`absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-colors duration-500 pointer-events-none opacity-10 group-hover:opacity-20 ${card.iconColor}`}
    />

    <div className="relative z-10 w-full h-full flex flex-col justify-center items-start pl-1">
      <div className="space-y-0.5">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 group-hover:text-foreground transition-colors">
          {card.title}
        </span>
        <span className="block text-xl font-bold tracking-tight text-foreground">
          {card.description}
        </span>
      </div>
    </div>

    {/* Subtle Glow on Hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
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
