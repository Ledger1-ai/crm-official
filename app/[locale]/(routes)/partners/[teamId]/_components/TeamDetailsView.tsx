"use client";

import React, { useState } from "react";
import { LayoutDashboard, Users, MessageSquare, Mail, Copy, Shield, Phone, AtSign } from "lucide-react";
import { toast } from "sonner";

import TeamSettingsForm from "./TeamSettingsForm";
import TeamMembersTable from "./TeamMembersTable";
import SmsConfigForm from "./SmsConfigForm";
import TeamRolesView from "./TeamRolesView";
import { TeamEmailSettings } from "@/components/email/TeamEmailSettings";
import { EmailDeliveryStats } from "@/components/email/EmailDeliveryStats";
import { TeamAiSettings } from "@/components/ai/TeamAiSettings";
import SystemResendConfig from "@/components/system/SystemResendConfig";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

type OwnerInfo = {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
} | null;

type Props = {
    team: any;
    availablePlans: any;
    currentUserInfo: any;
    systemResendData: {
        resendKeyId: string;
        envKey: string | undefined;
        dbKey: string | undefined;
    };
    ownerInfo?: OwnerInfo;
    roleCounts?: {
        owner: number;
        admin: number;
        member: number;
        viewer: number;
    };
    customRoles?: any[];
};

const TeamDetailsView = ({ team, availablePlans, currentUserInfo, systemResendData, ownerInfo, roleCounts, customRoles }: Props) => {
    const [activeTab, setActiveTab] = useState("overview");

    const cards = [
        {
            id: "overview",
            title: "Overview",
            description: "Manage team settings",
            icon: LayoutDashboard,
            color: "from-blue-500/20 to-indigo-500/20",
            iconColor: "text-blue-400",
        },
        {
            id: "members",
            title: "Members",
            description: "Manage team members",
            icon: Users,
            color: "from-emerald-500/20 to-green-500/20",
            iconColor: "text-emerald-400",
        },
    ];

    if (currentUserInfo?.isGlobalAdmin) {
        cards.push({
            id: "roles",
            title: "Roles & Modules",
            description: "View access control",
            icon: Shield,
            color: "from-violet-500/20 to-purple-500/20",
            iconColor: "text-violet-400",
        });

        cards.push({
            id: "sms-config",
            title: "SMS Config",
            description: "Configure SMS settings",
            icon: MessageSquare,
            color: "from-orange-500/20 to-red-500/20",
            iconColor: "text-orange-400",
        });

        cards.push({
            id: "email-config",
            title: "Email Config",
            description: "Manage sender identity",
            icon: Mail,
            color: "from-purple-500/20 to-pink-500/20",
            iconColor: "text-purple-400",
        });

        cards.push({
            id: "ai-config",
            title: "AI Config",
            description: "Manage AI models",
            icon: Bot,
            color: "from-indigo-500/20 to-purple-500/20",
            iconColor: "text-indigo-400",
        });
    }

    return (
        <div className="space-y-4">
            {/* Account Owner Contact Card */}
            {currentUserInfo?.isGlobalAdmin && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg border border-amber-500/30">
                    <div className="p-3 rounded-full bg-amber-500/20 text-amber-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">Account Owner</span>
                            <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                                Owner
                            </Badge>
                        </div>
                        {ownerInfo ? (
                            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{ownerInfo.name || "Unknown"}</span>
                                <div className="flex items-center gap-1">
                                    <AtSign className="w-3 h-3" />
                                    <a href={`mailto:${ownerInfo.email}`} className="hover:text-primary transition-colors">
                                        {ownerInfo.email}
                                    </a>
                                </div>
                                {ownerInfo.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        <a href={`tel:${ownerInfo.phone}`} className="hover:text-primary transition-colors">
                                            {ownerInfo.phone}
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-1">No owner assigned</p>
                        )}
                    </div>
                </div>
            )}

            {/* Unique Identifiers Header */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Team ID:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{team.id}</code>
                    <button
                        onClick={() => { navigator.clipboard.writeText(team.id); toast.success("Copied Team ID"); }}
                        className="hover:text-primary transition-colors"
                        title="Copy Team ID"
                    >
                        <Copy className="w-3 h-3" />
                    </button>
                </div>
                {team.stripe_customer_id && (
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">Stripe Customer:</span>
                        <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{team.stripe_customer_id}</code>
                        <button
                            onClick={() => { navigator.clipboard.writeText(team.stripe_customer_id); toast.success("Copied Stripe ID"); }}
                            className="hover:text-primary transition-colors"
                            title="Copy Stripe ID"
                        >
                            <Copy className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Slug:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{team.slug}</code>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {cards.map((card) => (
                    <div key={card.id} onClick={() => setActiveTab(card.id)} className="h-full">
                        <div className={`group relative overflow-hidden rounded-xl border p-4 md:p-6 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] text-left w-full h-full cursor-pointer ${activeTab === card.id ? "border-primary/50 bg-white/10 ring-2 ring-primary/30" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} ${activeTab === card.id ? 'opacity-100' : 'opacity-20 group-hover:opacity-60'} transition-opacity duration-300`} />
                            <div className="relative z-10 flex flex-col items-center justify-center space-y-2 text-center h-full">
                                <div className={`p-3 rounded-full bg-gradient-to-br ${card.color} border border-white/10 shadow-lg group-hover:scale-110 transition-transform duration-300 ${card.iconColor} ring-1 ring-white/20 group-hover:ring-white/40`}>
                                    <card.icon className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="block text-sm md:text-lg font-medium text-foreground group-hover:text-white transition-colors">
                                        {card.title}
                                    </span>
                                    <span className="block text-[10px] md:text-xs text-muted-foreground group-hover:text-white/80 transition-colors">
                                        {card.description}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Separator />

            <div className="mt-4">
                {activeTab === "overview" && (
                    <TeamSettingsForm team={team} availablePlans={availablePlans} />
                )}
                {activeTab === "members" && (
                    <TeamMembersTable
                        teamId={team.id}
                        teamSlug={team.slug}
                        members={team.members}
                        isSuperAdmin={currentUserInfo?.isGlobalAdmin}
                        ownerId={team.owner_id}
                    />
                )}
                {activeTab === "roles" && currentUserInfo?.isGlobalAdmin && roleCounts && (
                    <TeamRolesView
                        teamId={team.id}
                        roleCounts={roleCounts}
                        customRoles={customRoles || []}
                    />
                )}
                {activeTab === "sms-config" && currentUserInfo?.isGlobalAdmin && (
                    <SmsConfigForm teamId={team.id} teamName={team.name} />
                )}
                {activeTab === "email-config" && currentUserInfo?.isGlobalAdmin && (
                    <div className="space-y-6">
                        {/* System Resend Config (Global) - Visible to Super Admin */}
                        <div className="bg-card border rounded-lg p-6">
                            <h4 className="text-sm font-medium mb-4">System Resend Key (Global)</h4>
                            <SystemResendConfig {...systemResendData} />
                        </div>
                        <TeamEmailSettings teamId={team.id} />
                        <EmailDeliveryStats teamId={team.id} />
                    </div>
                )}
                {activeTab === "ai-config" && currentUserInfo?.isGlobalAdmin && (
                    <div className="bg-card border rounded-lg p-6">
                        <TeamAiSettings teamId={team.id} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetailsView;

