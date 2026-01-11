"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AiProvider, AiModel, TeamAiConfig } from "@prisma/client";
import { toast } from "sonner";
import {
    Bot,
    Sparkles,
    Key,
    Check,
    Zap,
    DollarSign,
    ExternalLink,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface AiSettingsViewProps {
    teamId: string;
    currentConfig: TeamAiConfig | null;
    models: AiModel[];
    providersWithSystemKey: AiProvider[];
}

// Provider metadata for beautiful cards - matches actual AiProvider enum
const PROVIDER_META: Record<AiProvider, { name: string; color: string; gradient: string; icon: string; url: string }> = {
    OPENAI: {
        name: "OpenAI",
        color: "text-emerald-400",
        gradient: "from-emerald-500/20 to-green-500/20",
        icon: "🤖",
        url: "https://platform.openai.com/api-keys",
    },
    ANTHROPIC: {
        name: "Anthropic",
        color: "text-amber-400",
        gradient: "from-amber-500/20 to-orange-500/20",
        icon: "🧠",
        url: "https://console.anthropic.com/settings/keys",
    },
    AZURE: {
        name: "Azure OpenAI",
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-cyan-500/20",
        icon: "☁️",
        url: "https://portal.azure.com/",
    },
    GOOGLE: {
        name: "Google AI",
        color: "text-violet-400",
        gradient: "from-violet-500/20 to-purple-500/20",
        icon: "✨",
        url: "https://aistudio.google.com/apikey",
    },
    GROK: {
        name: "xAI Grok",
        color: "text-pink-400",
        gradient: "from-pink-500/20 to-rose-500/20",
        icon: "🚀",
        url: "https://console.x.ai/",
    },
    DEEPSEEK: {
        name: "DeepSeek",
        color: "text-teal-400",
        gradient: "from-teal-500/20 to-cyan-500/20",
        icon: "🔍",
        url: "https://platform.deepseek.com/",
    },
    PERPLEXITY: {
        name: "Perplexity",
        color: "text-indigo-400",
        gradient: "from-indigo-500/20 to-blue-500/20",
        icon: "🔮",
        url: "https://docs.perplexity.ai/",
    },
    MISTRAL: {
        name: "Mistral AI",
        color: "text-orange-400",
        gradient: "from-orange-500/20 to-red-500/20",
        icon: "💨",
        url: "https://console.mistral.ai/api-keys",
    },
};

export default function AiSettingsView({
    teamId,
    currentConfig,
    models,
    providersWithSystemKey,
}: AiSettingsViewProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Group models by provider
    const modelsByProvider = useMemo(() => {
        const grouped: Partial<Record<AiProvider, AiModel[]>> = {};
        models.forEach((model) => {
            if (!grouped[model.provider]) {
                grouped[model.provider] = [];
            }
            grouped[model.provider]!.push(model);
        });
        return grouped;
    }, [models]);

    // State
    const [selectedModelId, setSelectedModelId] = useState<string | null>(
        currentConfig?.modelId || null
    );
    const [selectedProvider, setSelectedProvider] = useState<AiProvider>(
        currentConfig?.provider || AiProvider.OPENAI
    );
    const [useSystemKey, setUseSystemKey] = useState(
        currentConfig?.useSystemKey ?? true
    );
    const [apiKeys, setApiKeys] = useState<Partial<Record<AiProvider, string>>>({});
    const [expandedProviders, setExpandedProviders] = useState<AiProvider[]>([
        selectedProvider,
    ]);

    const toggleProvider = (provider: AiProvider) => {
        setExpandedProviders((prev) =>
            prev.includes(provider)
                ? prev.filter((p) => p !== provider)
                : [...prev, provider]
        );
    };

    const handleSelectModel = (model: AiModel) => {
        setSelectedModelId(model.modelId);
        setSelectedProvider(model.provider);
    };

    const handleSave = async () => {
        startTransition(async () => {
            try {
                const res = await fetch(`/api/teams/${teamId}/ai-config`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        provider: selectedProvider,
                        modelId: selectedModelId,
                        useSystemKey,
                        apiKey: useSystemKey ? null : apiKeys[selectedProvider],
                    }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to save");
                }

                toast.success("AI Settings saved successfully!");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Failed to save settings");
            }
        });
    };

    const hasSystemKey = (provider: AiProvider) =>
        providersWithSystemKey.includes(provider);

    return (
        <div className="space-y-8">
            {/* Current Selection Summary */}
            {selectedModelId && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                    <div className="p-3 rounded-full bg-primary/20 text-primary">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Currently Selected</p>
                        <p className="text-lg font-semibold">
                            {models.find((m) => m.modelId === selectedModelId)?.name || selectedModelId}
                        </p>
                    </div>
                    <Badge variant="secondary" className={PROVIDER_META[selectedProvider]?.color}>
                        {PROVIDER_META[selectedProvider]?.name}
                    </Badge>
                </div>
            )}

            {/* Provider Sections */}
            {Object.entries(modelsByProvider).map(([provider, providerModels]) => {
                const providerKey = provider as AiProvider;
                const meta = PROVIDER_META[providerKey];
                const isExpanded = expandedProviders.includes(providerKey);
                const hasKey = hasSystemKey(providerKey);
                const activeModel = providerModels?.find((m) => m.modelId === selectedModelId);

                if (!meta || !providerModels) return null;

                return (
                    <Card key={provider} className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                        <CardHeader
                            onClick={() => toggleProvider(providerKey)}
                            className={cn(
                                "cursor-pointer hover:bg-muted/30 transition-colors",
                                isExpanded && "border-b border-border/30"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${meta.gradient} text-2xl`}>
                                        {meta.icon}
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {meta.name}
                                            {activeModel && (
                                                <Badge className="bg-primary/20 text-primary border-primary/30">
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Active
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            {providerModels.length} model{providerModels.length !== 1 ? "s" : ""} available
                                            {hasKey && (
                                                <span className="ml-2 text-emerald-400">• Managed key available</span>
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                            </div>
                        </CardHeader>

                        {isExpanded && (
                            <CardContent className="pt-6 space-y-6">
                                {/* Model Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {providerModels.map((model) => {
                                        const isSelected = selectedModelId === model.modelId;

                                        return (
                                            <div
                                                key={model.id}
                                                onClick={() => handleSelectModel(model)}
                                                className={cn(
                                                    "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                                    isSelected
                                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                        : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-muted/30"
                                                )}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-3 right-3">
                                                        <div className="p-1 rounded-full bg-primary text-primary-foreground">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${meta.gradient} ${meta.color}`}>
                                                            <Sparkles className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-sm truncate">{model.name}</h4>
                                                            <p className="text-xs text-muted-foreground font-mono truncate">
                                                                {model.modelId}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {model.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {model.description}
                                                        </p>
                                                    )}

                                                    {/* Pricing (Read-only) */}
                                                    <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <DollarSign className="w-3 h-3" />
                                                            <span>In: ${model.inputPrice.toFixed(4)}/1K</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Zap className="w-3 h-3" />
                                                            <span>Out: ${model.outputPrice.toFixed(4)}/1K</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* API Key Configuration */}
                                {selectedProvider === providerKey && (
                                    <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Key className="w-4 h-4 text-primary" />
                                                <Label className="font-medium">API Key Configuration</Label>
                                            </div>

                                            {hasKey && (
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="use-managed" className="text-sm text-muted-foreground">
                                                        Use managed key
                                                    </Label>
                                                    <Switch
                                                        id="use-managed"
                                                        checked={useSystemKey}
                                                        onCheckedChange={setUseSystemKey}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {useSystemKey && hasKey ? (
                                            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                <Check className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm text-emerald-400">
                                                    Using platform-managed API key
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <Input
                                                        type="password"
                                                        placeholder={`Enter your ${meta.name} API key`}
                                                        value={apiKeys[providerKey] || ""}
                                                        onChange={(e) =>
                                                            setApiKeys((prev) => ({
                                                                ...prev,
                                                                [provider]: e.target.value,
                                                            }))
                                                        }
                                                        className="pl-10"
                                                    />
                                                    <Key className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                                                </div>
                                                {meta.url && (
                                                    <a
                                                        href={meta.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                    >
                                                        Get your API key
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                );
            })}

            {/* Empty State */}
            {Object.keys(modelsByProvider).length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No AI models are currently available.</p>
                    <p className="text-sm">Contact your platform administrator to enable models.</p>
                </div>
            )}

            {/* Save Button */}
            {Object.keys(modelsByProvider).length > 0 && (
                <div className="flex justify-end sticky bottom-4">
                    <Button
                        onClick={handleSave}
                        disabled={isPending || !selectedModelId}
                        size="lg"
                        className="min-w-[160px] shadow-lg"
                    >
                        {isPending ? (
                            "Saving..."
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
