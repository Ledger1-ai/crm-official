import { NextResponse } from 'next/server';
import { prismadb } from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET() {
    try {
        // Fetch all activities (or last 2 weeks as per policy, but usually export implies full history or at least the view)
        // User said "store in a csv file for record", likely implying archiving. 
        // I will fetch everything older than 2 weeks to "archive" it? 
        // Or just export the current view? 
        // "log history should go back 2-weeks then store in a csv file for record" implies:
        // Shows 2 weeks in UI. Export allows getting the records.
        // Let's export ALL records so they can "store" them.

        const activities = await prismadb.systemActivity.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Generate CSV content
        const headers = ['ID', 'Date', 'Action', 'Resource', 'User Name', 'User Email', 'Details'];
        const rows = activities.map(activity => [
            activity.id,
            format(activity.createdAt, 'yyyy-MM-dd HH:mm:ss'),
            activity.action,
            activity.resource,
            activity.user.name || 'Unknown',
            activity.user.email,
            activity.details || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv"`
            }
        });

    } catch (error) {
        console.error("[ACTIVITY_EXPORT_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
