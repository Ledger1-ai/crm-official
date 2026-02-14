"use client";

import React from "react";
import { useSalesCommand } from "./SalesCommandProvider";
import TeamAnalytics from "../../dashboard/_components/TeamAnalytics";
import { motion } from "framer-motion";

export default function TeamCommandView() {
    const { data, handleUserSelect, isMember } = useSalesCommand();
    const { teamData } = data;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Team Command Center</h2>
                    <p className="text-sm text-muted-foreground">Aggregate performance and leaderboards.</p>
                </div>
            </div>

            {/* Reuse the existing robust component */}
            <TeamAnalytics
                team={teamData.team as any}
                leaderboard={teamData.leaderboard as any}
                weights={teamData.weights as any}

                onUserSelect={handleUserSelect}
                isMember={isMember}
            />
        </motion.div>
    );
}
