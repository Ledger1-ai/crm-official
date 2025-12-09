
"use client";

import { AiProvider, AiModel } from "@prisma/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateTeamAiConfig } from "@/actions/ai/update-team-config";
import { useState, useMemo, useTransition } from "react";
import { toast } from "react-hot-toast";

interface TeamAiFormProps {
    teamId: string;
    initialConfig: {
        provider: AiProvider;
        modelId: string | null;
        useSystemKey: boolean;
        apiKey: string | null;
    } | null;
    activeModels: AiModel[];
    enabledProviders: AiProvider[];
}

export const TeamAiForm = ({ teamId, initialConfig, activeModels, enabledProviders }: TeamAiFormProps) => {
    const [isPending, startTransition] = useTransition();

    // State to track current provider selection for filtering
    const [selectedProvider, setSelectedProvider] = useState<AiProvider>(
        initialConfig?.provider || AiProvider.OPENAI
    );

    const [useSystemKey, setUseSystemKey] = useState<boolean>(initialConfig?.useSystemKey ?? true);

    // Filter models based on selected provider
    const filteredModels = useMemo(() => {
        return activeModels.filter(m => m.provider === selectedProvider);
    }, [activeModels, selectedProvider]);

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            try {
                // Ensure teamId is included
                formData.append("teamId", teamId);
                await updateTeamAiConfig(formData);
                toast.success("Settings saved successfully.");
            } catch (error) {
                console.error(error);
                toast.error("Failed to save settings.");
            }
        });
    };

    // Use enabledProviders passed from parent instead of all providers
    const providers = enabledProviders.length > 0 ? enabledProviders : Object.values(AiProvider);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Team AI Settings</CardTitle>
                <CardDescription>Configure AI preferences for your team.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    {/* Hidden input for teamId just in case, though we append manually */}
                    <input type="hidden" name="teamId" value={teamId} />

                    <div className="space-y-2">
                        <Label>Preferred AI Provider</Label>
                        <Select
                            name="provider"
                            value={selectedProvider}
                            onValueChange={(val) => setSelectedProvider(val as AiProvider)}
                            disabled={isPending}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Provider" />
                            </SelectTrigger>
                            <SelectContent>
                                {providers.map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">Select the default AI provider for your team&apos;s features.</p>
                        {!providers.includes(selectedProvider) && (
                            <p className="text-xs text-red-500">
                                Warning: The currently selected provider is disabled by the platform administrator. Please select a different provider.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Preferred Model</Label>
                        <Select
                            name="modelId"
                            defaultValue={selectedProvider === initialConfig?.provider ? (initialConfig?.modelId || "default") : "default"}
                            disabled={isPending}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Model (or Default)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Provider Default</SelectItem>
                                {filteredModels.map(m => (
                                    // Use unique key combining provider and id to be safe, though id should be unique
                                    <SelectItem key={m.id} value={m.modelId}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">Override the specific model version to use.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>API Key Source</Label>
                        <RadioGroup
                            name="useSystemKey"
                            value={useSystemKey ? "system" : "own"}
                            onValueChange={(val) => setUseSystemKey(val === "system")}
                            disabled={isPending}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="system" id="r-system" />
                                <Label htmlFor="r-system">Use System/Platform Key (Managed)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="own" id="r-own" />
                                <Label htmlFor="r-own">Use My Own API Key</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {!useSystemKey && (
                        <div className="space-y-2">
                            <Label>Personal API Key</Label>
                            <Input
                                name="apiKey"
                                type="password"
                                placeholder="Enter your API Key"
                                defaultValue={initialConfig?.apiKey || ""}
                                disabled={isPending}
                            />
                            <p className="text-xs text-muted-foreground">Required for "Use My Own API Key".</p>
                        </div>
                    )}

                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
