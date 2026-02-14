
import { prismadb } from "@/lib/prisma";
import { AiProvider } from "@prisma/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { revalidatePath } from "next/cache";

const UnifiedAiCard = async () => {

    const systemConfigs = await prismadb.systemAiConfig.findMany();

    // Fetch specific models for dropdowns
    const allModels = await prismadb.aiModel.findMany({
        where: { isActive: true }
    });

    // Helper to get config for a provider
    const getConfig = (provider: string) => systemConfigs.find(c => c.provider === provider);

    const saveConfig = async (formData: FormData) => {
        "use server";
        const provider = formData.get("provider") as AiProvider;
        const apiKey = formData.get("apiKey") as string;
        const baseUrl = formData.get("baseUrl") as string;
        const isActive = formData.get("isActive") === "on";
        const defaultModelId = formData.get("defaultModelId") as string;

        // Azure/Google Specifics
        const resourceName = formData.get("resourceName") as string;
        const deploymentId = formData.get("deploymentId") as string;
        const apiVersion = formData.get("apiVersion") as string;
        const projectId = formData.get("projectId") as string;

        let configuration = {};

        if (provider === "AZURE") {
            configuration = { resourceName, deploymentId, apiVersion };
        } else if (provider === "GOOGLE") {
            configuration = { projectId };
        }

        if (!apiKey && isActive) {
            // Only require API key if enabling the provider
            // Exception: If provider is GOOGLE, apiKey might be empty if using Vertex AI Project ID, but we'll leave that logic to user
            // Actually, let's just warn or allow?
            // The user wanted to disable, so if isActive is false, we proceed.
        }

        // Removed: if (!apiKey) return; 

        await prismadb.systemAiConfig.upsert({
            where: { provider },
            create: {
                provider,
                apiKey: (apiKey || undefined) as any,
                baseUrl,
                configuration: configuration,
                defaultModelId: defaultModelId || null,
                isActive
            },
            update: {
                apiKey: (apiKey || undefined) as any,
                baseUrl,
                configuration: configuration,
                defaultModelId: defaultModelId || null,
                isActive
            }
        });

        revalidatePath("/admin");
    };

    const providers = Object.values(AiProvider);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Unified AI Configuration</CardTitle>
                <CardDescription>Manage System-wide API keys and Default Models.</CardDescription>
                <div className="text-sm bg-yellow-500/10 text-yellow-500 p-2 rounded">
                    Note: These settings define the <strong>System Key</strong> and <strong>System Defaults</strong>.
                    Teams can override these in their own settings.
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="OPENAI">
                    <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-4 h-auto flex-wrap gap-2">
                        {providers.map(p => (
                            <TabsTrigger key={p} value={p} className="text-xs">{p}</TabsTrigger>
                        ))}
                    </TabsList>
                    {providers.map(provider => {
                        const config = getConfig(provider);
                        const configJson = config?.configuration as any || {};

                        // Filter models for this provider
                        const providerModels = allModels.filter(m => m.provider === provider);

                        return (
                            <TabsContent key={provider} value={provider}>
                                <form action={saveConfig} className="space-y-4" suppressHydrationWarning>
                                    <input type="hidden" name="provider" value={provider} />

                                    <div className="grid gap-2" suppressHydrationWarning>
                                        <Label>API Key (System Key)</Label>
                                        <Input
                                            name="apiKey"
                                            type="password"
                                            placeholder={`Enter ${provider} API Key`}
                                            defaultValue={config?.apiKey || ""}
                                        />
                                    </div>

                                    {/* Default Model Selector */}
                                    <div className="grid gap-2">
                                        <Label>Default Model</Label>
                                        <Select name="defaultModelId" defaultValue={config?.defaultModelId || ""}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select System Default Model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {providerModels.length === 0 && <SelectItem value="none" disabled>No active models found</SelectItem>}
                                                {providerModels.map(m => (
                                                    <SelectItem key={m.id} value={m.modelId}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">This model will be used if a Team selects &quot;Provider Default&quot;.</p>
                                    </div>

                                    {/* AZURE SPECIFIC FIELDS */}
                                    {provider === "AZURE" && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/20">
                                            <div className="grid gap-2">
                                                <Label>Resource Name</Label>
                                                <Input name="resourceName" placeholder="my-openai-resource" defaultValue={configJson.resourceName || ""} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Deployment ID</Label>
                                                <Input name="deploymentId" placeholder="my-gpt4-deployment" defaultValue={configJson.deploymentId || ""} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>API Version</Label>
                                                <Input name="apiVersion" placeholder="2024-02-15-preview" defaultValue={configJson.apiVersion || ""} />
                                            </div>
                                        </div>
                                    )}

                                    {/* GOOGLE VERTEX FIELDS */}
                                    {provider === "GOOGLE" && (
                                        <div className="grid gap-2 p-4 border rounded-md bg-muted/20">
                                            <Label>Project ID (Vertex AI only)</Label>
                                            <Input name="projectId" placeholder="my-gcp-project-id" defaultValue={configJson.projectId || ""} />
                                            <p className="text-xs text-muted-foreground">Leave empty if using Google AI Studio API Key.</p>
                                        </div>
                                    )}

                                    <div className="grid gap-2">
                                        <Label>Base URL (Optional)</Label>
                                        <Input
                                            name="baseUrl"
                                            placeholder="https://api.example.com/v1"
                                            defaultValue={config?.baseUrl || ""}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch name="isActive" defaultChecked={config?.isActive ?? true} />
                                        <Label>Enable Provider</Label>
                                    </div>

                                    <Button type="submit">Save {provider} Config</Button>
                                </form>
                            </TabsContent>
                        )
                    })}
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default UnifiedAiCard;
