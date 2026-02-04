"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CaptchaConfigFormProps {
    teamId: string;
    initialConfig: {
        site_key: string;
        secret_key: string;
    } | null;
}

export function CaptchaConfigForm({ teamId, initialConfig }: CaptchaConfigFormProps) {
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

                toast.success("Captcha Settings saved successfully!");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Failed to save settings");
            }
        });
    };

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle>Spam Protection (Cloudflare Turnstile)</CardTitle>
                        <CardDescription>
                            Configure team-wide keys for form spam protection.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Site Key</Label>
                        <Input
                            value={siteKey}
                            onChange={(e) => setSiteKey(e.target.value)}
                            placeholder="0x4AAAAAA..."
                            className="font-mono bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Secret Key</Label>
                        <Input
                            type="password"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            placeholder="0x4AAAAAA..."
                            className="font-mono bg-background"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? (
                            "Saving..."
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
