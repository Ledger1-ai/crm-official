const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
    const prisma = new PrismaClient();
    const email = 'dal@crecoin.co';

    console.log(`Searching for user: ${email}`);
    const user = await prisma.users.findUnique({
        where: { email },
        include: {
            assigned_role: true,
            assigned_team: true,
            custom_role: true
        }
    });

    if (user) {
        console.log('User found:');
        console.log(JSON.stringify(user, null, 2));
    } else {
        console.log('User not found.');
    }

    await prisma.$disconnect();
}

main().catch(console.error);
