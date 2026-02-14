"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Network,
    Share2,
    Zap,
    ShieldCheck,
    Globe,
    Mail,
    Smartphone,
    CreditCard,
    Bot
} from "lucide-react";
import { MermaidDiagram } from "./MermaidDiagram";
import { cn } from "@/lib/utils";

const ECOSYSTEM_CHART = `
%%{init: {'flowchart': {'nodeSpacing': 30, 'rankSpacing': 250, 'curve': 'basis'}}}%%
graph LR
    subgraph Communications
        AWS["<b>AWS Connect</b><br/>SES & Voice"]
        Gmail["<b>Google</b><br/>Workspace"]
        Outlook["<b>Microsoft</b><br/>Office 365"]
    end

    subgraph Intelligence
        OAI["<b>OpenAI</b><br/>DeepSeek"]
        Anth["<b>Anthropic</b><br/>Claude"]
    end

    BCRM["<b>Basalt Engine</b>"]

    subgraph Core
        DB[(<b>MongoDB</b>)]
    end

    subgraph Identity
        Kinde["<b>Kinde</b><br/>Auth"]
    end

    subgraph Payments
        Surge["<b>SURGE</b><br/>Infrastructure"]
    end

    Communications <--> BCRM
    Intelligence <--> BCRM
    BCRM <--> Core
    BCRM --- Identity
    BCRM <--> Payments

    click Surge "https://surge.basalthq.com" _blank

    style Core fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style Intelligence fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style Communications fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fff
    style Identity fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
    style Payments fill:#14532d,stroke:#22c55e,stroke-width:2px,color:#fff
    style BCRM fill:#1e293b,stroke:#fff,stroke-width:3px,color:#fff
`;

const ECOSYSTEM_MOBILE = `
%%{init: {'flowchart': {'nodeSpacing': 40, 'rankSpacing': 60, 'curve': 'basis'}}}%%
graph TD
    BCRM["<b>Basalt Engine</b>"]
    
    subgraph Storage
        DB[(<b>MongoDB</b>)]
    end
    
    subgraph Services
        AI["<b>AI Intelligence</b>"]
        SES["<b>Communications</b>"]
        Pay["<b>Payments</b>"]
    end

    subgraph Security
        Kinde["<b>Identity</b>"]
    end

    BCRM <--> Storage
    BCRM <--> Security
    BCRM <--> Services
    
    style BCRM fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
    style AI fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style SES fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fff
    style Pay fill:#14532d,stroke:#22c55e,stroke-width:2px,color:#fff
    style Kinde fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
    style DB fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
`;

const DATA_FLOW_CHART = `
%%{init: {'flowchart': {'nodeSpacing': 50, 'rankSpacing': 180, 'curve': 'basis'}}}%%
graph LR
    User["User Interaction"] -- Event --> API["API / GraphQL"]
    API -- Action --> Server["Server Action"]
    
    Server -- Trigger --> Webhook["Webhook Trigger"]
    Server -- Push --> Notify["Notification"]
    
    Webhook -- POST --> Ext["External System"]
    Notify -- Pusher --> Client["Real-time UI"]

    style User fill:#1e3a5f,stroke:#3b82f6,color:#fff
    style API fill:#0f172a,stroke:#94a3b8
    style Server fill:#0f172a,stroke:#94a3b8
    style Webhook fill:#0f172a,stroke:#94a3b8
    style Notify fill:#0f172a,stroke:#94a3b8
    style Ext fill:#450a0a,stroke:#ef4444,color:#fff
    style Client fill:#064e3b,stroke:#10b981,color:#fff
`;

const DATA_FLOW_MOBILE = `
%%{init: {'flowchart': {'nodeSpacing': 40, 'rankSpacing': 80, 'curve': 'basis'}}}%%
graph TD
    User["User"] --> API["API"]
    API --> Server["Server"]
    
    subgraph Outputs
        Webhook["Webhook"]
        Notify["Notify"]
    end

    Server --> Webhook
    Server --> Notify
    Webhook --> Ext["External"]
    Notify --> Client["Real-time"]

    style User fill:#1e3a5f,stroke:#3b82f6
    style Ext fill:#450a0a,stroke:#ef4444
    style Client fill:#064e3b,stroke:#10b981
`;

export default function IntegrationBlueprints() {
    const integrations = [
        {
            name: "AWS Connect",
            category: "Voice & SMS",
            icon: Smartphone,
            description: "Powers high-concurrency telephony and 10DLC compliant SMS.",
            status: "Native",
            color: "text-orange-400",
            borderColor: "border-orange-500/20"
        },
        {
            name: "SURGE",
            category: "Payments",
            icon: CreditCard,
            description: "High-performance payment infrastructure for modern commerce.",
            status: "Native",
            color: "text-emerald-400",
            borderColor: "border-emerald-500/20"
        },
        {
            name: "OpenAI",
            category: "Intelligence",
            icon: Bot,
            description: "Propels our AI Agents, Smart Chat, and Sequence personalization.",
            status: "Native",
            color: "text-emerald-400",
            borderColor: "border-emerald-500/20"
        },
        {
            name: "Gmail / Outlook",
            category: "Productivity",
            icon: Mail,
            description: "Full two-way sync for emails, contacts, and calendar events.",
            status: "OAuth2",
            color: "text-red-400",
            borderColor: "border-red-500/20"
        }
    ];

    return (
        <div className="space-y-8 pb-32">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Network className="w-6 h-6 text-violet-400" />
                        System Architecture & Blueprints
                    </h2>
                    <p className="text-gray-400 text-sm">Visualizing the BasaltCRM ecosystem and data integrations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-violet-500/5 border-violet-500/20 text-violet-400">API-First</Badge>
                    <Badge variant="outline" className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400">Real-time</Badge>
                </div>
            </div>

            <div className="flex flex-col gap-10">
                {/* Ecosystem Overview */}
                <Card className="bg-card border-white/10 overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-black flex items-center gap-3">
                                    <Share2 className="w-7 h-7 text-blue-400" />
                                    Integration Ecosystem
                                </CardTitle>
                                <CardDescription className="text-sm font-medium">Comprehensive map of how BasaltCRM connects to the global infrastructure.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 font-black text-[10px] tracking-widest uppercase">Infrastructure</Badge>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 font-black text-[10px] tracking-widest uppercase">Scalable</Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-black/40">
                        <div className="w-full h-fit overflow-hidden flex justify-center py-4">
                            <MermaidDiagram chart={ECOSYSTEM_CHART} mobileChart={ECOSYSTEM_MOBILE} compact className="w-full" />
                        </div>
                    </CardContent>
                </Card>

                {/* Data Flow Blueprint */}
                <Card className="bg-card border-white/10 overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle className="text-2xl font-black flex items-center gap-3">
                                    <Zap className="w-7 h-7 text-emerald-400" />
                                    Data Flow & Webhooks
                                </CardTitle>
                                <CardDescription className="text-sm font-medium">The lifecycle of a real-time event from user interaction to external system sync.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 px-3 py-1 font-black text-[10px] tracking-widest uppercase">Real-Time</Badge>
                                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 px-3 py-1 font-black text-[10px] tracking-widest uppercase">High Affinity</Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-4 bg-black/40">
                        <div className="w-full h-fit overflow-hidden flex justify-center py-6 px-2">
                            <MermaidDiagram chart={DATA_FLOW_CHART} mobileChart={DATA_FLOW_MOBILE} className="w-full" />
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 bg-black/20">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 hover:border-emerald-500/30 transition-all group">
                                <div className="flex items-center gap-4 text-lg font-black tracking-tight">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    Secure Webhooks
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                    All outgoing webhooks are signed with a unique **HMAC-SHA256** secret per organization. Receiver systems can verify payloads to ensure they originated from your authorized Basalt instance.
                                </p>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 hover:border-blue-500/30 transition-all group">
                                <div className="flex items-center gap-4 text-lg font-black tracking-tight">
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    Global Data Center
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                    Our edge mesh leverages **AWS Global Infrastructure** to provide sub-100ms latency on Voice processing and Data operations, ensuring 100% uptime and high accuracy.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Integration Details Grid */}
            <div className="space-y-4 pt-4">
                <h3 className="text-xl font-bold">Core Integration Partners</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {integrations.map((int, i) => (
                        <motion.div
                            key={int.name}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Card className={cn("h-full bg-white/5 border hover:bg-white/[0.08] transition-all group", int.borderColor)}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={cn("p-2 rounded-lg bg-white/5", int.color)}>
                                            <int.icon className="w-5 h-5" />
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0 h-5">
                                            {int.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-base group-hover:text-white transition-colors">{int.name}</CardTitle>
                                    <CardDescription className="text-xs">{int.category}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        {int.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
