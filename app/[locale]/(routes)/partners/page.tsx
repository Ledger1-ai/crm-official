import React, { Suspense } from "react";
import Container from "@/app/[locale]/(routes)/components/ui/Container";

import { getTeams } from "@/actions/teams/get-teams";
import { getPlans } from "@/actions/plans/plan-actions";
import PartnersView from "./_components/PartnersView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import Link from "next/link";
import { Key, DollarSign } from "lucide-react";

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

    const isInternalTeam = user.assigned_team?.slug === "ledger1";
    const isAdmin = user.is_admin;

    if (!isAdmin && !isInternalTeam) {
        return redirect("/");
    }

    const [teams, plans] = await Promise.all([
        getTeams(),
        getPlans()
    ]);

    const cards = [
        {
            title: "System Keys",
            description: "Manage AI system keys & defaults",
            icon: Key,
            color: "from-cyan-500/20 to-blue-500/20",
            iconColor: "text-cyan-400",
            href: "/partners/ai-system-config"
        },
        {
            title: "Model Pricing",
            description: "Configure AI model pricing",
            icon: DollarSign,
            color: "from-emerald-500/20 to-green-500/20",
            iconColor: "text-emerald-400",
            href: "/partners/ai-pricing"
        }
    ];

    const CardContent = ({ card }: { card: any }) => (
        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 md:p-6 hover:bg-white/10 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] text-left w-full h-full cursor-pointer">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-20 group-hover:opacity-60 transition-opacity duration-300`} />
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
    );

    return (
        <Container
            title="Partners"
            description="Manage your Teams and CRM Instances"
            sticky
        >
            <div className="p-4 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 flex-shrink-0">
                    {cards.map((card, index) => (
                        <Link key={index} href={card.href} className="block h-full">
                            <CardContent card={card} />
                        </Link>
                    ))}
                </div>


                <Suspense fallback={<div>Loading teams...</div>}>
                    <PartnersView initialTeams={teams as any} availablePlans={plans as any} />
                </Suspense>
            </div>
        </Container>
    );
};

export default PartnersPage;
