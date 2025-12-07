import 'dotenv/config';
import { PrismaClient } from "@prisma/client";

const SUBSCRIPTION_PLANS = {
    FREE: {
        name: "Free",
        slug: "FREE",
        features: ["crm", "projects", "documents"],
        limits: {
            max_users: 3,
            max_storage: 1000,
            credits: 100,
        }
    },
    TEAM: {
        name: "Team",
        slug: "TEAM",
        features: ["crm", "projects", "documents", "invoices", "reports", "openai", "emails"],
        limits: {
            max_users: 10,
            max_storage: 10000,
            credits: 5000,
        }
    },
    ENTERPRISE: {
        name: "Enterprise",
        slug: "ENTERPRISE",
        features: ["all"],
        limits: {
            max_users: 9999,
            max_storage: 100000,
            credits: 50000,
        }
    }
};

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Plan migration...");

    // 1. Seed Plans
    for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
        const existingPlan = await prisma.plan.findUnique({
            where: { slug: key },
        });

        if (!existingPlan) {
            console.log(`Creating plan: ${plan.name}`);
            await prisma.plan.create({
                data: {
                    name: plan.name,
                    slug: key,
                    features: plan.features,
                    // Map limits
                    max_users: plan.limits.max_users,
                    max_storage: plan.limits.max_storage,
                    max_credits: plan.limits.credits,
                    price: 0, // Default to 0, needs manual update later if needed
                    isActive: true,
                },
            });
        } else {
            console.log(`Plan ${plan.name} already exists. Updating details...`);
            await prisma.plan.update({
                where: { id: existingPlan.id },
                data: {
                    name: plan.name,
                    features: plan.features,
                    max_users: plan.limits.max_users,
                    max_storage: plan.limits.max_storage,
                    max_credits: plan.limits.credits,
                }
            })
        }
    }

    // 2. Migrate Teams
    console.log("Migrating Teams...");
    const teams = await prisma.team.findMany({
        where: {
            OR: [
                { plan_id: null },
                { plan_id: { isSet: false } }
            ]
        }
    });

    for (const team of teams) {
        // Get slug from enum value
        const planSlug = team.subscription_plan || "FREE";

        const plan = await prisma.plan.findUnique({
            where: { slug: planSlug }
        });

        if (plan) {
            console.log(`Assigning plan ${plan.name} to team ${team.name}`);
            await prisma.team.update({
                where: { id: team.id },
                data: { plan_id: plan.id }
            });
        } else {
            console.warn(`Could not find plan for slug: ${planSlug} for team ${team.name}`);
        }
    }

    console.log("Migration complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
