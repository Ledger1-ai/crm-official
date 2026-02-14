
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
    const slug = 'basalthq'; // Try lowercase first
    const team = await prisma.team.findUnique({
        where: { slug: slug },
        include: {
            team_subscriptions: true
        }
    });

    if (!team) {
        console.log(`Team '${slug}' not found. Trying 'BasaltHQ'...`);
        const team2 = await prisma.team.findFirst({
            where: { slug: { equals: 'BasaltHQ', mode: 'insensitive' } },
            include: { team_subscriptions: true }
        });
        if (team2) {
            console.log(`Found team: ${team2.name} (slug: ${team2.slug})`);
            console.log('Subscription:', team2.team_subscriptions[0]);
        } else {
            console.log('Team not found.');
        }
    } else {
        console.log(`Found team: ${team.name} (slug: ${team.slug})`);
        console.log('Subscription:', team.team_subscriptions[0]);
    }
}

inspect()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
