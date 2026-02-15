import { Suspense } from "react";

import SuspenseLoading from "@/components/loadings/suspense";

import Container from "../../components/ui/Container";

import TabsContainer from "./components/TabsContainer";
import LeadGenWizardPage from "./autogen/page";
import LeadPoolsPage from "./pools/page";
import SettingsTabs from "./components/SettingsTabs";
import LeadsManagerTabs from "./components/LeadsManagerTabs";
import CampaignsView from "./components/CampaignsView";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type LeadsPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const LeadsPage = async ({ searchParams }: LeadsPageProps) => {
  const sp = searchParams ? await searchParams : undefined;
  const tabParam = sp?.tab;
  let tab = typeof tabParam === "string" ? tabParam : Array.isArray(tabParam) ? tabParam[0] ?? "manager" : "manager";

  // Check generic member role
  const session = await getServerSession(authOptions);
  let isMember = false;

  if (session?.user?.id) {
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { team_role: true }
    });

    // If user is a MEMBER, they are restricted
    if (user?.team_role === "MEMBER") {
      isMember = true;
      // If they try to access anything other than manager, force 'manager' (essentially a redirect/override)
      if (tab !== "manager") {
        // We can either redirect or just force render. For safer UX, let's just force the variable. 
        // But redirect is cleaner URL wise.
        return redirect("/crm/leads?tab=manager");
      }
    }
  }

  // Only load heavy data when needed for the active tab (Client-side fetch optimization)
  const crmData = tab === "manager" ? await getAllCrmData() : null;
  const leads = tab === "manager" ? await getLeads() : null;

  const getTabInfo = (currentTab: string) => {
    switch (currentTab) {
      case "wizard":
        return {
          title: "Leads Wizard",
          description: "Generate and manage leads using AI-powered tools"
        };
      case "pools":
        return {
          title: "Leads Pools",
          description: "Manage and organize your lead pools efficiently"
        };
      case "campaigns":
        return {
          title: "Sequences",
          description: "Track and manage your marketing sequences"
        };
      case "settings":
        return {
          title: "Settings",
          description: "Configure your lead management preferences"
        };
      case "manager":
      default:
        return {
          title: "Leads",
          description: "Manage your schedule and lead interactions"
        };
    }
  };

  const { title, description } = getTabInfo(tab);

  return (
    <div className="h-full w-full">
      <TabsContainer
        title={title}
        description={description}
        isMember={isMember}
        managerSlot={
          tab === "manager" ? (
            <Suspense fallback={<SuspenseLoading />}>
              <LeadsManagerTabs leads={leads as any} crmData={crmData} isMember={isMember} />
            </Suspense>
          ) : null
        }
        wizardSlot={!isMember && tab === "wizard" ? <LeadGenWizardPage /> : null}
        poolsSlot={!isMember && tab === "pools" ? <LeadPoolsPage /> : null}
        campaignsSlot={!isMember && tab === "campaigns" ? <CampaignsView /> : null}
        settingsSlot={!isMember && tab === "settings" ? (
          <SettingsTabs />
        ) : null}
      />
    </div>
  );
};

export default LeadsPage;
