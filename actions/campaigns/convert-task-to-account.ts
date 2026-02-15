"use server";

import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function convertTaskToAccount(taskId: string) {
    const session = await getServerSession(authOptions);

    if (!session) {
        throw new Error("Unauthenticated");
    }

    const userId = session.user.id;

    try {
        // 1. Fetch Task Details
        const task = await prismadb.tasks.findUnique({
            where: { id: taskId },
        });

        if (!task) {
            throw new Error("Task not found");
        }

        // 2. Check if Account with same name exists to avoid simple duplicates
        const existingAccount = await prismadb.crm_Accounts.findFirst({
            where: {
                name: task.title,
            },
        });

        if (existingAccount) {
            return {
                success: false,
                message: "Account with this name already exists",
                accountId: existingAccount.id,
            };
        }

        // 3. Create new Account
        const newAccount = await prismadb.crm_Accounts.create({
            data: {
                name: task.title,
                description: task.content || "",
                status: "Active",
                type: "Customer",
                createdBy: userId,
                updatedBy: userId,
                // Optional: Assign to same user if they are a valid CRM user
                assigned_to: task.user || userId,
                v: 0,
            },
        });

        // 4. (Optional) We could update the task to note it was converted, 
        // but the schema doesn't have a specific field for it on Tasks.
        // We could add a comment system note if needed, but for now we'll keep it simple.

        revalidatePath(`/campaigns/tasks/viewtask/${taskId}`);
        revalidatePath("/crm/accounts");

        return {
            success: true,
            message: "Account created successfully",
            accountId: newAccount.id,
        };

    } catch (error) {
        console.log("[CONVERT_TASK_TO_ACCOUNT]", error);
        return {
            success: false,
            message: "Failed to create account",
        };
    }
}
