import { getLead } from "@/actions/crm/get-lead";
import Container from "@/app/(routes)/components/ui/Container";
import React from "react";
import { BasicView } from "./components/BasicView";
import { LeadTimeline } from "./components/LeadTimeline";
import { LeadScore } from "../components/LeadScore";
import { Separator } from "@/components/ui/separator";
import { History, Info } from "lucide-react";

interface LeadDetailPageProps {
  params: Promise<{
    leadId: string;
  }>;
}

const LeadDetailPage = async (props: LeadDetailPageProps) => {
  const params = await props.params;
  const { leadId } = params;
  const lead: any = await getLead(leadId);

  if (!lead) return <div>Lead not found</div>;

  return (
    <Container
      title={`${lead?.firstName} ${lead?.lastName}`}
      description={lead?.company || "Lead Details"}
      action={<LeadScore leadData={lead} />}
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pb-20">
        {/* Left Column: Details (4/12 or 5/12) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
              <Info size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Lead Information</h3>
          </div>
          <BasicView data={lead} />
        </div>

        {/* Right Column: Timeline (7/12 or 8/12) */}
        <div className="xl:col-span-7 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <History size={14} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Activity Timeline</h3>
          </div>
          <LeadTimeline
            leadId={leadId}
            leadEmail={lead?.email || ""}
            leadName={`${lead?.firstName} ${lead?.lastName}`}
          />
        </div>
      </div>
    </Container>
  );
};

export default LeadDetailPage;
