
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Ensure only internal team admins can manage plans
async function checkAuth() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Unauthorized" };

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        include: { assigned_team: true }
    }) as any;

    const isGlobalAdmin = user?.assigned_team?.slug === "ledger1" && user.team_role === "SUPER_ADMIN";
    const isBoss = user?.assigned_team?.slug === "ledger1" && user.team_role === "OWNER";

    // Also allow legacy global admin flag for now, or just stick to new roles
    const isAdmin = user?.is_admin || isGlobalAdmin || isBoss;

    if (!isAdmin) return { error: "Forbidden" };

    return { success: true };
}

export async function createPlan(data: any) {
    const auth = await checkAuth();
    if (auth.error) return auth;

    try {
        await prismadb.plan.create({
            data: {
                name: data.name,
                slug: data.slug.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, ''),
                price: data.price,
                currency: data.currency,
                max_users: data.max_users,
                max_storage: data.max_storage,
                max_credits: data.max_credits,
                features: data.features,
                isActive: data.isActive,
            }
        });
        revalidatePath("/partners/plans");
        return { success: "Plan created" };
    } catch (error) {
        console.error("Create Plan Error:", error);
        return { error: "Failed to create plan" };
    }
}

export async function updatePlan(id: string, data: any) {
    const auth = await checkAuth();
    if (auth.error) return auth;

    try {
        await prismadb.plan.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, ''),
                price: data.price,
                currency: data.currency,
                max_users: data.max_users,
                max_storage: data.max_storage,
                max_credits: data.max_credits,
                features: data.features,
                isActive: data.isActive,
            }
        });
        revalidatePath("/partners/plans");
        return { success: "Plan updated" };
    } catch (error) {
        console.error("Update Plan Error:", error);
        return { error: "Failed to update plan" };
    }
}

export async function deletePlan(id: string) {
    const auth = await checkAuth();
    if (auth.error) return auth;

    try {
        // Check if used
        const used = await prismadb.team.findFirst({
            where: { plan_id: id }
        });

        if (used) {
            return { error: "Cannot delete plan: It is assigned to one or more teams." };
        }

        await prismadb.plan.delete({
            where: { id }
        });
        revalidatePath("/partners/plans");
        return { success: "Plan deleted" };
    } catch (error) {
        console.error("Delete Plan Error:", error);
        return { error: "Failed to delete plan" };
    }
}

export async function getPlans() {
    // Public read for now (or auth check if sensitive)
    const plans = await prismadb.plan.findMany({
        orderBy: { price: 'asc' }
    });
    return plans;
}
