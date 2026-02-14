"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, CheckCircle, Video, MessageCircle, Shield } from "lucide-react";
import { trackDealRoomActivity, updateDealRoomAddons } from "@/actions/crm/deal-room";

interface DealRoomProps {
    dealRoom: any;
    contract: any;
}

export default function DealRoomView({ dealRoom, contract }: DealRoomProps) {
    // Initial state
    const [selectedAddons, setSelectedAddons] = useState<any[]>(dealRoom.selected_addons || []);
    const [isAccepting, setIsAccepting] = useState(false);

    // Tracking on mount
    useEffect(() => {
        // Track "OPENED"
        trackDealRoomActivity(dealRoom.id, "OPENED", {
            userAgent: navigator.userAgent,
            referrer: document.referrer
        });

        // Heatmap / Engagement polling (Simple version: Ping every 30s)
        const interval = setInterval(() => {
            trackDealRoomActivity(dealRoom.id, "ENGAGEMENT_PING", {
                duration: 30
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [dealRoom.id]);

    const baseValue = contract.value || 0;

    const addonsValue = selectedAddons.reduce((acc, addon) => acc + (addon.price || 0), 0);
    const totalValue = baseValue + addonsValue;

    const toggleAddon = async (addon: any, checked: boolean) => {
        let newAddons = [...selectedAddons];
        if (checked) {
            newAddons.push(addon);
        } else {
            newAddons = newAddons.filter((a) => a.name !== addon.name);
        }

        setSelectedAddons(newAddons);

        // Optimistic update, but create server action to save
        try {
            await updateDealRoomAddons(dealRoom.id, newAddons, totalValue);
            trackDealRoomActivity(dealRoom.id, "PRICING_TOGGLE", {
                addon: addon.name,
                added: checked
            });
        } catch (error) {
            toast.error("Failed to update selection");
        }
    };

    const handleSign = () => {
        setIsAccepting(true);
        // In real app, redirect to DocuSign or internal signature pad
        trackDealRoomActivity(dealRoom.id, "CLICKED_SIGN", {});
        setTimeout(() => {
            setIsAccepting(false);
            toast.success("Redirecting to secure signature portal...");
            // Simulate redirect
        }, 1500);
    };

    const availableAddons = (dealRoom.allowed_addons as any[]) || [
        { name: "Priority Support (24/7)", price: 500, description: "Direct access to engineering team." },
        { name: "Onboarding Package", price: 1200, description: "3 Sessions of dedicated training." },
        { name: "White-Label Branding", price: 2000, description: "Remove all vendor branding." }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold tracking-tight">Secure Deal Room</span>
                            <span className="text-xs text-muted-foreground">Expires: {dealRoom.valid_until ? format(new Date(dealRoom.valid_until), "PPP") : "Never"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-xs text-muted-foreground">Total Value</span>
                            <span className="font-bold text-lg text-emerald-600">${totalValue.toLocaleString()}</span>
                        </div>
                        <Button onClick={handleSign} disabled={isAccepting} size="lg" className="gap-2">
                            {isAccepting ? "Processing..." : "Accept & Sign"}
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 container py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Content */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Hero Video */}
                    {dealRoom.hero_video_url ? (
                        <div className="rounded-xl overflow-hidden border shadow-sm aspect-video bg-black relative group">
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {/* Just a placeholder for video embed logic */}
                                <Video className="w-16 h-16 text-white/50 group-hover:text-white/80 transition-colors" />
                            </div>
                            {/* You would embed YouTube/Loom iframe here */}
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-400">
                                [Video Embed: {dealRoom.hero_video_url}]
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-card border rounded-xl shadow-sm text-center space-y-4">
                            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                <FileText className="h-8 w-8" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">{contract.title}</h1>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                We are excited to partner with **{contract.assigned_account?.name || "you"}**.
                                This proposal outlines the scope, timeline, and investment for our collaboration.
                            </p>
                        </div>
                    )}

                    {/* Contract Details / Scope */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Scope of Work</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none">
                                <p>{contract.description || "No description provided."}</p>
                                {/* Placeholder for rich text or PDF viewer */}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Pricing & Interaction */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Agent Profile */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-slate-200" />
                                <div>
                                    <p className="font-semibold">{contract.assigned_to_user?.name || "Sales Rep"}</p>
                                    <p className="text-sm text-muted-foreground">{contract.assigned_to_user?.email}</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <Button variant="outline" className="w-full gap-2" onClick={() => {
                                toast.info("Opening Chat...");
                                trackDealRoomActivity(dealRoom.id, "CLICKED_CHAT", {});
                            }}>
                                <MessageCircle className="h-4 w-4" />
                                Chat with Rep
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Pricing Config */}
                    <Card className="border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                        <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10">
                            <CardTitle className="text-emerald-700 dark:text-emerald-400">Investment</CardTitle>
                            <CardDescription>Tailor your package</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {/* Base Item */}
                            <div className="flex justify-between items-start pb-4 border-b">
                                <div>
                                    <p className="font-medium">Base Contract</p>
                                    <p className="text-xs text-muted-foreground">Core services as defined in scope.</p>
                                </div>
                                <span className="font-mono">${baseValue.toLocaleString()}</span>
                            </div>

                            {/* Addons */}
                            {availableAddons.map((addon, idx) => {
                                const isChecked = selectedAddons.some(a => a.name === addon.name);
                                return (
                                    <div key={idx} className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${isChecked ? 'bg-emerald-50/50 border-emerald-200' : 'border-transparent hover:bg-slate-50'}`}>
                                        <Checkbox
                                            id={`addon-${idx}`}
                                            checked={isChecked}
                                            onCheckedChange={(c) => toggleAddon(addon, c as boolean)}
                                        />
                                        <div className="grid gap-1.5 leading-none w-full">
                                            <label
                                                htmlFor={`addon-${idx}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex justify-between w-full"
                                            >
                                                <span>{addon.name}</span>
                                                <span className="font-mono text-muted-foreground">+${addon.price}</span>
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                {addon.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            <Separator />

                            <div className="flex justify-between items-center pt-2">
                                <span className="font-bold">Total Investment</span>
                                <span className="font-bold text-xl text-emerald-600">${totalValue.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
