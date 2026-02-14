
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import { saveIntegrationSettings } from "@/actions/admin/save-integration-settings";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Props {
    initialData: any;
}

export const MercurySettingsForm = ({ initialData }: Props) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(initialData?.mercury_enabled || false);
    const [apiKey, setApiKey] = useState(initialData?.mercury_api_key || "");
    const [accountId, setAccountId] = useState(initialData?.mercury_account_id || "");
    const [visible, setVisible] = useState(false);

    const onSave = async () => {
        setLoading(true);
        const formData = new FormData();
        if (enabled) formData.append("mercury_enabled", "on");
        formData.append("mercury_api_key", apiKey);
        formData.append("mercury_account_id", accountId);

        const result = await saveIntegrationSettings(formData);

        if (result?.success) {
            toast.success("Mercury settings saved!");
            router.refresh();
        } else {
            toast.error(result?.error || "Failed to save.");
        }
        setLoading(false);
    };

    return (
        <Card className="border border-blue-400/20 bg-blue-400/5 shadow-none w-full h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Image
                            src="/mercury-icon.png"
                            alt="Mercury Logo"
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-sm brightness-0 invert opacity-70"
                        />
                        Mercury
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Unified Banking & Invoicing.
                    </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                <div className="grid gap-2">
                    <Label htmlFor="mercury-key">API API Key</Label>
                    <div className="relative">
                        <Input
                            id="mercury-key"
                            type={visible ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk_live_..."
                            className="bg-background/50 border-blue-400/20 font-mono text-sm pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setVisible(!visible)}
                        >
                            {visible ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="mercury-account">Account ID</Label>
                    <Input
                        id="mercury-account"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        placeholder="mercury_account_..."
                        className="bg-background/50 border-blue-400/20 font-mono text-sm"
                    />
                </div>

                <div className="flex justify-between items-center pt-2 mt-auto">
                    <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => window.open("https://mercury.com/settings/api", "_blank")}
                        className="border-blue-400/20 hover:bg-blue-400/10 text-xs py-1 h-8"
                    >
                        Merchant Portal
                        <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={loading}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 h-8"
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
