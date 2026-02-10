"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ApprovalProcessStatus, ApprovalRequestStatus, ApprovalAction, Prisma } from "@prisma/client";

// ============================================================================
// APPROVAL PROCESS CRUD
// ============================================================================

export async function getApprovalProcesses(teamId: string, objectType?: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const where: { team_id: string; object_type?: string } = { team_id: teamId };
        if (objectType) where.object_type = objectType;

        const processes = await prismadb.approvalProcess.findMany({
            where,
            orderBy: [{ object_type: 'asc' }, { order: 'asc' }],
            include: {
                creator: { select: { id: true, name: true, avatar: true } },
                steps: { orderBy: { step_number: 'asc' } },
                _count: { select: { requests: true } },
            },
        });

        return processes;
    } catch (error) {
        console.error("Error fetching approval processes:", error);
        return [];
    }
}

export async function getApprovalProcess(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const process = await prismadb.approvalProcess.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, name: true, avatar: true } },
                steps: {
                    orderBy: { step_number: 'asc' },
                    include: {
                        approver_user: { select: { id: true, name: true, avatar: true } },
                    },
                },
                requests: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        submitter: { select: { id: true, name: true, avatar: true } },
                        actions: {
                            include: {
                                actor: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        });

        return process;
    } catch (error) {
        console.error("Error fetching approval process:", error);
        return null;
    }
}

interface CreateApprovalProcessData {
    name: string;
    description?: string;
    object_type: string;
    entry_criteria?: string;
    final_approval_actions?: Prisma.InputJsonValue;
    final_rejection_actions?: Prisma.InputJsonValue;
    allow_recall?: boolean;
    lock_record?: boolean;
    order?: number;
    team_id: string;
    steps: {
        step_number: number;
        name: string;
        approver_type: string;
        approver_user_id?: string;
        approver_role?: string;
        approval_mode?: string;
        auto_escalate_hours?: number;
    }[];
}

export async function createApprovalProcess(data: CreateApprovalProcessData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const process = await prismadb.approvalProcess.create({
            data: {
                name: data.name,
                description: data.description,
                object_type: data.object_type,
                entry_criteria: data.entry_criteria,
                final_approval_actions: data.final_approval_actions ?? null,
                final_rejection_actions: data.final_rejection_actions ?? null,
                allow_recall: data.allow_recall ?? true,
                lock_record: data.lock_record ?? true,
                order: data.order ?? 0,
                team_id: data.team_id,
                createdBy: session.user.id,
                status: ApprovalProcessStatus.DRAFT,
                steps: {
                    create: data.steps.map(step => ({
                        step_number: step.step_number,
                        name: step.name,
                        approver_type: step.approver_type,
                        approver_user_id: step.approver_user_id || undefined,
                        approver_role: step.approver_role || undefined,
                        approval_mode: step.approval_mode || "FIRST_RESPONSE",
                        auto_escalate_hours: step.auto_escalate_hours,
                    })),
                },
            },
            include: { steps: true },
        });

        revalidatePath('/crm/approvals');
        return { success: true, process };
    } catch (error) {
        console.error("Error creating approval process:", error);
        return { success: false, error: "Failed to create approval process" };
    }
}

export async function updateApprovalProcessStatus(id: string, status: ApprovalProcessStatus) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const process = await prismadb.approvalProcess.update({
            where: { id },
            data: { status },
        });

        revalidatePath('/crm/approvals');
        return { success: true, process };
    } catch (error) {
        console.error("Error updating approval process status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function deleteApprovalProcess(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        // Delete steps, then request actions, then requests, then process
        await prismadb.approvalRequestAction.deleteMany({
            where: { request: { process_id: id } },
        });
        await prismadb.approvalRequest.deleteMany({
            where: { process_id: id },
        });
        await prismadb.approvalStep.deleteMany({
            where: { process_id: id },
        });
        await prismadb.approvalProcess.delete({ where: { id } });

        revalidatePath('/crm/approvals');
        return { success: true };
    } catch (error) {
        console.error("Error deleting approval process:", error);
        return { success: false, error: "Failed to delete approval process" };
    }
}

// ============================================================================
// APPROVAL REQUEST OPERATIONS
// ============================================================================

/**
 * Submit a record for approval.
 * Finds the matching approval process and creates a request.
 */
export async function submitForApproval(data: {
    record_id: string;
    record_type: string;
    team_id: string;
    comment?: string;
    record_snapshot?: Prisma.InputJsonValue;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        // Find active approval process for this object type
        const process = await prismadb.approvalProcess.findFirst({
            where: {
                team_id: data.team_id,
                object_type: data.record_type,
                status: ApprovalProcessStatus.ACTIVE,
            },
            include: {
                steps: { orderBy: { step_number: 'asc' } },
            },
            orderBy: { order: 'asc' },
        });

        if (!process) {
            return { success: false, error: "No active approval process found for this record type" };
        }

        if (process.steps.length === 0) {
            return { success: false, error: "Approval process has no steps configured" };
        }

        // Check entry criteria if defined
        if (process.entry_criteria) {
            const { evaluateFormula } = await import("@/lib/validation-engine");
            const recordData = data.record_snapshot as Record<string, unknown> ?? {};
            const meetsCriteria = evaluateFormula(process.entry_criteria, recordData);
            if (!meetsCriteria) {
                return { success: false, error: "Record does not meet approval criteria" };
            }
        }

        // Check if already pending
        const existing = await prismadb.approvalRequest.findFirst({
            where: {
                record_id: data.record_id,
                record_type: data.record_type,
                status: ApprovalRequestStatus.PENDING,
            },
        });

        if (existing) {
            return { success: false, error: "This record already has a pending approval request" };
        }

        const request = await prismadb.approvalRequest.create({
            data: {
                process_id: process.id,
                record_id: data.record_id,
                record_type: data.record_type,
                submitted_by: session.user.id,
                submit_comment: data.comment,
                record_snapshot: data.record_snapshot ?? null,
                status: ApprovalRequestStatus.PENDING,
                current_step: 1,
                team_id: data.team_id,
            },
        });

        revalidatePath('/crm/approvals');
        return { success: true, request };
    } catch (error) {
        console.error("Error submitting for approval:", error);
        return { success: false, error: "Failed to submit for approval" };
    }
}

/**
 * Process an approval action (approve/reject/recall/reassign)
 */
export async function processApprovalAction(data: {
    request_id: string;
    action: ApprovalAction;
    comment?: string;
    reassign_to?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const request = await prismadb.approvalRequest.findUnique({
            where: { id: data.request_id },
            include: {
                process: {
                    include: {
                        steps: { orderBy: { step_number: 'asc' } },
                    },
                },
            },
        });

        if (!request) {
            return { success: false, error: "Approval request not found" };
        }

        if (request.status !== ApprovalRequestStatus.PENDING) {
            return { success: false, error: "This request is no longer pending" };
        }

        // Find current step
        const currentStep = request.process.steps.find(
            (s: { step_number: number }) => s.step_number === request.current_step
        );
        if (!currentStep) {
            return { success: false, error: "Current approval step not found" };
        }

        // Record the action
        await prismadb.approvalRequestAction.create({
            data: {
                request_id: request.id,
                step_id: currentStep.id,
                actor_id: session.user.id,
                action: data.action,
                comment: data.comment,
                reassigned_to: data.reassign_to,
            },
        });

        // Process the action
        if (data.action === ApprovalAction.APPROVE) {
            // Check if there's a next step
            const nextStep = request.process.steps.find(
                (s: { step_number: number }) => s.step_number === request.current_step + 1
            );

            if (nextStep) {
                // Move to next step
                await prismadb.approvalRequest.update({
                    where: { id: request.id },
                    data: { current_step: nextStep.step_number },
                });
            } else {
                // Final approval — mark as approved
                await prismadb.approvalRequest.update({
                    where: { id: request.id },
                    data: {
                        status: ApprovalRequestStatus.APPROVED,
                        completedAt: new Date(),
                    },
                });

                // Execute final approval actions (if any)
                // TODO: Apply field updates from final_approval_actions
            }
        } else if (data.action === ApprovalAction.REJECT) {
            await prismadb.approvalRequest.update({
                where: { id: request.id },
                data: {
                    status: ApprovalRequestStatus.REJECTED,
                    completedAt: new Date(),
                },
            });

            // Execute final rejection actions (if any)
            // TODO: Apply field updates from final_rejection_actions
        } else if (data.action === ApprovalAction.RECALL) {
            if (!request.process.allow_recall) {
                return { success: false, error: "Recall is not allowed for this process" };
            }
            await prismadb.approvalRequest.update({
                where: { id: request.id },
                data: {
                    status: ApprovalRequestStatus.RECALLED,
                    completedAt: new Date(),
                },
            });
        }

        revalidatePath('/crm/approvals');
        return { success: true };
    } catch (error) {
        console.error("Error processing approval action:", error);
        return { success: false, error: "Failed to process approval action" };
    }
}

/**
 * Get pending approval requests for the current user
 */
export async function getMyPendingApprovals(teamId?: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const where: Prisma.ApprovalRequestWhereInput = {
            status: ApprovalRequestStatus.PENDING,
        };

        if (teamId) {
            where.team_id = teamId;
        }

        // Get all pending requests where the current user is the approver at the current step
        const requests = await prismadb.approvalRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                process: {
                    include: {
                        steps: {
                            orderBy: { step_number: 'asc' },
                            include: {
                                approver_user: { select: { id: true, name: true, avatar: true } },
                            },
                        },
                    },
                },
                submitter: { select: { id: true, name: true, avatar: true } },
                actions: {
                    include: {
                        actor: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        // Filter to only requests where user is the current step approver
        const myRequests = requests.filter((req: any) => {
            const currentStep = req.process.steps.find((s: { step_number: number }) => s.step_number === req.current_step);
            if (!currentStep) return false;
            if (currentStep.approver_type === 'SPECIFIC_USER') {
                return currentStep.approver_user_id === session.user?.id;
            }
            if (currentStep.approver_type === 'ROLE') {
                // Match against user's team_role
                return true; // simplified — in production, check user's role
            }
            return false;
        });

        return myRequests;
    } catch (error) {
        console.error("Error fetching pending approvals:", error);
        return [];
    }
}

/**
 * Get all approval requests for a specific record
 */
export async function getRecordApprovals(recordId: string, recordType: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) throw new Error("Unauthorized");

        const requests = await prismadb.approvalRequest.findMany({
            where: {
                record_id: recordId,
                record_type: recordType,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                process: { select: { name: true } },
                submitter: { select: { id: true, name: true, avatar: true } },
                actions: {
                    include: {
                        actor: { select: { id: true, name: true } },
                        step: { select: { name: true, step_number: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        return requests;
    } catch (error) {
        console.error("Error fetching record approvals:", error);
        return [];
    }
}
