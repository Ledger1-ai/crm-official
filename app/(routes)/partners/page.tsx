import React, { Suspense } from "react";
import Container from "@/app/(routes)/components/ui/Container";

import { getTeams } from "@/actions/teams/get-teams";
import { getPlans } from "@/actions/plans/plan-actions";
import PartnersView from "./_components/PartnersView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import Link from "next/link";
import { PartnersNavigation } from "./_components/PartnersNavigation";

import { getAllSubscriptions } from "@/actions/billing/get-all-subscriptions";
import { getAllBillingInvoices } from "@/actions/billing/get-team-billing-invoices";
import { BillingHistoryView } from "./_components/BillingHistoryView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users as UsersIcon, History, CheckCircle2 } from "lucide-react";

const PartnersPage = async () => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return redirect("/");
    }

    const user = await (prismadb.users as any).findUnique({
        where: { id: session.user.id },
        include: { assigned_team: true }
    });

    if (!user) {
        return redirect("/");
    }

    const isInternalTeam = user.assigned_team?.slug === "ledger1" || user.assigned_team?.slug === "basalt" || user.assigned_team?.slug === "basalthq";
    const isAdmin = user.is_admin;

    if (!isAdmin && !isInternalTeam) {
        return redirect("/");
    }

    const [teams, plans, subscriptions, billingInvoices] = await Promise.all([
        getTeams(),
        getPlans(),
        getAllSubscriptions(),
        getAllBillingInvoices()
    ]);

    // Calculate total users from actual team members to ensure consistency
    const uniqueUserIds = new Set<string>();
    (teams as any[]).forEach(team => {
        team.members.forEach((member: any) => {
            if (member.id) uniqueUserIds.add(member.id);
        });
    });
    const totalUsers = uniqueUserIds.size;

    const activeTeamsCount = (teams as any[]).filter(t => t.status === 'ACTIVE').length;
    const totalTeamsCount = (teams as any[]).length;

    return (
        <Container
            title="Platform"
            description="Manage your Teams and CRM Instances"
        >
            <div className="p-4 space-y-6">
                <PartnersNavigation availablePlans={plans as any} />

                {/* Global Stats Row - Billboard Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-5 transition-all duration-300 hover:border-white/10">
                        <UsersIcon className="absolute -right-4 -bottom-4 w-24 h-24 -rotate-12 opacity-5 text-white pointer-events-none transition-transform duration-500 group-hover:scale-110" />
                        <div className="relative z-10">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Total Teams</div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-bold text-white tracking-tighter">{totalTeamsCount}</div>
                                <div className="text-xs text-zinc-500 font-medium pb-1.5">Registered</div>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-5 transition-all duration-300 hover:border-white/10">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 -rotate-12 opacity-5 text-green-500 pointer-events-none transition-transform duration-500 group-hover:scale-110">
                            <CheckCircle2 className="w-full h-full" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Active Teams</div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-bold text-green-500 tracking-tighter">{activeTeamsCount}</div>
                                <div className="text-xs text-green-500/60 font-medium pb-1.5">Live Now</div>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-5 transition-all duration-300 hover:border-white/10">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 -rotate-12 opacity-5 text-indigo-500 pointer-events-none transition-transform duration-500 group-hover:scale-110">
                            <UsersIcon className="w-full h-full" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Platform Users</div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-bold text-indigo-400 tracking-tighter">{totalUsers}</div>
                                <div className="text-xs text-indigo-400/60 font-medium pb-1.5">Unique ID's</div>
                            </div>
                        </div>
                    </div>
                </div>


                <Tabs defaultValue="teams" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
                            <TabsTrigger value="teams" className="gap-2 data-[state=active]:bg-zinc-800">
                                <UsersIcon className="w-4 h-4" />
                                Teams
                            </TabsTrigger>
                            <TabsTrigger value="billing" className="gap-2 data-[state=active]:bg-zinc-800">
                                <History className="w-4 h-4" />
                                Billing History
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="teams" className="mt-0 space-y-4">
                        <Suspense fallback={<div className="h-96 w-full bg-zinc-900/50 animate-pulse rounded-2xl" />}>
                            <PartnersView initialTeams={teams as any} availablePlans={plans as any} />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="billing" className="mt-0">
                        <BillingHistoryView subscriptions={subscriptions} invoices={billingInvoices} />
                    </TabsContent>
                </Tabs>
            </div>
        </Container>
    );
};

export default PartnersPage;
