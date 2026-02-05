"use client";

// Force rebuild 1

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
    ChevronDown,
    ChevronUp,
    Settings,
    Shield
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ApiKeyModal } from "@/components/modals/api-key-modal";
import {
    OpenAIIcon,
    AnthropicIcon,
    AzureIcon,
    GoogleIcon,
    GrokIcon,
    DeepSeekIcon,
    PerplexityIcon,
    MistralIcon
} from "@/components/ai/ProviderIcons";

interface AiConfigManagerProps {
    teamId: string;
    currentConfig: TeamAiConfig | null;
    models: AiModel[];
    providersWithSystemKey: AiProvider[];
}

// Provider metadata for beautiful cards
const PROVIDER_META: Record<AiProvider, { name: string; color: string; gradient: string; icon: React.ReactNode; url: string }> = {
    OPENAI: {
        name: "OpenAI",
        color: "text-emerald-400",
        gradient: "from-emerald-500/20 to-green-500/20",
        icon: <OpenAIIcon className="w-8 h-8" />,
        url: "https://platform.openai.com/api-keys",
    },
    ANTHROPIC: {
        name: "Anthropic",
        color: "text-amber-400",
        gradient: "from-amber-500/20 to-orange-500/20",
        icon: <AnthropicIcon className="w-8 h-8" />,
        url: "https://console.anthropic.com/settings/keys",
    },
    AZURE: {
        name: "Azure OpenAI",
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-cyan-500/20",
        icon: <AzureIcon className="w-8 h-8" />,
        url: "https://portal.azure.com/",
    },
    GOOGLE: {
        name: "Google AI",
        color: "text-violet-400",
        gradient: "from-violet-500/20 to-purple-500/20",
        icon: <GoogleIcon className="w-7 h-7" />,
        url: "https://aistudio.google.com/apikey",
    },
    GROK: {
        name: "xAI Grok",
        color: "text-pink-400",
        gradient: "from-pink-500/20 to-rose-500/20",
        icon: <GrokIcon className="w-6 h-6" />,
        url: "https://console.x.ai/",
    },
    DEEPSEEK: {
        name: "DeepSeek",
        color: "text-teal-400",
        gradient: "from-teal-500/20 to-cyan-500/20",
        icon: <DeepSeekIcon className="w-8 h-8" />,
        url: "https://platform.deepseek.com/",
    },
    PERPLEXITY: {
        name: "Perplexity",
        color: "text-indigo-400",
        gradient: "from-indigo-500/20 to-blue-500/20",
        icon: <PerplexityIcon className="w-8 h-8" />,
        url: "https://docs.perplexity.ai/",
    },
    MISTRAL: {
        name: "Mistral AI",
        color: "text-orange-400",
        gradient: "from-orange-500/20 to-red-500/20",
        icon: <MistralIcon className="w-8 h-8" />,
        url: "https://console.mistral.ai/api-keys",
    },
};

export const AiConfigManager = ({
    teamId,
    currentConfig,
    models,
    providersWithSystemKey,
}: AiConfigManagerProps) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalProvider, setModalProvider] = useState<AiProvider | null>(null);

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

    // Form State
    const [selectedModelId, setSelectedModelId] = useState<string | null>(
        currentConfig?.modelId || null
    );
    const [selectedProvider, setSelectedProvider] = useState<AiProvider>(
        currentConfig?.provider || AiProvider.OPENAI
    );
    const [useSystemKey, setUseSystemKey] = useState(
        currentConfig?.useSystemKey ?? true
    );
    // Store keys temporarily before saving
    // If we have a masked key (********), we treat it as existing but don't show it
    const [apiKeys, setApiKeys] = useState<Partial<Record<AiProvider, string>>>(
        currentConfig?.apiKey ? { [currentConfig.provider]: currentConfig.apiKey } : {}
    );

    // Check if key is masked
    const isKeyMasked = (key?: string) => key === "********";

    // UI State
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
        // If we switch providers, default to system key if available
        if (model.provider !== selectedProvider) {
            const hasSysKey = providersWithSystemKey.includes(model.provider);
            setUseSystemKey(hasSysKey);
        }
    };

    const openKeyModal = (provider: AiProvider, e: React.MouseEvent) => {
        e.stopPropagation();
        setModalProvider(provider);
        setModalOpen(true);
    };

    const handleKeySave = (key: string) => {
        if (modalProvider) {
            setApiKeys(prev => ({ ...prev, [modalProvider]: key }));
            setUseSystemKey(false); // Switch to custom key since user just entered one
            setSelectedProvider(modalProvider); // Ensure provider is selected
            toast.success(`API Key for ${PROVIDER_META[modalProvider].name} updated`);
        }
    };

    const hasCustomKey = (provider: AiProvider) => {
        const key = apiKeys[provider];
        return !!key && key.length > 0;
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Current Selection Summary */}
            {selectedModelId && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 backdrop-blur-md shadow-sm">
                    <div className="p-3 rounded-full bg-primary/20 text-primary animate-pulse-glow">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active Configuration</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {models.find((m) => m.modelId === selectedModelId)?.name || selectedModelId}
                            </p>
                            {/* Key Status Indicator */}
                            {useSystemKey ? (
                                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex gap-1">
                                    <Shield className="w-3 h-3" /> Managed
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 flex gap-1">
                                    <Key className="w-3 h-3" /> Custom Key
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Badge variant="secondary" className={cn("px-3 py-1 text-sm font-semibold", PROVIDER_META[selectedProvider]?.color)}>
                        {PROVIDER_META[selectedProvider]?.name}
                    </Badge>
                </div>
            )}

            {/* Provider Sections */}
            <div className="space-y-4">
                {Object.entries(modelsByProvider).map(([provider, providerModels]) => {
                    const providerKey = provider as AiProvider;
                    const meta = PROVIDER_META[providerKey];
                    const isExpanded = expandedProviders.includes(providerKey);
                    const sysKeyAvailable = hasSystemKey(providerKey);
                    const activeModel = providerModels?.find((m) => m.modelId === selectedModelId);
                    // const hasCustomKey = !!apiKeys[providerKey]; // Removed to use helper
                    const isCurrentProvider = selectedProvider === providerKey;

                    if (!meta || !providerModels) return null;

                    return (
                        <Card key={provider} className={cn(
                            "group bg-card/40 backdrop-blur-md border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:shadow-primary/5",
                            isCurrentProvider && "border-primary/30 shadow-md shadow-primary/5",
                            isExpanded ? "ring-1 ring-white/5" : ""
                        )}>
                            <CardHeader
                                onClick={() => toggleProvider(providerKey)}
                                className={cn(
                                    "cursor-pointer transition-colors px-6 py-4",
                                    isExpanded && "bg-white/5 border-b border-white/5"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${meta.gradient} ${meta.color} text-2xl shadow-inner`}>
                                            {meta.icon}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {meta.name}
                                                {activeModel && (
                                                    <Badge className="bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <span>{providerModels.length} models</span>
                                                {sysKeyAvailable && (
                                                    <span className="flex items-center gap-1 text-emerald-400 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                        <Shield className="w-3 h-3" /> Managed Key Available
                                                    </span>
                                                )}
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Quick Key Config Button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "gap-2 hover:bg-white/10",
                                                hasCustomKey(providerKey) ? "text-amber-400" : "text-muted-foreground"
                                            )}
                                            onClick={(e) => openKeyModal(providerKey, e)}
                                        >
                                            <Key className="w-4 h-4" />
                                            {hasCustomKey(providerKey) ? (isKeyMasked(apiKeys[providerKey]) ? "Key Configured" : "Key Set") : "Set Custom Key"}
                                        </Button>

                                        {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent className="p-6">
                                    {/* Key Configuration Toggle for this provider */}
                                    {isCurrentProvider && (
                                        <div className="mb-6 p-4 rounded-xl bg-muted/20 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium flex items-center gap-2">
                                                    <Settings className="w-4 h-4 text-primary" />
                                                    Configuration Mode
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Choose how this provider authenticates requests.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 bg-black/20 p-1 rounded-lg border border-white/5">
                                                <button
                                                    onClick={() => sysKeyAvailable && setUseSystemKey(true)}
                                                    disabled={!sysKeyAvailable}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 disabled:opacity-50",
                                                        useSystemKey
                                                            ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                                                            : "text-muted-foreground hover:text-white"
                                                    )}
                                                >
                                                    <Shield className="w-3 h-3" />
                                                    Managed Key
                                                </button>
                                                <button
                                                    onClick={() => setUseSystemKey(false)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                                                        !useSystemKey
                                                            ? "bg-amber-500/20 text-amber-400 shadow-sm"
                                                            : "text-muted-foreground hover:text-white"
                                                    )}
                                                >
                                                    <Key className="w-3 h-3" />
                                                    Custom Key
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Models Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {providerModels.map((model) => {
                                            const isSelected = selectedModelId === model.modelId;

                                            return (
                                                <div
                                                    key={model.id}
                                                    onClick={() => handleSelectModel(model)}
                                                    className={cn(
                                                        "relative p-4 rounded-xl border transition-all duration-200 cursor-pointer group/card",
                                                        isSelected
                                                            ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.15)] ring-1 ring-primary/30"
                                                            : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-3 right-3 animate-in zoom-in duration-200">
                                                            <div className="p-1 rounded-full bg-primary text-primary-foreground shadow-sm">
                                                                <Check className="w-3 h-3" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${meta.gradient} ${meta.color} group-hover/card:scale-110 transition-transform`}>
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-sm truncate">{model.name}</h4>
                                                                <code className="text-[10px] text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded">
                                                                    {model.modelId}
                                                                </code>
                                                            </div>
                                                        </div>

                                                        {model.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                                {model.description}
                                                            </p>
                                                        )}

                                                        {/* Pricing */}
                                                        {/* Pricing (User Facing - Includes Markup) */}
                                                        <div className="flex items-center gap-3 pt-3 mt-1 border-t border-white/5">
                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <DollarSign className="w-3 h-3 text-emerald-400" />
                                                                <span>In: ${((model.inputPrice || 0) * (1 + ((model as any).defaultMarkup || 20) / 100)).toFixed(4)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <Zap className="w-3 h-3 text-amber-400" />
                                                                <span>Out: ${((model.outputPrice || 0) * (1 + ((model as any).defaultMarkup || 20) / 100)).toFixed(4)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {Object.keys(modelsByProvider).length === 0 && (
                <div className="text-center py-16 text-muted-foreground glass rounded-xl border border-white/5">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No AI models are currently available.</p>
                    <p className="text-sm mt-1 text-muted-foreground/60">Contact your platform administrator to enable models.</p>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end sticky bottom-6 pt-4">
                <div className="p-2 rounded-xl glass border border-white/10 shadow-2xl">
                    <Button
                        onClick={handleSave}
                        disabled={isPending || !selectedModelId}
                        size="lg"
                        className="min-w-[180px] shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all font-semibold"
                    >
                        {isPending ? (
                            "Saving Configuration..."
                        ) : (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* API Key Modal */}
            <ApiKeyModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleKeySave}
                providerName={modalProvider ? PROVIDER_META[modalProvider].name : ""}
                providerUrl={modalProvider ? PROVIDER_META[modalProvider].url : undefined}
                // Never pass the masked key as the initial value to the input
                initialKey={modalProvider && !isKeyMasked(apiKeys[modalProvider]) ? apiKeys[modalProvider] : ""}
                isMasked={modalProvider ? isKeyMasked(apiKeys[modalProvider]) : false}
            />
        </div>
    );
}
