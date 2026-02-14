"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users2, Activity } from "lucide-react";
import DashboardCard from "../DashboardCard";
import { useRouter } from "next/navigation";
import { getRevenueSparkline } from "@/actions/dashboard/get-revenue-sparkline";
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// --- REVENUE WIDGET ---
export const RevenueWidget = ({ revenue }: { revenue: number }) => {
    const router = useRouter();
    const [sparklineData, setSparklineData] = useState<any[]>([]);

    useEffect(() => {
        const fetchSparkline = async () => {
            const data = await getRevenueSparkline();
            setSparklineData(data.map((v, i) => ({ value: v, id: i })));
        };
        fetchSparkline();
    }, []);

    return (
        <DashboardCard
            icon={DollarSign}
            label="Expected Revenue"
            count={revenue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
            description="From open opportunities"
            variant="success"
            hideIcon={true}
            onClick={() => router.push("/crm/opportunities")}
            className="cursor-pointer hover:ring-1 hover:ring-emerald-500/50 h-full overflow-hidden"
        >
            {sparklineData.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </DashboardCard>
    );
};

// --- ACTIVE PIPELINE WIDGET ---
export const ActivePipelineWidget = ({ count, description }: { count: number; description: string }) => {
    const router = useRouter();
    return (
        <DashboardCard
            icon={TrendingUp}
            label="Active Pipeline"
            count={count}
            description={description}
            variant="info"
            onClick={() => router.push("/crm/opportunities")}
            className="cursor-pointer hover:ring-1 hover:ring-cyan-500/50 h-full"
        />
    );
};

// --- ACTIVE USERS WIDGET ---
export const ActiveUsersWidget = ({ count }: { count: number }) => {
    const router = useRouter();
    return (
        <DashboardCard
            icon={Users2}
            label="Active Users"
            count={count}
            description="Team members active"
            variant="violet"
            onClick={() => router.push("/settings/team")}
            className="cursor-pointer hover:ring-1 hover:ring-violet-500/50 h-full"
        />
    );
};

// --- SYSTEM HEALTH WIDGET ---
export const SystemHealthWidget = () => {
    const router = useRouter();
    return (
        <DashboardCard
            icon={Activity}
            label="System Health"
            count="98%"
            description="Operational"
            variant="warning"
            onClick={() => router.push("/partners/plans")}
            className="cursor-pointer hover:ring-1 hover:ring-amber-500/50 h-full"
        />
    );
};
