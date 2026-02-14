import { getAnalyticsStats } from "@/actions/analytics/get-stats";
import AnalyticsCharts from "./AnalyticsCharts";

export default async function AnalyticsDashboard() {
    const stats = await getAnalyticsStats();

    if (!stats) {
        return (
            <div className="p-6 text-center text-gray-500">
                Failed to load analytics data.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold brand-gradient-text">Analytics Overview</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Real-Time Traffic Performance</p>
            </div>

            <AnalyticsCharts
                chartdata={stats.chartdata}
                topPages={stats.topPages}
                kpiData={stats.kpiData}
                cities={stats.cities}
            />
        </div>
    );
}
