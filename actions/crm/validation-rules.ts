"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================================
// VALIDATION RULE CRUD
// ============================================================================

export async function getValidationRules(teamId: string, objectType?: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const where: { team_id: string; object_type?: string } = { team_id: teamId };
        if (objectType) where.object_type = objectType;

        // Ensure teamId is a valid ObjectId string for MongoDB
        if (!teamId || teamId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(teamId)) {
            console.warn("[ValidationRules] Invalid teamId provided:", teamId);
            return [];
        }

        const rules = await prismadb.validationRule.findMany({
            where,
            orderBy: [{ object_type: 'asc' }, { order: 'asc' }],
            include: {
                creator: { select: { id: true, name: true, avatar: true } },
            },
        });

        return rules;
    } catch (error) {
        console.error("Error fetching validation rules:", error);
        return [];
    }
}

export async function getValidationRule(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const rule = await prismadb.validationRule.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, name: true, avatar: true } },
            },
        });

        return rule;
    } catch (error) {
        console.error("Error fetching validation rule:", error);
        return null;
    }
}

interface CreateValidationRuleData {
    name: string;
    description?: string;
    object_type: string;
    formula: string;
    error_message: string;
    trigger_on?: string;
    is_active?: boolean;
    order?: number;
    team_id: string;
}

export async function createValidationRule(data: CreateValidationRuleData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const rule = await prismadb.validationRule.create({
            data: {
                name: data.name,
                description: data.description,
                object_type: data.object_type,
                formula: data.formula,
                error_message: data.error_message,
                trigger_on: data.trigger_on || "SAVE",
                is_active: data.is_active ?? true,
                order: data.order ?? 0,
                team_id: data.team_id,
                createdBy: session.user.id,
            },
        });

        revalidatePath('/crm/validation-rules');
        return { success: true, rule };
    } catch (error) {
        console.error("Error creating validation rule:", error);
        return { success: false, error: "Failed to create validation rule" };
    }
}

interface UpdateValidationRuleData {
    name?: string;
    description?: string;
    object_type?: string;
    formula?: string;
    error_message?: string;
    trigger_on?: string;
    is_active?: boolean;
    order?: number;
}

export async function updateValidationRule(id: string, data: UpdateValidationRuleData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const rule = await prismadb.validationRule.update({
            where: { id },
            data,
        });

        revalidatePath('/crm/validation-rules');
        return { success: true, rule };
    } catch (error) {
        console.error("Error updating validation rule:", error);
        return { success: false, error: "Failed to update validation rule" };
    }
}

export async function deleteValidationRule(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        await prismadb.validationRule.delete({ where: { id } });

        revalidatePath('/crm/validation-rules');
        return { success: true };
    } catch (error) {
        console.error("Error deleting validation rule:", error);
        return { success: false, error: "Failed to delete validation rule" };
    }
}

export async function toggleValidationRule(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const existing = await prismadb.validationRule.findUnique({ where: { id } });
        if (!existing) return { success: false, error: "Rule not found" };

        const rule = await prismadb.validationRule.update({
            where: { id },
            data: { is_active: !existing.is_active },
        });

        revalidatePath('/crm/validation-rules');
        return { success: true, rule };
    } catch (error) {
        console.error("Error toggling validation rule:", error);
        return { success: false, error: "Failed to toggle validation rule" };
    }
}
