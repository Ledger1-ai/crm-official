
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.users.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            team_id: true,
            assigned_team: {
                select: {
                    name: true,
                    slug: true
                }
            }
        }
    });

    console.log(`Total Users Found: ${users.length}`);
    console.log('--------------------------------------------------');
    users.forEach(u => {
        const teamName = u.assigned_team ? `${u.assigned_team.name} (${u.assigned_team.slug})` : 'NONE';
        console.log(`${u.email} (${u.name}) - Team: ${teamName} [${u.team_id}]`);
    });
    console.log('--------------------------------------------------');

    const teamCounts = {};
    users.forEach(u => {
        const teamName = u.assigned_team ? u.assigned_team.name : 'Unassigned';
        teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
    });
    console.log('Counts per Team:', teamCounts);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
