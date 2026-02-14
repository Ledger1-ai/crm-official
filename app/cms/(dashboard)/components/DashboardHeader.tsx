"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { ActiveUsersModal } from "@/components/cms/ActiveUsersModal";

interface DashboardHeaderProps {
    userName: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
    const [showActiveUsers, setShowActiveUsers] = useState(false);

    return (
        <div className="mb-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Welcome back, {userName}
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Manage your website content from here.
                    </p>
                </div>

                {/* Active Users Button - Kept dark */}
                <button
                    onClick={() => setShowActiveUsers(true)}
                    className="relative p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/5 transition-all group"
                    title="Active Users"
                >
                    <Users className="h-5 w-5 text-slate-400 group-hover:text-white" />
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-[#0A0A0B] animate-pulse" />
                </button>
            </div>

            {/* Status Banner - Matching Reference */}
            <div className="w-full bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-sm font-medium text-emerald-500">CMS is live and connected to your website.</span>
            </div>

            <ActiveUsersModal isOpen={showActiveUsers} onClose={() => setShowActiveUsers(false)} />
        </div>
    );
}
