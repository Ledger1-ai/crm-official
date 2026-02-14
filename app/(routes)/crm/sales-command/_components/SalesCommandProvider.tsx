"use client";

import React, { createContext, useContext, useState } from "react";
import { UnifiedSalesData } from "@/actions/crm/get-unified-sales-data";
import { UserSpecificSalesData } from "@/actions/crm/get-user-sales-data";

type ViewMode = "personal" | "team" | "leads";

interface SalesCommandContextType {
    data: UnifiedSalesData;
    leads: any[]; // Type as any for now to match LeadsView flexibility or import specific type
    crmData: any;
    boards: any[];
    tasks: any[];
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    isManager: boolean;
    selectedUserId: string | null;
    selectedUserData: UserSpecificSalesData | null;
    handleUserSelect: (userId: string | null) => Promise<void>;
    isMember: boolean;
}

const SalesCommandContext = createContext<SalesCommandContextType | undefined>(undefined);

interface SalesCommandProviderProps {
    children: React.ReactNode;
    initialData: UnifiedSalesData;
    initialLeads?: any[];
    initialCrmData?: any;
    initialBoards?: any[];
    initialTasks?: any[];
    defaultViewMode?: ViewMode;
    isMember?: boolean;
}

export function SalesCommandProvider({
    children,
    initialData,
    initialLeads = [],
    initialCrmData = {},
    initialBoards = [],
    initialTasks = [],
    defaultViewMode = "team",
    isMember = false,
}: SalesCommandProviderProps) {
    // If member, force default view to personal
    const effectiveDefaultView = isMember ? "personal" : defaultViewMode;
    const [viewMode, setViewMode] = useState<ViewMode>(effectiveDefaultView);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUserData, setSelectedUserData] = useState<UserSpecificSalesData | null>(null);

    // Simple heuristic for manager role based on initial data (can be refined)
    const isManager = initialData.meta.isGlobalAdmin;

    const handleUserSelect = async (userId: string | null) => {
        if (!userId) {
            setSelectedUserId(null);
            setSelectedUserData(null);
            return;
        }

        // Check if we already have this user's data (if it's ME)
        if (userId === initialData.meta.userId) {
            setSelectedUserId(userId);
            setSelectedUserData({
                pipeline: initialData.userData.myPipeline,
                rank: initialData.userData.myRank,
                score: initialData.userData.myScore,
                meta: { userId: initialData.meta.userId, userName: "Me" }
            });
            setViewMode("personal");
            return;
        }

        // Fetch external user data
        const { getUserSalesData } = await import("@/actions/crm/get-user-sales-data");
        try {
            const data = await getUserSalesData(userId);
            if (data) {
                setSelectedUserData(data);
                setSelectedUserId(userId);
                setViewMode("personal");
            }
        } catch (error) {
            console.error("Failed to fetch user data", error);
        }
    };

    return (
        <SalesCommandContext.Provider
            value={{
                data: initialData,
                leads: initialLeads,
                crmData: initialCrmData,
                boards: initialBoards,
                tasks: initialTasks,
                viewMode,
                setViewMode,
                isManager,
                selectedUserId,
                selectedUserData,
                handleUserSelect,
                isMember
            }}
        >
            {children}
        </SalesCommandContext.Provider >
    );
}

export function useSalesCommand() {
    const context = useContext(SalesCommandContext);
    if (context === undefined) {
        throw new Error("useSalesCommand must be used within a SalesCommandProvider");
    }
    return context;
}
