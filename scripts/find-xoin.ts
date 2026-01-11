
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Searching EVERYWHERE for 'Xoin'...");

    const opps = await prisma.crm_Opportunities.findMany({ where: { name: { contains: 'Xoin', mode: 'insensitive' } } });
    console.log(`crm_Opportunities: ${opps.length}`);

    const tasks = await prisma.tasks.findMany({ where: { title: { contains: 'Xoin', mode: 'insensitive' } } });
    console.log(`Tasks: ${tasks.length}`);
    if (tasks.length > 0) console.log("Task Example:", tasks[0]);

    const accounts = await prisma.crm_Accounts.findMany({ where: { name: { contains: 'Xoin', mode: 'insensitive' } } });
    console.log(`crm_Accounts: ${accounts.length}`);
    if (accounts.length > 0) console.log("Account Example:", accounts[0]);


    const boards = await prisma.boards.findMany({ where: { title: { contains: 'Xoin', mode: 'insensitive' } } });
    console.log(`Boards: ${boards.length}`);
    if (boards.length > 0) console.log("Board found:", boards[0]);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
