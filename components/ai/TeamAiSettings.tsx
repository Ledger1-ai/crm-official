"use client";

import { useState, useEffect } from "react";
import { AiProvider, AiModel, TeamAiConfig } from "@prisma/client";
import { TeamAiForm } from "./TeamAiForm";

interface TeamAiSettingsProps {
    teamId: string;
}

export const TeamAiSettings = ({ teamId }: TeamAiSettingsProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [teamConfig, setTeamConfig] = useState<TeamAiConfig | null>(null);
    const [activeModels, setActiveModels] = useState<AiModel[]>([]);
    const [enabledProviders, setEnabledProviders] = useState<AiProvider[]>([]);
    const [providersWithSystemKey, setProvidersWithSystemKey] = useState<AiProvider[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/teams/${teamId}/ai-config/data`);
                if (res.ok) {
                    const data = await res.json();
                    setTeamConfig(data.teamConfig);
                    setActiveModels(data.activeModels);
                    setEnabledProviders(data.enabledProviders);
                    setProvidersWithSystemKey(data.providersWithSystemKey);
                }
            } catch (error) {
                console.error("Failed to fetch AI settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [teamId]);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-muted rounded w-full" />
                <div className="grid grid-cols-3 gap-4">
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                </div>
            </div>
        );
    }

    return (
        <TeamAiForm
            teamId={teamId}
            initialConfig={teamConfig}
            activeModels={activeModels}
            enabledProviders={enabledProviders}
            providersWithSystemKey={providersWithSystemKey}
        />
    );
};
