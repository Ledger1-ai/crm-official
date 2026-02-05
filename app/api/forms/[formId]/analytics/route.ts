import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { startOfMonth, subMonths, format, eachDayOfInterval, startOfDay, endOfDay, subDays } from "date-fns";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;

        if (!formId) {
            return new NextResponse("Form ID is required", { status: 400 });
        }

        // Get basic form stats
        const form = await prismadb.form.findUnique({
            where: { id: formId },
            select: { view_count: true, submission_count: true }
        });

        if (!form) {
            return new NextResponse("Form not found", { status: 404 });
        }

        // Calculate conversion rate
        const conversionRate = form.view_count > 0
            ? ((form.submission_count / form.view_count) * 100).toFixed(1)
            : "0.0";

        // Get chart data for the last 30 days
        const endDate = new Date();
        const startDate = subDays(endDate, 30);

        // Fetch views for the last 30 days
        const views = await prismadb.formView.findMany({
            where: {
                form_id: formId,
                viewedAt: { gte: startDate }
            },
            select: { viewedAt: true }
        });

        // Fetch submissions for the last 30 days
        const submissions = await prismadb.formSubmission.findMany({
            where: {
                form_id: formId,
                createdAt: { gte: startDate }
            },
            select: { createdAt: true }
        });

        // Aggregate data by day
        const dailyData = new Map<string, { views: number; submissions: number }>();
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        // Initialize all days
        days.forEach(day => {
            const dateKey = format(day, "MMM dd");
            dailyData.set(dateKey, { views: 0, submissions: 0 });
        });

        // Count views
        views.forEach(view => {
            const dateKey = format(new Date(view.viewedAt), "MMM dd");
            if (dailyData.has(dateKey)) {
                dailyData.get(dateKey)!.views++;
            }
        });

        // Count submissions
        submissions.forEach(sub => {
            const dateKey = format(new Date(sub.createdAt), "MMM dd");
            if (dailyData.has(dateKey)) {
                dailyData.get(dateKey)!.submissions++;
            }
        });

        // Format for chart
        const chartData = Array.from(dailyData.entries()).map(([date, counts]) => ({
            date,
            "Visitors": counts.views,
            "Page Views": counts.views, // Tracking same metric for now as Tremor component uses this key often
            "Submissions": counts.submissions
        }));

        return NextResponse.json({
            kpi: [
                { title: "Total Views", metric: form.view_count, delta: "0", deltaType: "neutral" },
                { title: "Submissions", metric: form.submission_count, delta: "0", deltaType: "neutral" },
                { title: "Conversion Rate", metric: `${conversionRate}%`, delta: "0", deltaType: "neutral" },
            ],
            chartData
        });

    } catch (error) {
        console.error("[FORM_ANALYTICS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
