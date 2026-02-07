const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
    const prisma = new PrismaClient();

    console.log('Fetching teams and their admins...');
    const teams = await prisma.team.findMany({
        include: {
            members: {
                where: {
                    OR: [
                        { team_role: 'SUPER_ADMIN' },
                        { team_role: 'ADMIN' },
                        { is_admin: true },
                        { is_account_admin: true }
                    ]
                },
                select: {
                    email: true,
                    name: true,
                    team_role: true,
                    is_admin: true
                }
            }
        }
    });

    console.log(JSON.stringify(teams, null, 2));

    await prisma.$disconnect();
}

main().catch(console.error);
