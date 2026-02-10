
"use client";

import React from "react";
import Link from "next/link";
import { Key, DollarSign, List, ChevronLeft, Mail } from "lucide-react";
import { NavigationCard } from "./NavigationCard";
import { CreateTeamCard } from "./CreateTeamCard";
import { SeedTeamCard } from "./SeedTeamCard";
import { Button } from "@/components/ui/button";

type PartnersNavigationProps = {
    availablePlans?: any[];
    showBackButton?: boolean;
    hideCreateTeam?: boolean;
    hideSystemKeys?: boolean;
    hideModelPricing?: boolean;
    hideManagePlans?: boolean;
};

export const PartnersNavigation = ({
    availablePlans = [],
    showBackButton = false,
    hideCreateTeam = false,
    hideSystemKeys = false,
    hideModelPricing = false,
    hideManagePlans = false
}: PartnersNavigationProps) => {
    const cards = [
        {
            key: 'system-keys',
            title: "System Keys",
            description: "Manage AI system keys & defaults",
            icon: Key,
            color: "from-cyan-500/20 to-blue-500/20",
            iconColor: "text-cyan-400",
            href: "/partners/ai-system-config",
            hidden: hideSystemKeys
        },
        {
            key: 'model-pricing',
            title: "Model Pricing",
            description: "Configure AI model pricing",
            icon: DollarSign,
            color: "from-emerald-500/20 to-green-500/20",
            iconColor: "text-emerald-400",
            href: "/partners/ai-pricing",
            hidden: hideModelPricing
        },
        {
            key: 'system-email',
            title: "System Email",
            description: "Manage global email config",
            icon: Mail,
            color: "from-blue-500/20 to-indigo-500/20",
            iconColor: "text-blue-400",
            href: "/partners/email-system-config",
            hidden: hideSystemKeys
        },
        {
            key: 'manage-plans',
            title: "Manage Plans",
            description: "Configure subscription plans",
            icon: List,
            color: "from-purple-500/20 to-pink-500/20",
            iconColor: "text-purple-400",
            href: "/partners/plans",
            hidden: hideManagePlans
        }
    ];

    const visibleCards = cards.filter(card => !card.hidden);

    return (
        <div className="flex flex-col gap-4 mb-3 flex-shrink-0">
            {showBackButton && (
                <div>
                    <Link href="/partners">
                        <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Platform
                        </Button>
                    </Link>
                </div>
            )}

            {(visibleCards.length > 0 || !hideCreateTeam) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                    {!hideCreateTeam && <CreateTeamCard availablePlans={availablePlans} />}
                    {!hideCreateTeam && <SeedTeamCard />}
                    {visibleCards.map((card) => (
                        <Link key={card.key} href={card.href} className="block h-full">
                            <NavigationCard card={card} />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};
