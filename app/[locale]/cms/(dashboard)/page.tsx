import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CheckCircle2 } from "lucide-react";
import Changelog from "./components/Changelog";
import DashboardGrid from "./components/DashboardGrid";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

export default async function CMSDashboardPage() {
  const session = await getServerSession(authOptions);



  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session?.user?.name?.split(" ")[0] || "Admin"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your website content from here.
        </p>
      </div>

      {/* Status Banner */}
      <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span className="text-sm text-emerald-700 dark:text-emerald-300">
          CMS is live and connected to your website.
        </span>
      </div>

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
        <div className="pt-4 border-t border-gray-200 dark:border-white/5">
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
}
