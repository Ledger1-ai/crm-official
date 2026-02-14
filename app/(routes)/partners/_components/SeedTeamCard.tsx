"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { seedInternalTeam } from "@/actions/teams/seed-team";
import { NavigationCard, NavigationCardData } from "./NavigationCard";

export const SeedTeamCard = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSeed = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isLoading) return;

        try {
            setIsLoading(true);
            const res = await seedInternalTeam();
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`BasaltHQ Team Seeded! Updated ${res.count} users.`);
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to seed");
        } finally {
            setIsLoading(false);
        }
    };

    const cardData: NavigationCardData = {
        title: "Internal Hub",
        description: "Seed BasaltHQ",
        icon: Lock,
        color: "from-amber-500/20 to-orange-500/20",
        iconColor: "text-amber-500"
    };

    return (
        <div
            onClick={handleSeed}
            className={`h-full w-full ${isLoading ? 'opacity-70 pointer-events-none cursor-wait' : ''}`}
        >
            <NavigationCard card={cardData} />
        </div>
    );
};
