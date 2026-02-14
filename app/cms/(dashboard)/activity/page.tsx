
import { prismadb } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, User, Shield, Clock } from "lucide-react";
import { getRecentActivities } from "@/actions/audit";

export const revalidate = 0; // Ensure dynamic data

export default async function CMSActivityPage() {
    const activities = await getRecentActivities(50);
    const totalActivities = await prismadb.systemActivity.count();

    // Calculate activities in last 24h
    const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
    const recentCount = await prismadb.systemActivity.count({
        where: { createdAt: { gte: oneDayAgo } }
    });

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">Activity Log</h1>
                <p className="text-muted-foreground mt-2 text-lg">Track all changes and user actions across the system.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalActivities}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All recorded events
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent (24h)</CardTitle>
                        <Clock className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{recentCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Events in last 24 hours
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Shield className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">Active</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Logging active
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Latest Events</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {activities.length === 0 ? (
                        <div className="p-8 text-center border rounded-lg bg-muted/20">
                            <p className="text-muted-foreground">No activities recorded yet.</p>
                        </div>
                    ) : (
                        activities.map((log) => (
                            <div key={log.id} className="flex items-start justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-shadow hover:border-primary/20">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        {/* @ts-ignore - joined user data */}
                                        {log.user?.avatar ? (

                                            <img src={log.user.avatar} alt="User" className="h-10 w-10 rounded-full object-cover" />
                                        ) : (
                                            <User className="h-5 w-5 text-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-foreground">{log.action}</h4>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                {log.resource}
                                            </span>
                                        </div>
                                        {/* @ts-ignore - joined user data */}
                                        <p className="text-sm text-foreground/80 mt-0.5">
                                            <span className="font-medium text-foreground">{log.user?.name || "Unknown User"}</span> {log.details ? `- ${log.details}` : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground font-mono whitespace-nowrap ml-4">
                                    {new Date(log.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
