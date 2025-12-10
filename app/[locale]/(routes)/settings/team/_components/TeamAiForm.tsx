
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

export const TeamAiForm = ({ teamId, initialConfig, activeModels, enabledProviders, providersWithSystemKey }: TeamAiFormProps) => {
    const [isPending, startTransition] = useTransition();

    // State to track current provider selection for filtering
    const [selectedProvider, setSelectedProvider] = useState<AiProvider>(
        initialConfig?.provider || AiProvider.OPENAI
    );

    const [useSystemKey, setUseSystemKey] = useState<boolean>(initialConfig?.useSystemKey ?? true);

    // Compute if system key is available for currently selected provider
    const isSystemKeyAvailable = useMemo(() => {
        return providersWithSystemKey.includes(selectedProvider);
    }, [providersWithSystemKey, selectedProvider]);

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
        <div className="w-full max-w-4xl mx-auto p-1 sm:p-4 overflow-hidden">
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/40 backdrop-blur-xl shadow-xl max-w-full">
                {/* Glass Header */}
                <div className="relative px-6 py-8 border-b border-border/50 bg-background/20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-50" />
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.15)]">
                            <Bot className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Team AI Settings</h2>
                            <p className="text-muted-foreground mt-1">Configure the intelligence engine for your team.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <form action={handleSubmit} className="space-y-8">
                        {/* Hidden input for teamId */}
                        <input type="hidden" name="teamId" value={teamId} />

                        <div className="grid gap-8 md:grid-cols-2">
                            {/* Provider Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <Label className="text-base">AI Provider</Label>
                                </div>
                                <div className="bg-background/30 p-4 rounded-xl border border-border/50">
                                    <Select
                                        name="provider"
                                        value={selectedProvider}
                                        onValueChange={(val) => setSelectedProvider(val as AiProvider)}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger className="bg-background/50 border-border/50 focus:ring-primary/20 h-11">
                                            <SelectValue placeholder="Select Provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {providers.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                                        Select the underlying AI technology that powers your team's features.
                                    </p>
                                    {!providers.includes(selectedProvider) && (
                                        <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                                            Warning: This provider is currently disabled by the administrator.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Model Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <Settings2 className="w-4 h-4 text-primary" />
                                    <Label className="text-base">Model Version</Label>
                                </div>
                                <div className="bg-background/30 p-4 rounded-xl border border-border/50">
                                    <Select
                                        name="modelId"
                                        defaultValue={selectedProvider === initialConfig?.provider ? (initialConfig?.modelId || "default") : "default"}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger className="bg-background/50 border-border/50 focus:ring-primary/20 h-11">
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
                                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                                        Choose a specific model version for specialized performance or cost optimization.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* API Key Section */}
                        <div className="space-y-4 pt-4 border-t border-border/30">
                            <div className="flex items-center gap-2 text-foreground font-medium">
                                <Key className="w-4 h-4 text-primary" />
                                <Label className="text-base">Authentication</Label>
                            </div>

                            <div className="bg-background/30 p-6 rounded-xl border border-border/50 space-y-6">
                                <RadioGroup
                                    name="useSystemKey"
                                    value={useSystemKey ? "system" : "own"}
                                    onValueChange={(val) => setUseSystemKey(val === "system")}
                                    disabled={isPending}
                                    className="grid gap-4 sm:grid-cols-2"
                                >
                                    <div className={cn(
                                        "flex items-start space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-background/50",
                                        useSystemKey ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "bg-transparent border-border/50",
                                        !isSystemKeyAvailable && "opacity-60 cursor-not-allowed"
                                    )}>
                                        <RadioGroupItem value="system" id="r-system" disabled={!isSystemKeyAvailable} className="mt-1" />
                                        <div className="space-y-1">
                                            <Label htmlFor="r-system" className={cn("font-medium cursor-pointer", !isSystemKeyAvailable && "cursor-not-allowed")}>
                                                Managed System Key
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Use the platform's shared API key.
                                                {!isSystemKeyAvailable && <span className="text-destructive block mt-1">(Not Available for {selectedProvider})</span>}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex items-start space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-background/50",
                                        !useSystemKey ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" : "bg-transparent border-border/50"
                                    )}>
                                        <RadioGroupItem value="own" id="r-own" className="mt-1" />
                                        <div className="space-y-1">
                                            <Label htmlFor="r-own" className="font-medium cursor-pointer">Personal API Key</Label>
                                            <p className="text-xs text-muted-foreground">Use your own organization's key.</p>
                                        </div>
                                    </div>
                                </RadioGroup>

                                {!useSystemKey && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="relative">
                                            <Input
                                                name="apiKey"
                                                type="password"
                                                placeholder={`Enter your ${selectedProvider} API Key`}
                                                defaultValue={initialConfig?.apiKey || ""}
                                                disabled={isPending}
                                                className="bg-background/50 border-border/50 focus:ring-primary/20 pl-10 h-11"
                                            />
                                            <Key className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="min-w-[140px] h-11 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                            >
                                {isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
