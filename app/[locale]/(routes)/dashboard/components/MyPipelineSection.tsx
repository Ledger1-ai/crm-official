import { PipelineFunnel } from "./PipelineFunnel";
import { getLeadsStageCounts } from "@/actions/dashboard/get-leads-stage-counts";

interface Props {
  userId: string;
}

// Server component that fetches user's pipeline analytics without blocking the initial page render
export default async function MyPipelineSection({ userId }: Props) {
  const leadsStageSummary = await getLeadsStageCounts(userId);

  const myPipelineData = [
    { name: "Identify", value: leadsStageSummary.overall.counts.byStage.Identify, color: "slate" },
    { name: "Engage_AI", value: leadsStageSummary.overall.counts.byStage.Engage_AI, color: "cyan" },
    { name: "Engage_Human", value: leadsStageSummary.overall.counts.byStage.Engage_Human, color: "blue" },
    { name: "Offering", value: leadsStageSummary.overall.counts.byStage.Offering, color: "violet" },
    { name: "Finalizing", value: leadsStageSummary.overall.counts.byStage.Finalizing, color: "amber" },
    { name: "Closed", value: leadsStageSummary.overall.counts.byStage.Closed, color: "emerald" },
  ];

  return (
    <PipelineFunnel
      title="My Pipeline"
      subtitle="Your personal sales funnel"
      data={myPipelineData}
      className="h-full"
    />
  );
}
