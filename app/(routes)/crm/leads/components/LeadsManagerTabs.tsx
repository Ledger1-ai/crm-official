"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import LeadsView from "./LeadsView";
import ProcessPanel from "./ProcessPanel";
import DialerPanel from "../../dialer/DialerPanel";
import RightViewModal from "@/components/modals/right-view-modal";
import { NewLeadForm } from "./NewLeadForm";
import { LayoutList, Briefcase, Phone, Plus } from "lucide-react";
import { usePermission } from "@/components/providers/permissions-provider";
import DashboardCard from "../../dashboard/_components/DashboardCard";

type Props = {
  leads: any[];
  crmData: any;
  defaultTab?: "all" | "workspace" | "dialer";
  isMember?: boolean;
};

export default function LeadsManagerTabs({ leads: initialLeads, crmData, defaultTab = "all", isMember = false }: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { data: leadsData } = useSWR('/api/leads/list', fetcher, {
    fallbackData: initialLeads
  });

  const { hasAccess, isSuperAdmin, permissions } = usePermission();

  console.log('[DEBUG LEADS TABS]', {
    isSuperAdmin,
    permissionsLength: permissions?.length,
    hasLeadsAccess: hasAccess('leads'),
    allPermissions: permissions
  });

  const { data: projectResponse } = useSWR("/api/campaigns", fetcher);

  const leads = leadsData || [];
  const users = crmData?.users || [];
  const accounts = crmData?.accounts || [];
  const projects = projectResponse?.projects || [];

  // Define Cards with Permission Checks
  const navCards = [
    {
      id: "all",
      title: "All Leads",
      description: "View and manage all leads",
      icon: LayoutList,
      color: "from-cyan-500/20 to-sky-500/20",
      iconColor: "text-cyan-400",
      permission: "leads.tabs.all"
    },
    {
      id: "workspace",
      title: "Workspace",
      description: "Focus on active pipeline",
      icon: Briefcase,
      color: "from-purple-500/20 to-violet-500/20",
      iconColor: "text-purple-400",
      permission: "leads.tabs.workspace"
    },
    {
      id: "dialer",
      title: "Dialer",
      description: "Make and track calls",
      icon: Phone,
      color: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-400",
      permission: "leads.tabs.dialer"
    },
  ];

  const addLeadCard = {
    title: "Add Lead",
    description: "Create a new lead",
    icon: Plus,
    color: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-400",
  };

  // Filter visible cards
  const visibleCards = navCards.filter(card => hasAccess('leads') && hasAccess(card.permission));
  const canCreate = hasAccess('leads.actions.create');

  // Prevent accessing tabs that are hidden
  useEffect(() => {
    // If current tab is not visible, switch to first visible
    const currentVisible = visibleCards.find(c => c.id === activeTab);
    if (!currentVisible && visibleCards.length > 0) {
      setActiveTab(visibleCards[0].id as any);
    }
  }, [visibleCards, activeTab]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Navigation Cards Grid */}
      {/* Navigation Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 flex-shrink-0 pb-4 pt-4 -mt-2">
        {visibleCards.map((card) => {
          let variant: "info" | "violet" | "warning" | "default" = "default";
          if (card.id === "all") variant = "info";
          if (card.id === "workspace") variant = "violet";
          if (card.id === "dialer") variant = "warning";

          return (
            <DashboardCard
              key={card.id}
              icon={card.icon}
              label={card.title}
              description={card.description}
              variant={variant}
              hideIcon={true}
              onClick={() => setActiveTab(card.id as typeof activeTab)}
              className={activeTab === card.id ? "ring-2 ring-primary border-primary/50 bg-accent/10" : ""}
              labelClassName="text-sm md:text-base"
              descriptionClassName="text-[10px] md:text-xs"
            />
          );
        })}

        {/* Add Lead Card with Modal */}
        {canCreate && (
          <RightViewModal
            customTrigger
            label={
              <DashboardCard
                icon={addLeadCard.icon}
                label={addLeadCard.title}
                description={addLeadCard.description}
                variant="success"
                hideIcon={true}
                labelClassName="text-sm md:text-base"
                descriptionClassName="text-[10px] md:text-xs"
              />
            }
            title="Create New Lead"
            description="Fill out the form below to add a new lead to your CRM."
          >
            <NewLeadForm users={users} accounts={accounts} projects={projects} />
          </RightViewModal>
        )}
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} className="w-full relative flex flex-col flex-1">
        {hasAccess('leads.tabs.all') && (
          <TabsContent value="all" className="flex-1 mt-0">
            <LeadsView crmData={crmData} data={leads} isMember={isMember} />
          </TabsContent>
        )}
        {hasAccess('leads.tabs.workspace') && (
          <TabsContent value="workspace" className="flex-1 mt-0">
            <ProcessPanel leads={leads as any} crmData={crmData} />
          </TabsContent>
        )}
        {hasAccess('leads.tabs.dialer') && (
          <TabsContent value="dialer" className="flex-1 mt-0">
            <DialerPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
