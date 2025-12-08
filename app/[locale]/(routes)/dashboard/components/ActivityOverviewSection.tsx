import { QuickStats } from "./RadialProgress";
import { getLeadsStageCounts } from "@/actions/dashboard/get-leads-stage-counts";

interface Props {
  userId: string;
  opportunities: number;
  tasks: number;
  usersTasks: number;
}

// Server component that fetches per-user lead stage summary for the Activity Overview card
export default async function ActivityOverviewSection({ userId, opportunities, tasks, usersTasks }: Props) {
  const leadsStageSummary = await getLeadsStageCounts(userId);

  return (
    <QuickStats
      title="Activity Overview"
      stats={[
        {
          value: usersTasks,
          max: tasks || 1,
          label: "My Tasks",
          sublabel: "Assigned to me",
          color: "cyan",
        },
        {
          value: leadsStageSummary.overall.counts.byStage.Closed,
          max: leadsStageSummary.overall.counts.total || 1,
          label: "Closed",
          sublabel: "Converted leads",
          color: "emerald",
        },
        {
          value: opportunities,
          max: leadsStageSummary.overall.counts.total || 1,
          label: "Opportunities",
          sublabel: "Active deals",
          color: "violet",
        },
      ]}
    />
  );
}
