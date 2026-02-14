"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Mail,
    MessageSquare,
    Phone,
    CheckCircle2,
    Sparkles,
    Bot,
    Clock,
    Send,
    Zap,
} from "lucide-react";

interface OutreachChannel {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    features: string[];
}

const OUTREACH_CHANNELS: OutreachChannel[] = [
    {
        id: "email",
        name: "Email",
        description: "Send personalized emails written by AI, tailored to each lead",
        icon: Mail,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        features: [
            "AI writes personalized messages for you",
            "Tracks when emails are opened",
            "Includes your calendar link automatically",
            "Works with Gmail, Outlook, or custom email",
        ],
    },
    {
        id: "sms",
        name: "Text Message",
        description: "Send quick SMS messages directly from your CRM",
        icon: MessageSquare,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        features: [
            "AI crafts short, effective messages",
            "Sent from a verified business number",
            "Great for quick follow-ups",
            "Track delivery status",
        ],
    },
    {
        id: "call",
        name: "Phone Call",
        description: "Make calls with AI assistance and live transcription",
        icon: Phone,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        features: [
            "AI coaching during your call",
            "Live transcription as you talk",
            "Automatic call logging",
            "One-click dialing from the CRM",
        ],
    },
];

interface ChannelCardProps {
    channel: OutreachChannel;
    delay?: number;
}

function ChannelCard({ channel, delay = 0 }: ChannelCardProps) {
    const Icon = channel.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay }}
            className="p-5 rounded-xl border bg-card hover:shadow-md transition-all"
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                    channel.bgColor
                )}>
                    <Icon className={cn("w-6 h-6", channel.color)} />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold">{channel.name}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {channel.description}
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                {channel.features.map((feature, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: delay + 0.1 + i * 0.05 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {feature}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

export default function OutreachFlowView() {
    return (
        <div className="space-y-6">
            {/* Outreach Channels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {OUTREACH_CHANNELS.map((channel, index) => (
                    <ChannelCard
                        key={channel.id}
                        channel={channel}
                        delay={index * 0.15}
                    />
                ))}
            </div>

            {/* Key Tips - Plain English */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 rounded-lg bg-card border border-border flex items-start gap-3"
                >
                    <Bot className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-sm">AI Does the Writing</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Just click send – AI creates personalized messages based on each lead's profile.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="p-4 rounded-lg bg-card border border-border flex items-start gap-3"
                >
                    <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-sm">Everything is Tracked</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Every email, text, and call is logged in the lead's activity history automatically.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="p-4 rounded-lg bg-card border border-border flex items-start gap-3"
                >
                    <Zap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-sm">Leads Move Automatically</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            When you send a message, the lead automatically moves to the next stage.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
