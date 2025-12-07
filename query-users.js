const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      is_admin: true,
      userStatus: true
    }
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
