"use client";

import React, { useState } from "react";
import { LayoutDashboard, Users, MessageSquare, Mail, Copy, Shield, Phone, AtSign, Building2 } from "lucide-react";
import { toast } from "sonner";

import TeamSettingsForm from "./TeamSettingsForm";
import TeamMembersTable from "./TeamMembersTable";
import SmsConfigForm from "./SmsConfigForm";
import TeamRolesView from "./TeamRolesView";
import DepartmentsView from "./DepartmentsView";
import { TeamEmailSettings } from "@/components/email/TeamEmailSettings";
import { EmailDeliveryStats } from "@/components/email/EmailDeliveryStats";
import { TeamAiSettings } from "@/components/ai/TeamAiSettings";
import SystemResendConfig from "@/components/system/SystemResendConfig";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

import { NavigationCard } from "../../_components/NavigationCard";

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
    departments?: any[];
};

const TeamDetailsView = ({ team, availablePlans, currentUserInfo, systemResendData, ownerInfo, roleCounts, customRoles, departments }: Props) => {
    const [activeTab, setActiveTab] = useState("overview");

    const isOrgAdmin = currentUserInfo?.isGlobalAdmin || (
        currentUserInfo?.teamId === team.id &&
        (currentUserInfo?.teamRole === 'SUPER_ADMIN' || currentUserInfo?.teamRole === 'OWNER')
    );

    const cards = [
        {
            id: "overview",
            title: "Settings",
            description: "Team profile",
            icon: LayoutDashboard,
            color: "from-blue-500/20 to-indigo-500/20",
            iconColor: "text-blue-500",
        },
        {
            id: "members",
            title: "Members",
            description: "User directory",
            icon: Users,
            color: "from-emerald-500/20 to-green-500/20",
            iconColor: "text-emerald-500",
        },
    ];

    if (isOrgAdmin) {
        cards.push({
            id: "departments",
            title: "Business",
            description: "Departments",
            icon: Building2,
            color: "from-cyan-500/20 to-teal-500/20",
            iconColor: "text-cyan-500",
        });

        cards.push({
            id: "roles",
            title: "Security",
            description: "Permissions",
            icon: Shield,
            color: "from-violet-500/20 to-purple-500/20",
            iconColor: "text-violet-500",
        });

        cards.push({
            id: "sms-config",
            title: "SMS Hub",
            description: "SMS gateway",
            icon: MessageSquare,
            color: "from-orange-500/20 to-red-500/20",
            iconColor: "text-orange-500",
        });

        cards.push({
            id: "email-config",
            title: "Email Hub",
            description: "Mail identity",
            icon: Mail,
            color: "from-purple-500/20 to-pink-500/20",
            iconColor: "text-purple-500",
        });

        cards.push({
            id: "ai-config",
            title: "AI Hub",
            description: "Model config",
            icon: Bot,
            color: "from-indigo-500/20 to-purple-500/20",
            iconColor: "text-indigo-500",
        });
    }


    return (
        <div className="space-y-4">
            {/* Compact Header: Owner & Identifiers combined */}
            <div className="flex flex-col md:flex-row gap-4">
                {currentUserInfo?.isGlobalAdmin && (
                    <div className="flex-[2] flex items-center gap-2.5 p-2 bg-zinc-900/40 rounded-xl border border-white/5 h-[52px]">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500/80">
                            <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 leading-none">Account Owner</span>
                            </div>
                            {ownerInfo ? (
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[13px]">
                                    <span className="font-bold text-foreground truncate">{ownerInfo.name || "Unknown"}</span>
                                    <div className="flex items-center gap-1.5 text-muted-foreground/50">
                                        <AtSign className="w-3 h-3" />
                                        <a href={`mailto:${ownerInfo.email}`} className="hover:text-amber-500 transition-colors truncate">
                                            {ownerInfo.email}
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] text-muted-foreground mt-0.5 lowercase italic opacity-50">No owner assigned</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-x-10 gap-y-2 px-6 bg-zinc-900/40 rounded-xl border border-white/5 text-[10px] flex-[3] h-[52px]">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] leading-none">Team ID</span>
                        <div className="flex items-center gap-2">
                            <code className="bg-white/5 px-2 py-1 rounded font-mono text-zinc-400 text-[11px]">{team.id}</code>
                            <button
                                onClick={() => { navigator.clipboard.writeText(team.id); toast.success("Copied Team ID"); }}
                                className="text-muted-foreground/30 hover:text-white transition-colors"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    {team.stripe_customer_id && (
                        <div className="flex items-center gap-3 border-l border-white/5 pl-10">
                            <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] leading-none">Stripe</span>
                            <div className="flex items-center gap-2">
                                <code className="bg-white/5 px-2 py-1 rounded font-mono text-zinc-400 text-[11px]">{team.stripe_customer_id}</code>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(team.stripe_customer_id); toast.success("Copied Stripe ID"); }}
                                    className="text-muted-foreground/30 hover:text-white transition-colors"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 border-l border-white/5 pl-10">
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] leading-none">Slug</span>
                        <Badge variant="outline" className="font-mono bg-white/5 text-zinc-500 border-white/5 px-2 py-0.5 text-[10px]">
                            {team.slug}
                        </Badge>
                    </div>
                </div>


            </div>


            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                {cards.map((card) => (
                    <NavigationCard
                        key={card.id}
                        card={card as any}
                        isActive={activeTab === card.id}
                        onClick={() => setActiveTab(card.id)}
                    />
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
                        isSuperAdmin={isOrgAdmin}
                        ownerId={team.owner_id}
                    />
                )}
                {activeTab === "roles" && isOrgAdmin && roleCounts && (
                    <TeamRolesView
                        teamId={team.id}
                        roleCounts={roleCounts}
                        customRoles={customRoles || []}
                    />
                )}
                {activeTab === "departments" && isOrgAdmin && (
                    <DepartmentsView
                        teamId={team.id}
                        departments={departments || []}
                        isSuperAdmin={isOrgAdmin}
                    />
                )}
                {activeTab === "sms-config" && isOrgAdmin && (
                    <SmsConfigForm teamId={team.id} teamName={team.name} />
                )}
                {activeTab === "email-config" && isOrgAdmin && (
                    <div className="space-y-6">
                        {/* System Resend Config (Global) - Visible to Super Admin */}
                        {currentUserInfo?.isGlobalAdmin && (
                            <div className="bg-card border rounded-lg p-6">
                                <h4 className="text-sm font-medium mb-4">System Resend Key (Global)</h4>
                                <SystemResendConfig {...systemResendData} />
                            </div>
                        )}
                        <TeamEmailSettings teamId={team.id} />
                        <EmailDeliveryStats teamId={team.id} />
                    </div>
                )}
                {activeTab === "ai-config" && isOrgAdmin && (
                    <div className="bg-card border rounded-lg p-6">
                        <TeamAiSettings teamId={team.id} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetailsView;

