"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { MessageSquare, Globe, Palette, Image, Copy, ExternalLink, RefreshCw } from "lucide-react";

interface TeamPortalFormProps {
    teamId: string;
    initialPortal: {
        id: string;
        portal_name: string;
        portal_slug: string;
        logo_url: string | null;
        primary_color: string;
        secondary_color: string;
        welcome_message: string | null;
        show_sender_info: boolean;
        _count?: {
            recipients: number;
            messages: number;
        };
    } | null;
}

export const TeamPortalForm = ({ teamId, initialPortal }: TeamPortalFormProps) => {
    const [isPending, startTransition] = useTransition();
    const [portal, setPortal] = useState(initialPortal);
    const [showSenderInfo, setShowSenderInfo] = useState(initialPortal?.show_sender_info ?? true);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const portalUrl = portal ? `${baseUrl}/portal/${portal.portal_slug}` : "";

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            try {
                const data = {
                    teamId,
                    portalName: formData.get("portalName") as string,
                    logoUrl: formData.get("logoUrl") as string,
                    primaryColor: formData.get("primaryColor") as string,
                    secondaryColor: formData.get("secondaryColor") as string,
                    welcomeMessage: formData.get("welcomeMessage") as string,
                    showSenderInfo,
                };

                const res = await fetch(`/api/teams/${teamId}/portal`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to save portal settings");
                }

                const result = await res.json();
                setPortal(result.portal);
                toast.success("Portal settings saved successfully.");
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || "Failed to save settings.");
            }
        });
    };

    const copyPortalUrl = () => {
        if (portalUrl) {
            navigator.clipboard.writeText(portalUrl);
            toast.success("Portal URL copied to clipboard!");
        }
    };

    const regenerateSlug = async () => {
        if (!portal) return;
        startTransition(async () => {
            try {
                const res = await fetch(`/api/teams/${teamId}/portal/regenerate-slug`, {
                    method: "POST",
                });
                if (!res.ok) throw new Error("Failed to regenerate slug");
                const result = await res.json();
                setPortal(result.portal);
                toast.success("Portal URL regenerated!");
            } catch (error) {
                toast.error("Failed to regenerate portal URL");
            }
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-1 sm:p-4 overflow-hidden">
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/40 backdrop-blur-xl shadow-xl max-w-full">
                {/* Glass Header */}
                <div className="relative px-6 py-8 border-b border-border/50 bg-background/20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500/50 via-teal-500 to-teal-500/50 opacity-50" />
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                            <MessageSquare className="w-8 h-8 text-teal-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Message Portal Settings</h2>
                            <p className="text-muted-foreground mt-1">Configure your team&apos;s SMS message portal for recipient communication.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    {/* Portal Stats */}
                    {portal && (
                        <div className="mb-6 grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-background/30 border border-border/50">
                                <div className="text-2xl font-bold text-foreground">{portal._count?.recipients || 0}</div>
                                <div className="text-sm text-muted-foreground">Recipients</div>
                            </div>
                            <div className="p-4 rounded-xl bg-background/30 border border-border/50">
                                <div className="text-2xl font-bold text-foreground">{portal._count?.messages || 0}</div>
                                <div className="text-sm text-muted-foreground">Messages Sent</div>
                            </div>
                        </div>
                    )}

                    {/* Portal URL */}
                    {portal && (
                        <div className="mb-6 p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
                            <Label className="text-sm text-muted-foreground">Your Portal URL</Label>
                            <div className="flex items-center gap-2 mt-2">
                                <code className="flex-1 px-3 py-2 bg-background/50 rounded-lg text-sm font-mono truncate">
                                    {portalUrl}
                                </code>
                                <Button type="button" variant="outline" size="icon" onClick={copyPortalUrl} title="Copy URL">
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <Button type="button" variant="outline" size="icon" onClick={() => window.open(portalUrl, "_blank")} title="Open Portal">
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button type="button" variant="outline" size="icon" onClick={regenerateSlug} disabled={isPending} title="Regenerate URL">
                                    <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Recipients will access their messages at this URL using their unique access tokens.
                            </p>
                        </div>
                    )}

                    <form action={handleSubmit} className="space-y-8">
                        <input type="hidden" name="teamId" value={teamId} />

                        <div className="grid gap-8 md:grid-cols-2">
                            {/* Portal Name */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <Globe className="w-4 h-4 text-teal-500" />
                                    <Label className="text-base">Portal Name</Label>
                                </div>
                                <div className="bg-background/30 p-4 rounded-xl border border-border/50">
                                    <Input
                                        name="portalName"
                                        defaultValue={portal?.portal_name || ""}
                                        placeholder="e.g., Acme Client Portal"
                                        disabled={isPending}
                                        className="bg-background/50 border-border/50 h-11"
                                    />
                                    <p className="text-xs text-muted-foreground mt-3">
                                        The name displayed to recipients when viewing messages.
                                    </p>
                                </div>
                            </div>

                            {/* Logo URL */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-foreground font-medium">
                                    <Image className="w-4 h-4 text-teal-500" />
                                    <Label className="text-base">Logo URL</Label>
                                </div>
                                <div className="bg-background/30 p-4 rounded-xl border border-border/50">
                                    <Input
                                        name="logoUrl"
                                        type="url"
                                        defaultValue={portal?.logo_url || ""}
                                        placeholder="https://example.com/logo.png"
                                        disabled={isPending}
                                        className="bg-background/50 border-border/50 h-11"
                                    />
                                    <p className="text-xs text-muted-foreground mt-3">
                                        Your company logo displayed in the portal header.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="space-y-4 pt-4 border-t border-border/30">
                            <div className="flex items-center gap-2 text-foreground font-medium">
                                <Palette className="w-4 h-4 text-teal-500" />
                                <Label className="text-base">Brand Colors</Label>
                            </div>

                            <div className="bg-background/30 p-6 rounded-xl border border-border/50 grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm">Primary Color</Label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            name="primaryColor"
                                            defaultValue={portal?.primary_color || "#14b8a6"}
                                            className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                                            disabled={isPending}
                                        />
                                        <Input
                                            name="primaryColorHex"
                                            defaultValue={portal?.primary_color || "#14b8a6"}
                                            placeholder="#14b8a6"
                                            className="bg-background/50 border-border/50 h-11 font-mono"
                                            disabled={isPending}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">Secondary Color</Label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            name="secondaryColor"
                                            defaultValue={portal?.secondary_color || "#1f2937"}
                                            className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                                            disabled={isPending}
                                        />
                                        <Input
                                            name="secondaryColorHex"
                                            defaultValue={portal?.secondary_color || "#1f2937"}
                                            placeholder="#1f2937"
                                            className="bg-background/50 border-border/50 h-11 font-mono"
                                            disabled={isPending}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Welcome Message */}
                        <div className="space-y-4">
                            <Label className="text-base">Welcome Message</Label>
                            <div className="bg-background/30 p-4 rounded-xl border border-border/50">
                                <Textarea
                                    name="welcomeMessage"
                                    defaultValue={portal?.welcome_message || ""}
                                    placeholder="Welcome! Here you can view your personalized messages from our team."
                                    rows={3}
                                    disabled={isPending}
                                    className="bg-background/50 border-border/50 resize-none"
                                />
                                <p className="text-xs text-muted-foreground mt-3">
                                    Displayed to recipients when they first access the portal.
                                </p>
                            </div>
                        </div>

                        {/* Show Sender Info Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-background/30 border border-border/50">
                            <div className="space-y-0.5">
                                <Label className="text-base">Show Sender Information</Label>
                                <p className="text-sm text-muted-foreground">
                                    Display sender name and avatar on messages
                                </p>
                            </div>
                            <Switch
                                checked={showSenderInfo}
                                onCheckedChange={setShowSenderInfo}
                                disabled={isPending}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="min-w-[140px] h-11 text-base shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all bg-teal-600 hover:bg-teal-700"
                            >
                                {isPending ? "Saving..." : portal ? "Update Portal" : "Create Portal"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
