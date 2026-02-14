import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CheckCircle2 } from "lucide-react";
import Changelog from "./components/Changelog";
import DashboardGrid from "./components/DashboardGrid";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import DashboardHeader from "./components/DashboardHeader";

export default async function CMSDashboardPage() {
  const session = await getServerSession(authOptions);



  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <DashboardHeader userName={session?.user?.name?.split(" ")[0] || "Admin"} />

      {/* Status Banner removed (moved to sidebar) */}

      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row gap-8 items-stretch h-auto lg:h-[600px]">
          {/* Content Grid - Takes available width */}
          <div className="flex-1 h-full">
            <DashboardGrid />
          </div>

          {/* Activity Log - Side Panel - Matches height of grid explicitly */}
          <div className="w-full lg:w-96 flex flex-col h-full">
            <Changelog />
          </div>
        </div>

        {/* Analytics Section */}
        <div className="pt-4 border-t border-white/5">
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
}
