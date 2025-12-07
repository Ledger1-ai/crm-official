
import { prismadb } from "../lib/prisma";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const teams = await prismadb.team.findMany();
    console.log(JSON.stringify(teams, null, 2));
}

main();
