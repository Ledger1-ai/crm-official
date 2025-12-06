"use server";

import { prismadb } from "@/lib/prisma";
import { format, subDays } from "date-fns";

export async function getAnalyticsStats() {
    try {
        const now = new Date();
        const thirtyDaysAgo = subDays(now, 30);

        // 1. Total Visitors (Unique Users by ipHash)
        // @ts-ignore
        const uniqueVisitors = await prismadb.pageView.groupBy({
            by: ['ipHash'],
            _count: {
                _all: true
            },
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        });
        const totalVisitors = uniqueVisitors.length;

        // 2. Page Views
        // @ts-ignore
        const totalPageViews = await prismadb.pageView.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        });

        // 3. Traffic Trends (Group by Date)
        // Prisma doesn't support complex date grouping natively in Mongo yet easily, 
        // fetching all relevant PageViews and aggregating in JS for flexibility
        // Efficient enough for < 100k records.
        // @ts-ignore
        const views = await prismadb.pageView.findMany({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                createdAt: true,
                ipHash: true
            }
        });

        // Aggregate by day
        const dailyStats = new Map<string, { visitors: Set<string>, pageViews: number }>();

        // Initialize last 30 days
        for (let i = 0; i < 30; i++) {
            const dateStr = format(subDays(now, i), 'MMM dd');
            dailyStats.set(dateStr, { visitors: new Set(), pageViews: 0 });
        }

        views.forEach((view: { createdAt: Date, ipHash: string | null }) => {
            const dateStr = format(view.createdAt, 'MMM dd');
            if (dailyStats.has(dateStr)) {
                const stat = dailyStats.get(dateStr)!;
                stat.pageViews++;
                if (view.ipHash) stat.visitors.add(view.ipHash);
            }
        });

        const chartdata = Array.from(dailyStats.entries()).map(([date, stats]) => ({
            date,
            "Visitors": stats.visitors.size,
            "Page Views": stats.pageViews
        })).reverse();


        // 4. Top Pages
        // @ts-ignore
        const topPagesRaw = await prismadb.pageView.groupBy({
            by: ['path'],
            _count: {
                _all: true
            },
            orderBy: {
                _count: {
                    path: 'desc'
                }
            },
            take: 10
        });

        const topPages = topPagesRaw.map((p: { path: string, _count: { _all: number } }) => ({
            name: p.path,
            value: p._count._all
        }));


        // 5. Active Now (Last 5 minutes)
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        // @ts-ignore
        const activeUsersRaw = await prismadb.pageView.groupBy({
            by: ['ipHash'],
            where: {
                createdAt: {
                    gte: fiveMinutesAgo
                }
            }
        });
        const activeUsersCount = activeUsersRaw.length;

        // 6. Top Cities
        // @ts-ignore
        const topCitiesRaw = await prismadb.pageView.groupBy({
            by: ['city'],
            _count: {
                _all: true
            },
            orderBy: {
                _count: {
                    city: 'desc'
                }
            },
            where: {
                city: {
                    not: null
                }
            },
            take: 5
        });

        const cities = topCitiesRaw.map((c: { city: string | null, _count: { _all: number } }) => ({
            name: c.city || 'Unknown',
            value: c._count._all
        }));

        // KPI Data
        const kpiData = [
            {
                title: "Total Visitors (30d)",
                metric: totalVisitors.toLocaleString(),
                metricPrev: "---",
                delta: totalVisitors > 0 ? "+100%" : "0%",
                deltaType: "increase",
            },
            {
                title: "Page Views (30d)",
                metric: totalPageViews.toLocaleString(),
                metricPrev: "---",
                delta: totalPageViews > 0 ? "+100%" : "0%",
                deltaType: "increase",
            },
            {
                title: "Active Now",
                metric: activeUsersCount.toString(),
                metricPrev: "Live",
                delta: "Online",
                deltaType: "moderateIncrease",
            },
        ];

        // @ts-ignore
        return {
            chartdata,
            topPages,
            kpiData,
            cities
        };

    } catch (error) {
        console.error("Analytics Error", error);
        return null;
    }
}
