"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, Save, X } from "lucide-react";
import { useDashboardLayout } from "../_context/DashboardLayoutContext";
import { WidgetGallery } from "./widgets/WidgetGallery";

interface EditDashboardButtonProps {
    availableEntities?: any[];
}

export const EditDashboardButton = ({ availableEntities = [] }: EditDashboardButtonProps) => {
    const { isEditMode, setEditMode, saveLayout, isLoading } = useDashboardLayout();

    if (isEditMode) {
        return (
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(false)}
                    className="text-muted-foreground hover:text-white"
                >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                </Button>
                <WidgetGallery availableEntities={availableEntities} />
                <Button
                    variant="default"
                    size="sm"
                    onClick={saveLayout}
                    disabled={isLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Saving..." : "Save Layout"}
                </Button>
            </div>
        );
    }

    return (
        <div
            onClick={() => setEditMode(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all cursor-pointer border border-transparent hover:border-white/5"
            title="Edit Dashboard Layout"
        >
            <Settings className="w-4 h-4" />
        </div>
    );
};
