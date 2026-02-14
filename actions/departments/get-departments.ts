"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildUserContext } from "@/lib/department-permissions";

export interface Department {
    id: string;
    name: string;
    slug: string;
    team_type: string;
    parent_id: string | null;
    created_at: Date;
    members: Array<{
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
        team_role: string | null;
        department_id: string | null;
    }>;
    _count: {
        members: number;
    };
}

export interface GetDepartmentsResult {
    success: boolean;
    departments?: Department[];
    error?: string;
}

/**
 * Get all departments for the user's organization
 * All team members can view departments (visibility not restricted)
 */
export async function getDepartments(): Promise<GetDepartmentsResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            include: { assigned_team: true },
        });

        if (!user?.team_id) {
            return { success: false, departments: [] };
        }

        // Get the organization ID (if user is in a department, use parent_id)
        const orgId = user.assigned_team?.team_type === "ORGANIZATION"
            ? user.team_id
            : user.assigned_team?.parent_id;

        if (!orgId) {
            return { success: false, error: "Organization not found" };
        }

        const departments = await prismadb.team.findMany({
            where: {
                parent_id: orgId,
                team_type: "DEPARTMENT",
            },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        team_role: true,
                        department_id: true,
                    },
                },
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { name: "asc" },
        });

        return {
            success: true,
            departments: departments as Department[],
        };
    } catch (error) {
        console.error("Error fetching departments:", error);
        return { success: false, error: "Failed to fetch departments" };
    }
}

/**
 * Get a single department by ID
 */
export async function getDepartment(departmentId: string): Promise<{ success: boolean; department?: Department; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
        });

        if (!user?.team_id) {
            return { success: false, error: "User is not part of a team" };
        }

        const department = await prismadb.team.findFirst({
            where: {
                id: departmentId,
                team_type: "DEPARTMENT",
                parent_id: user.team_id,
            },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        team_role: true,
                        department_id: true,
                    },
                },
                _count: {
                    select: { members: true },
                },
            },
        });

        if (!department) {
            return { success: false, error: "Department not found" };
        }

        return {
            success: true,
            department: department as Department,
        };
    } catch (error) {
        console.error("Error fetching department:", error);
        return { success: false, error: "Failed to fetch department" };
    }
}

/**
 * Get members grouped by department
 */
export async function getMembersByDepartment(): Promise<{
    success: boolean;
    unassigned: Array<{ id: string; name: string | null; email: string; team_role: string | null }>;
    departments: Array<{
        id: string;
        name: string;
        members: Array<{ id: string; name: string | null; email: string; team_role: string | null }>;
    }>;
    error?: string;
}> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, unassigned: [], departments: [], error: "Unauthorized" };
    }

    try {

        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            include: { assigned_team: true },
        });

        if (!user?.team_id) {
            return { success: false, unassigned: [], departments: [], error: "User is not part of a team" };
        }

        const orgId = user.assigned_team?.team_type === "ORGANIZATION"
            ? user.team_id
            : user.assigned_team?.parent_id;

        if (!orgId) {
            return { success: false, unassigned: [], departments: [], error: "Organization not found" };
        }

        // Get all members of the organization
        const members = await prismadb.users.findMany({
            where: { team_id: orgId },
            select: {
                id: true,
                name: true,
                email: true,
                team_role: true,
                department_id: true,
            },
        });

        // Get all departments
        const departments = await prismadb.team.findMany({
            where: {
                parent_id: orgId,
                team_type: "DEPARTMENT",
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: "asc" },
        });

        // Group members by department
        const unassigned = members.filter(m => !m.department_id);
        const deptMap = new Map<string, typeof members>();

        for (const dept of departments) {
            deptMap.set(dept.id, []);
        }

        for (const member of members) {
            if (member.department_id && deptMap.has(member.department_id)) {
                deptMap.get(member.department_id)!.push(member);
            }
        }

        return {
            success: true,
            unassigned,
            departments: departments.map(dept => ({
                id: dept.id,
                name: dept.name,
                members: deptMap.get(dept.id) || [],
            })),
        };
    } catch (error) {
        console.error("Error fetching members by department:", error);
        return { success: false, unassigned: [], departments: [], error: "Failed to fetch data" };
    }
}
