"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { Loader2, Mail, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type EmailProvider = "AWS_SES" | "RESEND" | "SENDGRID" | "MAILGUN" | "POSTMARK" | "SMTP";

interface EmailConfig {
    id: string;
    provider: EmailProvider;
    from_email: string;
    from_name?: string;
    aws_access_key_id?: string;
    aws_secret_access_key?: string; // Masked from backend ideally
    aws_region?: string;
    resend_api_key?: string;        // Masked from backend ideally
    sendgrid_api_key?: string;
    mailgun_api_key?: string;
    mailgun_domain?: string;
    mailgun_region?: string;
    postmark_api_token?: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    verification_status: "PENDING" | "VERIFIED" | "FAILED" | "NOT_STARTED";
}

interface TeamEmailSettingsProps {
    teamId: string;
}

export function TeamEmailSettings({ teamId }: TeamEmailSettingsProps) {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<EmailConfig | null>(null);

    // Form State
    const [provider, setProvider] = useState<EmailProvider>("AWS_SES");
    const [emailInput, setEmailInput] = useState("");
    const [nameInput, setNameInput] = useState("");

    // AWS SES Credentials
    const [awsAccessKey, setAwsAccessKey] = useState("");
    const [awsSecretKey, setAwsSecretKey] = useState("");
    const [awsRegion, setAwsRegion] = useState("us-east-1");

    // Resend Credentials
    const [resendApiKey, setResendApiKey] = useState("");

    // SendGrid
    const [sendgridApiKey, setSendgridApiKey] = useState("");

    // Mailgun
    const [mailgunApiKey, setMailgunApiKey] = useState("");
    const [mailgunDomain, setMailgunDomain] = useState("");
    const [mailgunRegion, setMailgunRegion] = useState("us");

    // Postmark
    const [postmarkApiToken, setPostmarkApiToken] = useState("");

    // SMTP
    const [smtpHost, setSmtpHost] = useState("");
    const [smtpPort, setSmtpPort] = useState("587");
    const [smtpUser, setSmtpUser] = useState("");
    const [smtpPassword, setSmtpPassword] = useState("");

    useEffect(() => {
        if (!teamId) return;
        fetchConfig();
    }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchConfig = async () => {
        if (!teamId) return;
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config`);
            if (res.ok) {
                const data: EmailConfig | null = await res.json();
                if (data) {
                    setConfig(data);
                    setProvider(data.provider || "AWS_SES");
                    setEmailInput(data.from_email || "");
                    setNameInput(data.from_name || "");
                    setAwsRegion(data.aws_region || "us-east-1");
                    setMailgunDomain(data.mailgun_domain || "");
                    setMailgunRegion(data.mailgun_region || "us");
                    setSmtpHost(data.smtp_host || "");
                    setSmtpPort(data.smtp_port ? String(data.smtp_port) : "587");
                    setSmtpUser(data.smtp_user || "");
                    // We don't populate secrets back
                } else {
                    setConfig(null); // No config found
                }
            }
        } catch (error) {
            console.error("Failed to fetch email config", error);
        }
    };

    const handleRemove = async () => {
        if (!config || !teamId || !confirm("Are you sure? This will stop future campaigns from using this email configuration.")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/email-config`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to remove config");

            setConfig(null);
            setEmailInput("");
            setNameInput("");
            setAwsAccessKey("");
            setAwsSecretKey("");
            setResendApiKey("");
            setSendgridApiKey("");
            setMailgunApiKey("");
            setMailgunDomain("");
            setPostmarkApiToken("");
            setSmtpHost("");
            setSmtpPort("587");
            setSmtpUser("");
            setSmtpPassword("");

            toast.success("Email configuration removed.");
        } catch (error) {
            toast.error("Failed to remove configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!teamId || !emailInput) {
            toast.error("Email is required");
            return;
        }
        if (!emailInput.includes("@")) {
            toast.error("Invalid email address");
            return;
        }

        // Provider specific validation
        if (provider === "AWS_SES") {
            if (!config && (!awsAccessKey || !awsSecretKey)) {
                toast.error("AWS Credentials are required for new setup");
                return;
            }
        } else if (provider === "RESEND") {
            if (!config && !resendApiKey) {
                toast.error("Resend API Key is required for new setup");
                return;
            }
        } else if (provider === "SENDGRID") {
            if (!config && !sendgridApiKey) {
                toast.error("SendGrid API Key is required");
                return;
            }
        } else if (provider === "MAILGUN") {
            if (!config && (!mailgunApiKey || !mailgunDomain)) {
                toast.error("Mailgun API Key and Domain are required");
                return;
            }
        } else if (provider === "POSTMARK") {
            if (!config && !postmarkApiToken) {
                toast.error("Postmark API Token is required");
                return;
            }
        } else if (provider === "SMTP") {
            if (!config && (!smtpHost || !smtpPort || !smtpUser || !smtpPassword)) {
                toast.error("All SMTP fields are required");
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                provider,
                from_email: emailInput,
                from_name: nameInput,
                // Only send if provided (to update)
                ...(awsAccessKey && { aws_access_key_id: awsAccessKey }),
                ...(awsSecretKey && { aws_secret_access_key: awsSecretKey }),
                ...(awsRegion && { aws_region: awsRegion }),
                ...(resendApiKey && { resend_api_key: resendApiKey }),
                ...(sendgridApiKey && { sendgrid_api_key: sendgridApiKey }),
                ...(mailgunApiKey && { mailgun_api_key: mailgunApiKey }),
                mailgun_domain: mailgunDomain,
                mailgun_region: mailgunRegion,
                ...(postmarkApiToken && { postmark_api_token: postmarkApiToken }),
                smtp_host: smtpHost,
                smtp_port: parseInt(smtpPort),
                smtp_user: smtpUser,
                ...(smtpPassword && { smtp_password: smtpPassword }),
            };

            const res = await fetch(`/api/teams/${teamId}/email-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to save");
            }

            const data = await res.json();
            setConfig(data);

            // Clear sensitive inputs
            setAwsAccessKey("");
            setAwsSecretKey("");
            setResendApiKey("");
            setSendgridApiKey("");
            setMailgunApiKey("");
            setPostmarkApiToken("");
            setSmtpPassword("");

            if (provider === "AWS_SES") {
                toast.success("Configuration saved. Check inbox for verification link.");
            } else {
                toast.success("Configuration saved successfully.");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save configuration");
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
                    Configure the email provider for sending campaigns and notifications.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* 1. Provider Selection */}
                <div className="space-y-2">
                    <Label htmlFor="provider">Email Provider</Label>
                    <Select
                        value={provider}
                        onValueChange={(val) => setProvider(val as EmailProvider)}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AWS_SES">AWS SES</SelectItem>
                            <SelectItem value="RESEND">Resend.com</SelectItem>
                            <SelectItem value="SENDGRID">Twilio SendGrid</SelectItem>
                            <SelectItem value="MAILGUN">Mailgun</SelectItem>
                            <SelectItem value="POSTMARK">Postmark</SelectItem>
                            <SelectItem value="SMTP">Custom SMTP</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 2. Common Settings */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fromName">Sender Name (Optional)</Label>
                        <Input
                            id="fromName"
                            placeholder="Acme Sales Team"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fromEmail">Sender Email Address</Label>
                        <Input
                            id="fromEmail"
                            placeholder="sales@yourcompany.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* 3. Provider Specific Settings */}
                {provider === "AWS_SES" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-orange-500" />
                            <h4 className="text-sm font-medium">AWS Credentials</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="awsKey">Access Key ID</Label>
                                <Input
                                    id="awsKey"
                                    type="password"
                                    placeholder={config?.aws_access_key_id ? "••••••••••••••••" : "AKI..."}
                                    value={awsAccessKey}
                                    onChange={(e) => setAwsAccessKey(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="awsRegion">AWS Region</Label>
                                <Select value={awsRegion} onValueChange={setAwsRegion} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="us-east-1">US East (N. Virginia) (us-east-1)</SelectItem>
                                        <SelectItem value="us-east-2">US East (Ohio) (us-east-2)</SelectItem>
                                        <SelectItem value="us-west-1">US West (N. California) (us-west-1)</SelectItem>
                                        <SelectItem value="us-west-2">US West (Oregon) (us-west-2)</SelectItem>
                                        <SelectItem value="ap-south-1">Asia Pacific (Mumbai) (ap-south-1)</SelectItem>
                                        <SelectItem value="ap-northeast-3">Asia Pacific (Osaka) (ap-northeast-3)</SelectItem>
                                        <SelectItem value="ap-northeast-2">Asia Pacific (Seoul) (ap-northeast-2)</SelectItem>
                                        <SelectItem value="ap-southeast-1">Asia Pacific (Singapore) (ap-southeast-1)</SelectItem>
                                        <SelectItem value="ap-southeast-2">Asia Pacific (Sydney) (ap-southeast-2)</SelectItem>
                                        <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo) (ap-northeast-1)</SelectItem>
                                        <SelectItem value="ca-central-1">Canada (Central) (ca-central-1)</SelectItem>
                                        <SelectItem value="eu-central-1">Europe (Frankfurt) (eu-central-1)</SelectItem>
                                        <SelectItem value="eu-west-1">Europe (Ireland) (eu-west-1)</SelectItem>
                                        <SelectItem value="eu-west-2">Europe (London) (eu-west-2)</SelectItem>
                                        <SelectItem value="eu-west-3">Europe (Paris) (eu-west-3)</SelectItem>
                                        <SelectItem value="eu-north-1">Europe (Stockholm) (eu-north-1)</SelectItem>
                                        <SelectItem value="sa-east-1">South America (São Paulo) (sa-east-1)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="awsSecret">Secret Access Key</Label>
                                <Input
                                    id="awsSecret"
                                    type="password"
                                    placeholder={config?.aws_secret_access_key ? "••••••••••••••••••••••••••••••••" : "Secret Key..."}
                                    value={awsSecretKey}
                                    onChange={(e) => setAwsSecretKey(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Make sure this IAM user has `ses:SendEmail` and `ses:VerifyEmailIdentity` permissions.
                        </p>
                    </div>
                )}

                {provider === "RESEND" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-sm font-medium">Resend Configuration</h4>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="resendKey">API Key</Label>
                            <Input
                                id="resendKey"
                                type="password"
                                placeholder={config?.resend_api_key ? "re_••••••••••••••••" : "re_123..."}
                                value={resendApiKey}
                                onChange={(e) => setResendApiKey(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Generate an API key from your Resend dashboard.
                        </p>
                    </div>
                )}

                {provider === "SENDGRID" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4 text-blue-500" />
                            <h4 className="text-sm font-medium">SendGrid Configuration</h4>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sendgridKey">API Key</Label>
                            <Input
                                id="sendgridKey"
                                type="password"
                                placeholder={config?.sendgrid_api_key ? "SG.••••••••••••••••" : "SG..."}
                                value={sendgridApiKey}
                                onChange={(e) => setSendgridApiKey(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                )}

                {provider === "MAILGUN" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4 text-red-500" />
                            <h4 className="text-sm font-medium">Mailgun Configuration</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="mailgunKey">API Key</Label>
                                <Input
                                    id="mailgunKey"
                                    type="password"
                                    placeholder={config?.mailgun_api_key ? "key-••••••••••••••••" : "key-..."}
                                    value={mailgunApiKey}
                                    onChange={(e) => setMailgunApiKey(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mailgunDomain">Domain</Label>
                                <Input
                                    id="mailgunDomain"
                                    placeholder="mg.yourdomain.com"
                                    value={mailgunDomain}
                                    onChange={(e) => setMailgunDomain(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mailgunRegion">Region</Label>
                                <Select value={mailgunRegion} onValueChange={setMailgunRegion} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="us">US</SelectItem>
                                        <SelectItem value="eu">EU</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {provider === "POSTMARK" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4 text-yellow-500" />
                            <h4 className="text-sm font-medium">Postmark Configuration</h4>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="postmarkToken">Server API Token</Label>
                            <Input
                                id="postmarkToken"
                                type="password"
                                placeholder={config?.postmark_api_token ? "••••-••••-••••" : "token..."}
                                value={postmarkApiToken}
                                onChange={(e) => setPostmarkApiToken(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                )}

                {provider === "SMTP" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <h4 className="text-sm font-medium">Custom SMTP Configuration</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="smtpHost">Host</Label>
                                <Input
                                    id="smtpHost"
                                    placeholder="smtp.example.com"
                                    value={smtpHost}
                                    onChange={(e) => setSmtpHost(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="smtpPort">Port</Label>
                                <Input
                                    id="smtpPort"
                                    placeholder="587"
                                    value={smtpPort}
                                    onChange={(e) => setSmtpPort(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="smtpUser">Username</Label>
                                <Input
                                    id="smtpUser"
                                    placeholder="user@example.com"
                                    value={smtpUser}
                                    onChange={(e) => setSmtpUser(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="smtpPass">Password</Label>
                                <Input
                                    id="smtpPass"
                                    type="password"
                                    placeholder={config?.smtp_password ? "••••••••" : "password"}
                                    value={smtpPassword}
                                    onChange={(e) => setSmtpPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Actions & Status */}
                <div className="flex items-center gap-4 pt-4 border-t">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Save Configuration
                    </Button>

                    {config && (
                        <Button variant="destructive" onClick={handleRemove} disabled={loading}>
                            Remove Config
                        </Button>
                    )}
                </div>

                {config && (
                    <div className={cn(
                        "mt-4 p-3 rounded-md border flex items-center gap-3",
                        config.verification_status === "VERIFIED" ? "bg-green-500/10 border-green-500/20" :
                            config.verification_status === "PENDING" ? "bg-amber-500/10 border-amber-500/20" :
                                "bg-red-500/10 border-red-500/20"
                    )}>
                        {config.verification_status === "VERIFIED" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {config.verification_status === "PENDING" && <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />}
                        {config.verification_status === "FAILED" && <AlertCircle className="w-5 h-5 text-red-600" />}

                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                Status: {config.verification_status} ({config.provider})
                            </p>
                            {config.verification_status === "PENDING" && config.provider === "AWS_SES" && (
                                <p className="text-xs text-muted-foreground">
                                    AWS Verification Pending. Check your inbox at <strong>{config.from_email}</strong>.
                                </p>
                            )}
                            {config.verification_status === "PENDING" && config.provider !== "AWS_SES" && (
                                <p className="text-xs text-muted-foreground">
                                    We assume your credentials are correct. Send a test email to verify.
                                </p>
                            )}
                        </div>
                        {config.verification_status === "PENDING" && (
                            <Button size="sm" variant="outline" onClick={fetchConfig} disabled={loading}>Check Status</Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
