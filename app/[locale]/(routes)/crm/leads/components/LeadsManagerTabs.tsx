"use client";

import React, { useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SWRSessionProvider } from "@/components/providers/swr-session-provider";
import LeadsView from "./LeadsView";
import ProcessPanel from "./ProcessPanel";
import DialerPanel from "../../dialer/DialerPanel";
import RightViewModal from "@/components/modals/right-view-modal";
import { NewLeadForm } from "./NewLeadForm";
import { LayoutList, Briefcase, Phone, Plus } from "lucide-react";

type Props = {
  leads: any[];
  crmData: any;
  defaultTab?: "all" | "workspace" | "dialer";
};

const navCards = [
  {
    id: "all",
    title: "All Leads",
    description: "View and manage all leads",
    icon: LayoutList,
    color: "from-cyan-500/20 to-sky-500/20",
    iconColor: "text-cyan-400",
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "Focus on active pipeline",
    icon: Briefcase,
    color: "from-purple-500/20 to-violet-500/20",
    iconColor: "text-purple-400",
  },
  {
    id: "dialer",
    title: "Dialer",
    description: "Make and track calls",
    icon: Phone,
    color: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-400",
  },
];

const addLeadCard = {
  title: "Add Lead",
  description: "Create a new lead",
  icon: Plus,
  color: "from-emerald-500/20 to-green-500/20",
  iconColor: "text-emerald-400",
};

export default function LeadsManagerTabs({ leads: initialLeads, crmData, defaultTab = "all" }: Props) {
  return (
    <SWRSessionProvider>
      <LeadsManagerTabsContent leads={initialLeads} crmData={crmData} defaultTab={defaultTab} />
    </SWRSessionProvider>
  );
}

function LeadsManagerTabsContent({ leads: initialLeads, crmData, defaultTab }: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { data: leadsData } = useSWR('/api/leads/list', fetcher, {
    fallbackData: initialLeads,
    revalidateOnFocus: false
  });

  const leads = leadsData || [];
  const users = crmData?.users || [];
  const accounts = crmData?.accounts || [];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Navigation Cards Grid */}
      {/* Navigation Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 flex-shrink-0 pb-4 pt-4 -mt-2">
        {navCards.map((card) => (
          <button
            key={card.id}
            onClick={() => setActiveTab(card.id as typeof activeTab)}
            className={`group relative overflow-hidden rounded-xl border p-4 md:p-6 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] text-left ${activeTab === card.id
              ? "border-primary/50 bg-white/10 ring-2 ring-primary/30"
              : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} ${activeTab === card.id ? 'opacity-100' : 'opacity-20 group-hover:opacity-60'} transition-opacity duration-300`} />

            <div className="relative z-10 flex flex-col items-center justify-center space-y-2 text-center">
              {/* Icon Container */}
              <div className={`p-3 rounded-full bg-gradient-to-br ${card.color} border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300 ${card.iconColor} ring-1 ring-white/20 group-hover:ring-white/40`}>
                <card.icon className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5">
                <span className="block text-sm md:text-lg font-medium text-foreground group-hover:text-white transition-colors">
                  {card.title}
                </span>
                <span className="block text-[10px] md:text-xs text-muted-foreground group-hover:text-white/80 transition-colors">
                  {card.description}
                </span>
              </div>
            </div>
          </button>
        ))}

        {/* Add Lead Card with Modal */}
        <RightViewModal
          customTrigger
          label={
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 md:p-6 hover:bg-white/10 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] text-left w-full h-full">
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${addLeadCard.color} opacity-20 group-hover:opacity-60 transition-opacity duration-300`} />

              <div className="relative z-10 flex flex-col items-center justify-center space-y-2 text-center h-full">
                {/* Icon Container */}
                <div className={`p-3 rounded-full bg-gradient-to-br ${addLeadCard.color} border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300 ${addLeadCard.iconColor} ring-1 ring-white/20 group-hover:ring-white/40`}>
                  <addLeadCard.icon className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-sm md:text-lg font-medium text-foreground group-hover:text-white transition-colors">
                    {addLeadCard.title}
                  </span>
                  <span className="block text-[10px] md:text-xs text-muted-foreground group-hover:text-white/80 transition-colors">
                    {addLeadCard.description}
                  </span>
                </div>
              </div>
            </div>
          }
          title="Create New Lead"
          description="Fill out the form below to add a new lead to your CRM."
        >
          <NewLeadForm users={users} accounts={accounts} />
        </RightViewModal>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} className="w-full relative flex flex-col flex-1">
        <TabsContent value="all" className="flex-1 mt-0">
          <LeadsView crmData={crmData} data={leads} />
        </TabsContent>
        <TabsContent value="workspace" className="flex-1 mt-0">
          <ProcessPanel leads={leads as any} crmData={crmData} />
        </TabsContent>
        <TabsContent value="dialer" className="flex-1 mt-0">
          <DialerPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
