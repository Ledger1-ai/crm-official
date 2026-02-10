"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const getCase = async (caseId: string) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    try {
        const caseData = await (prismadb as any).crm_Cases.findUnique({
            where: { id: caseId },
            include: {
                contact: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        mobile_phone: true,
                        office_phone: true,
                    },
                },
                account: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                assigned_user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                sla_policy: true,
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
                status_transitions: {
                    include: {
                        changed_by_user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
                milestone_instances: {
                    include: {
                        milestone: true,
                    },
                    orderBy: { target_date: "asc" },
                },
                parent_case: {
                    select: {
                        id: true,
                        case_number: true,
                        subject: true,
                    },
                },
                child_cases: {
                    select: {
                        id: true,
                        case_number: true,
                        subject: true,
                        status: true,
                        priority: true,
                    },
                },
            },
        });

        return caseData;
    } catch (error) {
        console.error("[GET_CASE]", error);
        return null;
    }
};
