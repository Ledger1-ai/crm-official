"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, Title, DonutChart, BarChart, Text, Flex, Badge, Grid, Metric, ProgressBar } from "@tremor/react";
import {
    Activity,
    Database,
    ShieldAlert,
    Zap,
    Mail,
    Phone,
    Smartphone,
    Globe,
    Filter,
    ArrowUpRight,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLEANLINESS_DATA = [
    { name: "Verified", value: 68, color: "emerald" },
    { name: "Enriched", value: 20, color: "blue" },
    { name: "Raw", value: 12, color: "amber" },
];

const ENRICHMENT_STATS = [
    { name: "Emails", "Match Rate": 92 },
    { name: "Phones", "Match Rate": 78 },
    { name: "Socials", "Match Rate": 65 },
    { name: "Tech Stack", "Match Rate": 45 },
    { name: "Revenue", "Match Rate": 82 },
];

const MISSING_FIELDS = [
    { name: "Job Title", value: 15, color: "rose" },
    { name: "Company Size", value: 25, color: "orange" },
    { name: "Industry", value: 10, color: "cyan" },
    { name: "Direct Dial", value: 50, color: "amber" },
];

export default function DataHealthDashboard() {
    return (
        <div className="space-y-6">
            {/* Header / Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Cleanliness Score"
                    metric="88%"
                    subtext="+2.4% from last week"
                    icon={Database}
                    color="text-emerald-400"
                />
                <MetricCard
                    title="Enrichment Level"
                    metric="High"
                    subtext="8,400 enriched profiles"
                    icon={Zap}
                    color="text-blue-400"
                />
                <MetricCard
                    title="Verified Leads"
                    metric="92.1%"
                    subtext="1.2k new verified"
                    icon={Activity}
                    color="text-violet-400"
                />
                <MetricCard
                    title="Data Alerts"
                    metric="3"
                    subtext="Requires intervention"
                    icon={ShieldAlert}
                    color="text-rose-400"
                />
            </div>

            <Grid numItemsLg={3} className="gap-6">
                {/* Cleanliness Breakdown */}
                <Card className="bg-card border-border ring-0 shadow-sm">
                    <Title className="text-foreground">Cleanliness Breakdown</Title>
                    <DonutChart
                        className="h-64 mt-4"
                        data={CLEANLINESS_DATA}
                        category="value"
                        index="name"
                        colors={["emerald", "blue", "amber"]}
                        showAnimation={true}
                    />
                    <div className="mt-4 space-y-2">
                        {CLEANLINESS_DATA.map((item) => (
                            <Flex key={item.name} className="text-sm">
                                <Text className="text-muted-foreground flex items-center gap-2">
                                    <span className={cn("w-2 h-2 rounded-full", `bg-${item.color}-500`)} />
                                    {item.name}
                                </Text>
                                <Text className="font-medium text-foreground">{item.value}%</Text>
                            </Flex>
                        ))}
                    </div>
                </Card>

                {/* Enrichment Match Rates */}
                <Card className="bg-card border-border ring-0 shadow-sm lg:col-span-2">
                    <Title className="text-foreground">Enrichment Match Rates</Title>
                    <BarChart
                        className="h-64 mt-4"
                        data={ENRICHMENT_STATS}
                        index="name"
                        categories={["Match Rate"]}
                        colors={["blue"]}
                        valueFormatter={(number: number) => `${number}%`}
                        showAnimation={true}
                    />
                    <div className="mt-6">
                        <Text className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-4">Priority Actions</Text>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-emerald-400" />
                                    <Text className="text-sm">Email Validation Complete</Text>
                                </div>
                                <Badge color="emerald">Ready</Badge>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center justify-between transition-colors hover:bg-amber-500/10 cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-4 h-4 text-amber-400" />
                                    <Text className="text-sm">Improve Mobile Coverage</Text>
                                </div>
                                <Badge color="amber" className="group-hover:bg-amber-500 group-hover:text-black">Boost</Badge>
                            </div>
                        </div>
                    </div>
                </Card>
            </Grid>

            <Grid numItemsLg={2} className="gap-6">
                {/* Missing Data Heatmap (Conceptual) */}
                <Card className="bg-card border-border ring-0 shadow-sm relative overflow-hidden">
                    <Title className="text-foreground mb-6">Critical Data Gaps</Title>
                    <div className="space-y-6">
                        {MISSING_FIELDS.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <Flex className="text-sm">
                                    <Text className="font-medium text-gray-300">{field.name}</Text>
                                    <Text className="text-rose-400 font-bold">{field.value}% Missing</Text>
                                </Flex>
                                <ProgressBar value={field.value} color={field.color as any} className="mt-2" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <Flex>
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-blue-400 animate-pulse" />
                                <div>
                                    <Text className="font-bold text-blue-400">AI Auto-Enrich Available</Text>
                                    <Text className="text-xs text-muted-foreground">Fill 85% of these gaps with one click.</Text>
                                </div>
                            </div>
                            <Badge color="blue" className="cursor-pointer hover:bg-blue-500 hover:text-white transition-colors">Apply Now</Badge>
                        </Flex>
                    </div>
                </Card>

                {/* Health Monitoring Log */}
                <Card className="bg-card border-border ring-0 shadow-sm">
                    <Title className="text-foreground">Recent Enrichment Activity</Title>
                    <div className="mt-4 space-y-4">
                        {[
                            {
                                event: "Bulk Enrichment",
                                detail: "2,400 leads enriched from Apollo source",
                                time: "2h ago",
                                icon: Search,
                                color: "blue"
                            },
                            {
                                event: "Deduplication",
                                detail: "142 duplicate contacts merged",
                                time: "5h ago",
                                icon: Filter,
                                color: "emerald"
                            },
                            {
                                event: "Format Normalization",
                                detail: "Phone numbers updated to E.164",
                                time: "12h ago",
                                icon: Phone,
                                color: "violet"
                            },
                            {
                                event: "Company Update",
                                detail: "Revenue data updated for 300 accounts",
                                time: "Yesterday",
                                icon: Globe,
                                color: "cyan"
                            }
                        ].map((log, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                                <div className={cn("p-2 rounded-lg bg-opacity-20", `bg-${log.color}-500`, `text-${log.color}-400`)}>
                                    <log.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <Flex className="mb-1">
                                        <Text className="font-bold text-sm text-gray-200">{log.event}</Text>
                                        <Text className="text-[10px] text-muted-foreground">{log.time}</Text>
                                    </Flex>
                                    <Text className="text-xs text-muted-foreground">{log.detail}</Text>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </Grid>
        </div>
    );
}

function MetricCard({ title, metric, subtext, icon: Icon, color }: { title: string, metric: string, subtext: string, icon: any, color: string }) {
    return (
        <Card className="bg-card border-border ring-0 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className={cn("w-12 h-12", color)} />
            </div>
            <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</Text>
            <Metric className={cn("font-black tracking-tight mb-1", color)}>{metric}</Metric>
            <Flex justifyContent="start" className="gap-1">
                <Text className="text-xs text-muted-foreground">{subtext}</Text>
            </Flex>
        </Card>
    );
}
