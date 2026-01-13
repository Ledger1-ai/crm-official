import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const targetEmail = "sysadm@basalthq.com";

    const password = process.env.ADMIN_PASSWORD;

    const targetUser = await prisma.users.findUnique({
        where: { email: targetEmail },
    });

    if (targetUser) {
        console.log(`User ${targetEmail} already exists. Ensuring admin privileges...`);
        const updateData: any = { is_admin: true };

        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
            console.log("Updating password from environment variable.");
        } else {
            console.log("No ADMIN_PASSWORD provided. Preserving existing password.");
        }

        await prisma.users.update({
            where: { email: targetEmail },
            data: updateData,
        });
    } else {
        console.log("Creating new admin user...");
        if (!password) {
            throw new Error("ADMIN_PASSWORD must be set in environment variables to create a new admin user.");
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        await prisma.users.create({
            data: {
                email: targetEmail,
                name: "System Admin",
                password: hashedPassword,
                is_admin: true,
                userStatus: "ACTIVE",
            },
        });
    }

    console.log("Admin user seeded/updated successfully.");
    console.log("Email: " + targetEmail);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
