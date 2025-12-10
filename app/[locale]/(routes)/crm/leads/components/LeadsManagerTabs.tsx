"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LeadsView from "./LeadsView";
import ProcessPanel from "./ProcessPanel";
import DialerPanel from "../../dialer/DialerPanel";

type Props = {
  leads: any[];
  crmData: any;
  defaultTab?: "all" | "workspace" | "dialer";
};

export default function LeadsManagerTabs({ leads, crmData, defaultTab = "all" }: Props) {
  return (
    <div className="w-full h-full flex flex-col">
      <Tabs defaultValue={defaultTab} className="w-full h-full flex flex-col">
        <div className="flex items-center justify-start mb-4 flex-shrink-0 w-full">
          <TabsList className="!flex !flex-col sm:!flex-row h-auto sm:h-9 p-1 bg-muted/50 backdrop-blur-sm border border-border/50 w-full sm:w-auto gap-1 sm:gap-0">
            <TabsTrigger value="all" className="text-[10px] uppercase tracking-wider font-semibold px-3 py-2 sm:py-1 data-[state=active]:bg-background data-[state=active]:shadow-sm w-full sm:w-auto justify-center">All Leads</TabsTrigger>
            <TabsTrigger value="workspace" className="text-[10px] uppercase tracking-wider font-semibold px-3 py-2 sm:py-1 data-[state=active]:bg-background data-[state=active]:shadow-sm w-full sm:w-auto justify-center">Workspace</TabsTrigger>
            <TabsTrigger value="dialer" className="text-[10px] uppercase tracking-wider font-semibold px-3 py-2 sm:py-1 data-[state=active]:bg-background data-[state=active]:shadow-sm w-full sm:w-auto justify-center">Dialer</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="all" className="overflow-auto flex-1">
          <LeadsView crmData={crmData} data={leads} />
        </TabsContent>
        <TabsContent value="workspace" className="overflow-auto flex-1">
          <ProcessPanel leads={leads as any} crmData={crmData} />
        </TabsContent>
        <TabsContent value="dialer" className="overflow-auto flex-1">
          <DialerPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
