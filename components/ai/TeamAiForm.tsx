"use client";

import { AiProvider, AiModel } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateTeamAiConfig } from "@/actions/ai/update-team-config";
import { useState, useMemo, useTransition } from "react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Bot, Sparkles, Key, Settings2 } from "lucide-react";

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
    providersWithSystemKey: AiProvider[];
}

export const TeamAiForm = ({
    teamId,
    initialConfig,
    activeModels,
    enabledProviders,
    providersWithSystemKey
}: TeamAiFormProps) => {
    const [isPending, startTransition] = useTransition();

    const [selectedProvider, setSelectedProvider] = useState<AiProvider>(
        initialConfig?.provider || AiProvider.OPENAI
    );

    const [useSystemKey, setUseSystemKey] = useState<boolean>(initialConfig?.useSystemKey ?? true);

    const isSystemKeyAvailable = useMemo(() => {
        return providersWithSystemKey.includes(selectedProvider);
    }, [providersWithSystemKey, selectedProvider]);

    const filteredModels = useMemo(() => {
        return activeModels.filter(m => m.provider === selectedProvider);
    }, [activeModels, selectedProvider]);

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            try {
                formData.append("teamId", teamId);
                await updateTeamAiConfig(formData);
                toast.success("AI Settings saved successfully.");
            } catch (error) {
                console.error(error);
                toast.error("Failed to save settings.");
            }
        });
    };

    const providers = enabledProviders.length > 0 ? enabledProviders : Object.values(AiProvider);

    return (
        <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="teamId" value={teamId} />

            {/* Horizontal Row for Provider + Model + Auth */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Provider Selection */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <Label>AI Provider</Label>
                    </div>
                    <Select
                        name="provider"
                        value={selectedProvider}
                        onValueChange={(val) => setSelectedProvider(val as AiProvider)}
                        disabled={isPending}
                    >
                        <SelectTrigger className="bg-background/50 border-border/50 h-10">
                            <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {providers.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Settings2 className="w-4 h-4 text-primary" />
                        <Label>Model Version</Label>
                    </div>
                    <Select
                        name="modelId"
                        defaultValue={selectedProvider === initialConfig?.provider ? (initialConfig?.modelId || "default") : "default"}
                        disabled={isPending}
                    >
                        <SelectTrigger className="bg-background/50 border-border/50 h-10">
                            <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Provider Default</SelectItem>
                            {filteredModels.map(m => (
                                <SelectItem key={m.id} value={m.modelId}>
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Authentication */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Key className="w-4 h-4 text-primary" />
                        <Label>API Key</Label>
                    </div>
                    <RadioGroup
                        name="useSystemKey"
                        value={useSystemKey ? "system" : "own"}
                        onValueChange={(val) => setUseSystemKey(val === "system")}
                        disabled={isPending}
                        className="flex gap-3"
                    >
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                            useSystemKey ? "bg-primary/10 border-primary/30" : "bg-background/50 border-border/50",
                            !isSystemKeyAvailable && "opacity-50 cursor-not-allowed"
                        )}>
                            <RadioGroupItem value="system" id="sys" disabled={!isSystemKeyAvailable} />
                            <Label htmlFor="sys" className="text-xs cursor-pointer">Managed</Label>
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                            !useSystemKey ? "bg-primary/10 border-primary/30" : "bg-background/50 border-border/50"
                        )}>
                            <RadioGroupItem value="own" id="own" />
                            <Label htmlFor="own" className="text-xs cursor-pointer">Personal</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>

            {/* Personal API Key Input (if selected) */}
            {!useSystemKey && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <div className="relative">
                        <Input
                            name="apiKey"
                            type="password"
                            placeholder={`Enter your ${selectedProvider} API Key`}
                            defaultValue={initialConfig?.apiKey || ""}
                            disabled={isPending}
                            className="bg-background/50 border-border/50 pl-10 h-10"
                        />
                        <Key className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={isPending}
                    size="sm"
                    className="min-w-[120px]"
                >
                    {isPending ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
};
