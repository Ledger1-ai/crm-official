"use client";

import React from "react";
import { Calendar } from "lucide-react";
import DashboardCard from "../DashboardCard"; // Correct relative import to parent
import { useRouter } from "next/navigation";

// --- MY SCHEDULE WIDGET ---
export const MyScheduleWidget = ({ eventsCount = 0 }: { eventsCount?: number }) => {
    const router = useRouter();
    return (
        <DashboardCard
            icon={Calendar}
            label="My Schedule"
            count={eventsCount}
            description="Upcoming meetings"
            variant="info" // Use a distinct color variant if available, or fallback to something like 'violet' or 'info'
            onClick={() => router.push("/crm/calendar")}
            className="cursor-pointer hover:ring-1 hover:ring-blue-500/50 h-full"
        />
    );
};
