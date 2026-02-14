"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    User,
    Users,
    Building2,
    TrendingUp,
    FileSignature,
    ArrowRight,
    ExternalLink,
    LucideIcon,
    Sparkles,
} from "lucide-react";

interface Entity {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    href: string;
}

const ENTITIES: Entity[] = [
    {
        id: "lead",
        name: "Lead",
        subtitle: "Potential Customer",
        description: "Someone you're reaching out to who might be interested in your services",
        icon: User,
        color: "text-sky-500",
        bgColor: "bg-sky-500/10",
        href: "/crm/leads",
    },
    {
        id: "contact",
        name: "Contact",
        subtitle: "Engaged Person",
        description: "A lead who has received your outreach and is now in your sales process",
        icon: Users,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        href: "/crm/contacts",
    },
    {
        id: "account",
        name: "Account",
        subtitle: "Customer",
        description: "A person or company that has completed a deal with you",
        icon: Building2,
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10",
        href: "/crm/accounts",
    },
    {
        id: "opportunity",
        name: "Opportunity",
        subtitle: "Active Deal",
        description: "A potential sale you're working on with an expected value",
        icon: TrendingUp,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        href: "/crm/opportunities",
    },
    {
        id: "contract",
        name: "Contract",
        subtitle: "Signed Agreement",
        description: "A formal agreement with a customer for ongoing services",
        icon: FileSignature,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        href: "/crm/contracts",
    },
];

interface EntityCardProps {
    entity: Entity;
    delay?: number;
    showArrow?: boolean;
    onClick?: () => void;
}

function EntityCard({ entity, delay = 0, showArrow = true, onClick }: EntityCardProps) {
    const Icon = entity.icon;

    return (
        <div className="flex items-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                className={cn(
                    "flex-1 p-4 rounded-xl border cursor-pointer",
                    "bg-card border-border",
                    "hover:shadow-lg hover:border-primary/50 transition-all",
                    "group"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        entity.bgColor,
                        "group-hover:ring-2 group-hover:ring-primary/20"
                    )}>
                        <Icon className={cn("w-5 h-5", entity.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-sm">{entity.name}</h4>
                            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {entity.subtitle}
                        </p>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    {entity.description}
                </p>
            </motion.div>

            {showArrow && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: delay + 0.1 }}
                    className="px-2 shrink-0"
                >
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                </motion.div>
            )}
        </div>
    );
}

export default function EntityRelationshipView() {
    const router = useRouter();

    const handleEntityClick = (entity: Entity) => {
        router.push(`/en${entity.href}`);
    };

    return (
        <div className="space-y-6">
            {/* Click hint */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-muted-foreground text-center"
            >
                Click any card to view that section
            </motion.p>

            {/* Main Entity Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {ENTITIES.map((entity, index) => (
                    <EntityCard
                        key={entity.id}
                        entity={entity}
                        delay={index * 0.1}
                        showArrow={index < ENTITIES.length - 1}
                        onClick={() => handleEntityClick(entity)}
                    />
                ))}
            </div>

            {/* Relationship Explanations - Plain English */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-lg bg-card border border-border"
                >
                    <h4 className="font-semibold text-sm text-blue-500 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Automatic: Lead → Contact
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                        When you send your first email or text to a lead, they automatically become a <strong>Contact</strong>.
                        This means they've received your first touchpoint and are now in your active sales process!
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 rounded-lg bg-card border border-border"
                >
                    <h4 className="font-semibold text-sm text-emerald-500 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Automatic: Lead → Account
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                        When you close a deal, the lead automatically becomes an <strong>Account</strong>.
                        Congratulations – they're now a customer! You can create opportunities and contracts for them.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
