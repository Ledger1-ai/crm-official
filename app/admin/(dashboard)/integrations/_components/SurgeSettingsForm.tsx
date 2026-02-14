
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import { saveIntegrationSettings } from "@/actions/admin/save-integration-settings";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SurgeSubscriptionCard } from "./SurgeSubscriptionCard";


interface Props {
    initialData: any;
}

export const SurgeSettingsForm = ({ initialData }: Props) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Convert boolean if string, or use default
    // Prisma boolean is strict boolean usually
    const [enabled, setEnabled] = useState(initialData?.surge_enabled || false);
    const [secretKey, setSecretKey] = useState(initialData?.surge_api_key || "");
    const [merchantId, setMerchantId] = useState(initialData?.surge_merchant_id || "");
    const [merchantIdVisible, setMerchantIdVisible] = useState(false);

    const onSave = async () => {
        setLoading(true);
        const formData = new FormData();
        if (enabled) formData.append("surge_enabled", "on");
        formData.append("surge_api_key", secretKey);
        formData.append("surge_merchant_id", merchantId);

        const result = await saveIntegrationSettings(formData);

        if (result?.success) {
            toast.success("Surge settings saved!");
            router.refresh();
        } else {
            toast.error(result?.error || "Failed to save.");
        }
        setLoading(false);
    };

    return (
        <Card className="border border-indigo-500/20 bg-indigo-500/5 shadow-none w-full h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Image
                            src="/Surge32.png"
                            alt="Surge Logo"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                        BasaltSURGE
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Accept crypto payments (Base Network).
                    </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="surge-mode" checked={enabled} onCheckedChange={setEnabled} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                {enabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid gap-2">
                            <Label htmlFor="surge-secret">Secret Key (sk_live...)</Label>
                            <Input
                                id="surge-secret"
                                type="password"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                placeholder="sk_live_..."
                                className="bg-background/50 border-indigo-500/20 font-mono text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="surge-id">Wallet Address (0x...)</Label>
                            <div className="relative">
                                <Input
                                    id="surge-id"
                                    type={merchantIdVisible ? "text" : "password"}
                                    value={merchantId}
                                    onChange={(e) => setMerchantId(e.target.value)}
                                    placeholder="0x..."
                                    className="bg-background/50 border-indigo-500/20 font-mono text-sm pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setMerchantIdVisible(!merchantIdVisible)}
                                >
                                    {merchantIdVisible ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-center pt-2 mt-auto">
                    <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => window.open("https://surge.basalthq.com/developers", "_blank")}
                        className="border-indigo-500/20 hover:bg-indigo-500/10 text-xs py-1 h-8"
                    >
                        Developer Docs
                        <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={loading}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 h-8 font-semibold"
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
