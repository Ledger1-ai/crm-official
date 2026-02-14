
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBasalt() {
    const slug = 'basalthq';
    const team = await prisma.team.findFirst({
        where: { slug: { equals: slug, mode: 'insensitive' } }
    });

    if (!team) {
        console.log('BasaltHQ team not found');
        return;
    }

    console.log(`Fixing subscription for team: ${team.name} (${team.id})`);

    await prisma.crm_Subscriptions.updateMany({
        where: { tenant_id: team.id },
        data: {
            plan_name: 'PLATFORM_ADMIN',
            amount: 0,
            status: 'ACTIVE',
            last_charge_status: 'SYSTEM_FREE_TIER',
            // Set a far future date to avoid confusion
            next_billing_date: new Date('2099-12-31T00:00:00Z'),
            interval: 'annual'
        }
    });

    console.log('✅ Updated BasaltHQ subscription to free tier/platform admin.');
}

fixBasalt()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
