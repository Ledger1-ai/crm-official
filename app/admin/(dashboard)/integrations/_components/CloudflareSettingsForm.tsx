
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface CloudflareSettingsFormProps {
    teamId: string;
    initialConfig: {
        site_key: string;
        secret_key: string;
    } | null;
}

export function CloudflareSettingsForm({ teamId, initialConfig }: CloudflareSettingsFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [siteKey, setSiteKey] = useState(initialConfig?.site_key || "");
    const [secretKey, setSecretKey] = useState(initialConfig?.secret_key || "");

    const handleSave = async () => {
        startTransition(async () => {
            try {
                const res = await fetch(`/api/teams/${teamId}/captcha-config`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        site_key: siteKey,
                        secret_key: secretKey,
                    }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to save");
                }

                toast.success("Cloudflare Turnstile settings saved!");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Failed to save settings");
            }
        });
    };

    return (
        <Card className="border border-orange-500/20 bg-orange-500/5 shadow-none w-full h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Image
                            src="/cloudflare-logo.svg"
                            alt="Cloudflare Logo"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                        Cloudflare
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Turnstile Spam Protection.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 flex-1">
                <div className="grid gap-2">
                    <Label htmlFor="cf-site-key">Site Key</Label>
                    <Input
                        id="cf-site-key"
                        value={siteKey}
                        onChange={(e) => setSiteKey(e.target.value)}
                        placeholder="0x4AAAAAA..."
                        className="bg-background/50 border-orange-500/20 font-mono text-sm"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="cf-secret-key">Secret Key</Label>
                    <Input
                        id="cf-secret-key"
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="0x4AAAAAA..."
                        className="bg-background/50 border-orange-500/20 font-mono text-sm"
                    />
                </div>

                <div className="flex justify-between items-center pt-2 mt-auto">
                    <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => window.open("https://dash.cloudflare.com/?to=/:account/turnstile", "_blank")}
                        className="border-orange-500/20 hover:bg-orange-500/10 text-xs py-1 h-8"
                    >
                        Get Keys
                        <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                    <Button onClick={handleSave} disabled={isPending} size="sm" className="bg-orange-600 hover:bg-orange-700 h-8">
                        {isPending ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
