"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { saveDashboardLayout } from "../_actions/save-dashboard-layout";

export type WidgetItem = {
    id: string;
    isVisible: boolean;
};

interface DashboardLayoutContextType {
    widgets: WidgetItem[];
    isEditMode: boolean;
    setEditMode: (mode: boolean) => void;
    updateLayout: (widgets: WidgetItem[]) => void;
    toggleWidgetVisibility: (id: string, isVisible: boolean) => void;
    saveLayout: () => Promise<void>;
    isLoading: boolean;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

export const useDashboardLayout = () => {
    const context = useContext(DashboardLayoutContext);
    if (!context) {
        throw new Error("useDashboardLayout must be used within a DashboardLayoutProvider");
    }
    return context;
};

export const defaultWidgets: WidgetItem[] = [
    // First Row: Stats & Schedule (Small Widgets)
    { id: "revenue", isVisible: true },
    { id: "active_pipeline", isVisible: true },
    { id: "system_health", isVisible: true },
    { id: "my_schedule", isVisible: true },

    { id: "divider-1", isVisible: true },

    // Second Row: Comprehensive Entity Grid (Full Width)
    { id: "crm_entities_grid", isVisible: true },

    // Middle/Bottom Sections: Lists & Detailed Data
    { id: "leads", isVisible: true },
    { id: "tasks", isVisible: true },
    { id: "projects", isVisible: true },
    { id: "messages", isVisible: true },

    { id: "divider-3", isVisible: true },

    // Pipelines (Large Widgets)
    { id: "personal_pipeline", isVisible: true },
    { id: "team_pipeline", isVisible: true },

    // Hidden by Default - Operations & Analytics
    { id: "active_users", isVisible: true },
    { id: "team_activity", isVisible: false },
    { id: "recent_files", isVisible: false },
    { id: "revenue_pacing", isVisible: false },
    { id: "outreach_roi", isVisible: true },
    { id: "lead_pools", isVisible: true },
    { id: "lead_wizard", isVisible: true },
    { id: "ai_insights", isVisible: true },

    // Additional Specialized Stats
    { id: "conversion_rate", isVisible: true },
    { id: "avg_deal_size", isVisible: true },
    { id: "response_time", isVisible: true },
    { id: "system_uptime", isVisible: false },

    // Entity Widgets (Small Buttons section)
    { id: "entity:accounts", isVisible: true },
    { id: "entity:contacts", isVisible: true },
    { id: "entity:contracts", isVisible: true },
    { id: "entity:dialer", isVisible: true },
    { id: "entity:leads_manager", isVisible: true },
    { id: "entity:projects", isVisible: true },
    { id: "entity:opportunities", isVisible: true },
    { id: "entity:sales_command", isVisible: true },
    { id: "entity:service_console", isVisible: true },
    { id: "entity:guard_rules", isVisible: true },
    { id: "entity:approval_chains", isVisible: true },
    { id: "entity:flowstate_builder", isVisible: true },
    { id: "entity:lead_wizard", isVisible: true },
    { id: "entity:lead_pools", isVisible: true },
    { id: "entity:outreach", isVisible: true },
    { id: "entity:my_tasks", isVisible: true },
    { id: "entity:invoices", isVisible: true },
    { id: "entity:reports", isVisible: true },
    { id: "entity:products", isVisible: true },
    { id: "entity:quotes", isVisible: true },
];

interface DashboardLayoutProviderProps {
    children: React.ReactNode;
    initialLayout?: WidgetItem[]; // From DB
}

export const DashboardLayoutProvider = ({
    children,
    initialLayout,
}: DashboardLayoutProviderProps) => {
    const [widgets, setWidgets] = useState<WidgetItem[]>(initialLayout || defaultWidgets);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Update local state when initialLayout changes (if it comes from a server action/fetch)
    useEffect(() => {
        if (initialLayout && initialLayout.length > 0) {
            // Merge: Keep user reordering/visibility for existing widgets,
            // but add any new widgets that exist in defaultWidgets but not in initialLayout
            // First, filter out old/redundant dividers from user layout
            const cleanedLayout = initialLayout.filter(w => w.id !== "divider" && w.id !== "divider-2");
            const merged = [...cleanedLayout];

            defaultWidgets.forEach(defaultW => {
                if (!merged.find(w => w.id === defaultW.id)) {
                    merged.push(defaultW);
                }
            });

            setWidgets(merged);
        }
    }, [initialLayout]);

    const updateLayout = (newWidgets: WidgetItem[]) => {
        setWidgets(newWidgets);
    };

    const toggleWidgetVisibility = (id: string, isVisible: boolean) => {
        setWidgets((prev) =>
            prev.map((w) => (w.id === id ? { ...w, isVisible } : w))
        );
    };

    const saveLayout = async () => {
        setIsLoading(true);
        try {
            await saveDashboardLayout(widgets);
            toast.success("Dashboard layout saved");
            setIsEditMode(false);
        } catch (error) {
            toast.error("Failed to save layout");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayoutContext.Provider
            value={{
                widgets,
                isEditMode,
                setEditMode: setIsEditMode,
                updateLayout,
                toggleWidgetVisibility,
                saveLayout,
                isLoading,
            }}
        >
            {children}
        </DashboardLayoutContext.Provider>
    );
};
