const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--- INSPECTING TEAMS ---");
  try {
    const teams = await prisma.team.findMany({
        select: { id: true, name: true, team_type: true, parent_id: true }
    });
    console.log(JSON.stringify(teams, null, 2));
  } catch (e) {
    console.error(e);
  }
}

main()
  .finally(async () => await prisma.$disconnect());
