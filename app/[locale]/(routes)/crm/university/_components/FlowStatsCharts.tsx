"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, Title, DonutChart, BarChart, AreaChart } from "@tremor/react";
import { cn } from "@/lib/utils";

// Stage data for visualization
const PIPELINE_STAGE_DATA = [
    { name: "Identify", value: 30, color: "sky" },
    { name: "Engage AI", value: 25, color: "blue" },
    { name: "Engage Human", value: 20, color: "indigo" },
    { name: "Offering", value: 12, color: "violet" },
    { name: "Finalizing", value: 8, color: "pink" },
    { name: "Closed", value: 5, color: "emerald" },
];

const CONVERSION_DATA = [
    { name: "Lead → Contact", rate: 85 },
    { name: "Contact → Account", rate: 45 },
    { name: "Account → Opportunity", rate: 60 },
    { name: "Opportunity → Contract", rate: 35 },
];

const OUTREACH_TREND = [
    { date: "Week 1", Emails: 120, SMS: 45, Calls: 30 },
    { date: "Week 2", Emails: 145, SMS: 52, Calls: 38 },
    { date: "Week 3", Emails: 180, SMS: 68, Calls: 42 },
    { date: "Week 4", Emails: 165, SMS: 75, Calls: 55 },
];

const valueFormatter = (number: number) =>
    Intl.NumberFormat("en-US").format(number).toString();

const percentFormatter = (number: number) => `${number}%`;

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
    delay?: number;
    className?: string;
}

function ChartCard({ title, children, delay = 0, className }: ChartCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <Card className={cn("rounded-xl", className)}>
                <Title className="text-sm font-semibold mb-4">{title}</Title>
                {children}
            </Card>
        </motion.div>
    );
}

export function PipelineDistributionChart() {
    return (
        <ChartCard title="Pipeline Stage Distribution" delay={0}>
            <DonutChart
                className="h-48"
                data={PIPELINE_STAGE_DATA}
                category="value"
                index="name"
                colors={["sky", "blue", "indigo", "violet", "pink", "emerald"]}
                valueFormatter={valueFormatter}
                showAnimation={true}
            />
        </ChartCard>
    );
}

export function ConversionRatesChart() {
    return (
        <ChartCard title="Conversion Rates" delay={0.1}>
            <BarChart
                className="h-48"
                data={CONVERSION_DATA}
                index="name"
                categories={["rate"]}
                colors={["blue"]}
                valueFormatter={percentFormatter}
                showAnimation={true}
            />
        </ChartCard>
    );
}

export function OutreachTrendChart() {
    return (
        <ChartCard title="Outreach Activity Trend" delay={0.2}>
            <AreaChart
                className="h-48"
                data={OUTREACH_TREND}
                index="date"
                categories={["Emails", "SMS", "Calls"]}
                colors={["blue", "emerald", "violet"]}
                valueFormatter={valueFormatter}
                showAnimation={true}
            />
        </ChartCard>
    );
}

export default function FlowStatsCharts() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PipelineDistributionChart />
            <ConversionRatesChart />
            <OutreachTrendChart />
        </div>
    );
}
