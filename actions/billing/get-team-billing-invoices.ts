"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Get billing invoices for a specific team.
 * Used by platform admins on /partners to view any team's invoices.
 */
export async function getTeamBillingInvoices(teamId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        // diverse-safety-check: ensure the model exists on the runtime client (handling dev-mode stale client)
        if (!(prismadb as any).crm_BillingInvoice) {
            console.warn("Prisma Client is stale. crm_BillingInvoice model not found. Please restart the server.");
            return [];
        }

        const invoices = await (prismadb as any).crm_BillingInvoice.findMany({
            where: { tenant_id: teamId },
            include: {
                subscription: {
                    select: {
                        plan_name: true,
                        interval: true,
                        customer_wallet: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return invoices;
    } catch (error) {
        console.error("[GET_TEAM_BILLING_INVOICES]", error);
        return [];
    }
}

/**
 * Get billing invoices for the current user's team.
 * Used by team admins on /admin billing tab.
 */
export async function getMyTeamBillingInvoices() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true }
        });

        if (!user?.team_id) return [];

        // diverse-safety-check: ensure the model exists on the runtime client (handling dev-mode stale client)
        if (!(prismadb as any).crm_BillingInvoice) {
            console.warn("Prisma Client is stale. crm_BillingInvoice model not found. Please restart the server.");
            return [];
        }

        const invoices = await (prismadb as any).crm_BillingInvoice.findMany({
            where: { tenant_id: user.team_id },
            include: {
                subscription: {
                    select: {
                        plan_name: true,
                        interval: true,
                        customer_wallet: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return invoices;
    } catch (error) {
        console.error("[GET_MY_TEAM_BILLING_INVOICES]", error);
        return [];
    }
}

/**
 * Get all billing invoices across all teams.
 * Used by platform admins on /partners billing history.
 */
export async function getAllBillingInvoices() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        // diverse-safety-check: ensure the model exists on the runtime client (handling dev-mode stale client)
        if (!(prismadb as any).crm_BillingInvoice) {
            console.warn("Prisma Client is stale. crm_BillingInvoice model not found. Please restart the server.");
            return [];
        }

        const invoices = await (prismadb as any).crm_BillingInvoice.findMany({
            include: {
                team: {
                    select: {
                        name: true,
                        slug: true,
                    }
                },
                subscription: {
                    select: {
                        plan_name: true,
                        interval: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return invoices;
    } catch (error) {
        console.error("[GET_ALL_BILLING_INVOICES]", error);
        return [];
    }
}
