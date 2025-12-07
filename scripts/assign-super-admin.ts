
import { prismadb } from "../lib/prisma";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error("Please provide an email address as the first argument.");
        process.exit(1);
    }

    try {
        const user = await prismadb.users.findUnique({
            where: { email },
            include: { assigned_team: true }
        });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.email})`);
        console.log(`Current Team: ${user.assigned_team?.slug || "None"}`);
        console.log(`Current Role: ${user.team_role || "None"}`);

        // Check if internal team exists
        const internalTeam = await prismadb.team.findUnique({
            where: { slug: "ledger1" }
        });

        if (!internalTeam) {
            console.error("Internal team not found. Please run seed-team first.");
            process.exit(1);
        }

        // Assign to internal team and set role to SUPER_ADMIN
        const updated = await prismadb.users.update({
            where: { email },
            data: {
                team_id: internalTeam.id,
                team_role: "SUPER_ADMIN"
            }
        });

        console.log("-----------------------------------");
        console.log("SUCCESS! User updated:");
        console.log(`Team: Internal (${internalTeam.id})`);
        console.log(`Role: ${updated.team_role}`);
        console.log("-----------------------------------");

    } catch (e) {
        console.error("Error updating user:", e);
    }
}

main();
