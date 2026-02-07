const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
    const prisma = new PrismaClient();

    console.log('Fetching roles...');
    const roles = await prisma.role.findMany();

    console.log(JSON.stringify(roles, null, 2));

    await prisma.$disconnect();
}

main().catch(console.error);
