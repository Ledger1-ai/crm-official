"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailConfig {
    id: string;
    from_email: string;
    verification_status: "PENDING" | "VERIFIED" | "FAILED" | "NOT_STARTED";
}

interface TeamEmailSettingsProps {
    teamId: string;
}

export function TeamEmailSettings({ teamId }: TeamEmailSettingsProps) {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<EmailConfig | null>(null);
    const [emailInput, setEmailInput] = useState("");

    useEffect(() => {
        if (!teamId) return;
        fetchConfig();
    }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!teamId) return;
        fetchConfig();
    }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchConfig = async () => {
        if (!teamId) return;
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config`);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                if (data?.from_email) setEmailInput(data.from_email);
            }
        } catch (error) {
            console.error("Failed to fetch email config", error);
        }
    };

    const handleRemove = async () => {
        if (!config || !teamId || !confirm("Are you sure? This will stop future campaigns from using this email.")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to remove config");

            setConfig(null);
            setEmailInput("");
            toast.success("Email configuration removed.");
        } catch (error) {
            toast.error("Failed to remove configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!teamId || !emailInput) return;
        if (!emailInput.includes("@")) {
            toast.error("Invalid email address");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput }),
            });

            if (!res.ok) throw new Error("Failed to save");

            const data = await res.json();
            setConfig(data);
            toast.success("Verification email sent! Please check your inbox.");
        } catch (error) {
            toast.error("Failed to save email configuration");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Team Email Settings
                </CardTitle>
                <CardDescription>
                    Configure the email address used for mass outreach campaigns.
                    <br />
                    We use AWS SES for high-deliverability. You must verify ownership of this email.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Sender Email Address</label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="sales@yourcompany.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                        />
                        <Button onClick={handleSave} disabled={loading || !emailInput}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Save"}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Changing this will send a new verification link to the address.
                    </p>
                </div>

                {config && (
                    <div className={cn(
                        "p-3 rounded-md border flex items-center gap-3",
                        config.verification_status === "VERIFIED" ? "bg-green-500/10 border-green-500/20" :
                            config.verification_status === "PENDING" ? "bg-amber-500/10 border-amber-500/20" :
                                "bg-red-500/10 border-red-500/20"
                    )}>
                        {config.verification_status === "VERIFIED" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {config.verification_status === "PENDING" && <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />}
                        {config.verification_status === "FAILED" && <AlertCircle className="w-5 h-5 text-red-600" />}

                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                Status: {config.verification_status}
                            </p>
                            {config.verification_status === "PENDING" && (
                                <p className="text-xs text-muted-foreground">
                                    A verification link has been sent to <strong>{config.from_email}</strong>.
                                    Click the link in the email, then refresh this page.
                                </p>
                            )}
                            {config.verification_status === "VERIFIED" && (
                                <p className="text-xs text-muted-foreground">
                                    You are ready to send campaigns as <strong>{config.from_email}</strong>.
                                </p>
                            )}
                        </div>
                        {config.verification_status === "PENDING" && (
                            <Button size="sm" variant="outline" onClick={fetchConfig} disabled={loading}>Check Status</Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={handleRemove} disabled={loading}>Remove</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
