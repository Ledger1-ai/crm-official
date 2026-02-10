import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const startDate = new Date('2025-11-01T00:00:00.000Z');

  console.log("Checking for teams created since:", startDate.toISOString());
  console.log("Excluding: ledger1, basalt, basalthq, internal");

  const teams = await prisma.team.findMany({
    where: {
      created_at: {
        gte: startDate,
      },
      NOT: [
        { slug: { contains: 'ledger1', mode: 'insensitive' } },
        { slug: { contains: 'basalt', mode: 'insensitive' } },
        { slug: { contains: 'internal', mode: 'insensitive' } }
      ]
    },
    include: {
      members: {
        select: {
          email: true,
          name: true,
          team_role: true,
        }
      },
      assigned_plan: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });

  console.log(`Found ${teams.length} RELEVANT teams.`);

  teams.forEach(team => {
    console.log("--------------------------------------------------");
    console.log(`Team: ${team.name} (Slug: ${team.slug})`);
    console.log(`ID: ${team.id}`);
    console.log(`Created At: ${team.created_at}`);
    console.log(`Status: ${team.status}`);
    console.log(`Plan: ${team.assigned_plan?.name || "None"}`);
    console.log(`Parent ID: ${team.parent_id}`);
    console.log(`Members: ${team.members.length}`);
    if (team.members.length > 0) {
      team.members.forEach(m => console.log(` - ${m.name} (${m.email}) [${m.team_role}]`));
    }

    // Check if it would be visible in /partners
    const isVisible = !team.parent_id;
    console.log(`Visible in /partners?: ${isVisible ? "YES" : "NO (Has Parent ID)"}`);
  });

  console.log("--------------------------------------------------");
  console.log("Checking for users created since Nov 1, 2025 (excluding known internal/test accounts)...");

  const users = await prisma.users.findMany({
    where: {
      created_on: {
        gte: startDate
      },
      NOT: [
        { email: { contains: 'ledger1', mode: 'insensitive' } },
        { email: { contains: 'basalt', mode: 'insensitive' } },
        { email: 'mmfmilton@icloud.com' }
      ]
    },
    include: {
      assigned_team: true
    }
  });

  console.log(`Found ${users.length} RELEVANT users.`);
  users.forEach(u => {
    console.log(`User: ${u.email} (Name: ${u.name})`);
    console.log(`Created: ${u.created_on}`);
    console.log(`Assigned Team: ${u.assigned_team?.name || "NONE"} (Slug: ${u.assigned_team?.slug})`);
    console.log(`Team ID: ${u.team_id}`);
    console.log("---");
  });

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
