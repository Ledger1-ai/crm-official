import { PipelineFunnel } from "./PipelineFunnel";
import { getTeamAnalytics } from "@/actions/dashboard/get-team-analytics";

// Server component that fetches team pipeline analytics without blocking the initial page render
export default async function TeamPipelineSection() {
  const teamAnalytics = await getTeamAnalytics();

  const teamPipelineData = [
    { name: "Identify", value: teamAnalytics.team.stageCounts.Identify, color: "slate" },
    { name: "Engage_AI", value: teamAnalytics.team.stageCounts.Engage_AI, color: "cyan" },
    { name: "Engage_Human", value: teamAnalytics.team.stageCounts.Engage_Human, color: "blue" },
    { name: "Offering", value: teamAnalytics.team.stageCounts.Offering, color: "violet" },
    { name: "Finalizing", value: teamAnalytics.team.stageCounts.Finalizing, color: "amber" },
    { name: "Closed", value: teamAnalytics.team.stageCounts.Closed, color: "emerald" },
  ];

  return (
    <PipelineFunnel
      title="Team Pipeline"
      subtitle="Organization-wide funnel"
      data={teamPipelineData}
      className="h-full"
    />
  );
}
