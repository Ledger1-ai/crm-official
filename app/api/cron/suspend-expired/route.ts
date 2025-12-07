import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Optional: verification for security if using external cron
            // return new NextResponse("Unauthorized", { status: 401 });
        }

        const now = new Date();
        // Default grace period is 7 days if not set in plan (though we added it to Plan, we might need to join it)
        // For simplicity, we'll fetch teams and check in code or do a complex query.
        // A complex query is better for performance.

        // Find teams that are active/overdue and past their renewal + grace period
        // Since grace_period is on the Plan (relation), we need to check that.

        const teams = await prismadb.team.findMany({
            where: {
                status: {
                    in: ["ACTIVE", "PENDING"]
                },
                renewal_date: {
                    lt: now
                },
                assigned_plan: {
                    isNot: null
                }
            },
            include: {
                assigned_plan: true
            }
        });

        let suspendedCount = 0;

        for (const team of teams) {
            if (!team.renewal_date || !team.assigned_plan) continue;

            const graceDays = team.assigned_plan.grace_period_days || 7;
            const gracePeriodMs = graceDays * 24 * 60 * 60 * 1000;
            const expiryDate = new Date(team.renewal_date.getTime() + gracePeriodMs);

            if (now > expiryDate) {
                // Suspend the team
                await prismadb.team.update({
                    where: { id: team.id },
                    data: {
                        status: "SUSPENDED",
                        suspension_reason: "Payment Overdue (Grace Period Expired)"
                    }
                });
                suspendedCount++;
            }
        }

        return NextResponse.json({ success: true, suspended: suspendedCount });

    } catch (error) {
        console.log("[CRON_SUSPEND]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
