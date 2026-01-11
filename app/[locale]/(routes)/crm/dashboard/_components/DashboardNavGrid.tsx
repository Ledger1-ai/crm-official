"use client";


import React from "react";
import Link from "next/link";
import {
    Building2,
    Users,
    FileText,
    Phone,
    LayoutList,
    Target,
    LayoutDashboard,
    Wand2,
    Megaphone,
    FolderKanban
} from "lucide-react";

// Alphabetical: Companies, Contacts, Contracts, Dashboard, Dialer, Leads, Leads Manager, Opportunities
const navItems = [
    {
        title: "Accounts",
        description: "Manage client accounts",
        href: "/crm/accounts",
        icon: Building2,
        color: "from-blue-500/20 to-cyan-500/20",
        iconColor: "text-blue-400",
    },
    {
        title: "Contacts",
        description: "View and edit contacts",
        href: "/crm/contacts",
        icon: Users,
        color: "from-emerald-500/20 to-green-500/20",
        iconColor: "text-emerald-400",
    },
    {
        title: "Campaigns",
        description: "Manage outreach campaigns",
        href: "/crm/leads?tab=campaigns",
        icon: Megaphone,
        color: "from-purple-500/20 to-pink-500/20",
        iconColor: "text-purple-400",
    },
    {
        title: "Contracts",
        description: "View and manage contracts",
        href: "/crm/contracts",
        icon: FileText,
        color: "from-slate-500/20 to-zinc-500/20",
        iconColor: "text-slate-400",
    },
    {
        title: "Dashboard",
        description: "Sales performance overview",
        href: "/crm/sales-command",
        icon: LayoutDashboard,
        color: "from-pink-500/20 to-rose-500/20",
        iconColor: "text-pink-400",
    },
    {
        title: "Dialer",
        description: "Make and track calls",
        href: "/crm/dialer",
        icon: Phone,
        color: "from-orange-500/20 to-red-500/20",
        iconColor: "text-orange-400",
    },
    {
        title: "Lead Wizard",
        description: "Generate new leads",
        href: "/crm/leads?tab=wizard",
        icon: Wand2,
        color: "from-cyan-500/20 to-sky-500/20",
        iconColor: "text-cyan-400",
    },
    {
        title: "Lead Pools",
        description: "Organize lead segments",
        href: "/crm/leads?tab=pools",
        icon: Target,
        color: "from-indigo-500/20 to-violet-500/20",
        iconColor: "text-indigo-400",
    },
    {
        title: "My Projects",
        description: "Your assigned projects & pools",
        href: "/crm/my-projects",
        icon: FolderKanban,
        color: "from-amber-500/20 to-orange-500/20",
        iconColor: "text-amber-400",
    },
    {
        title: "Leads Manager",
        description: "View and manage all leads",
        href: "/crm/leads",
        icon: LayoutList,
        color: "from-teal-500/20 to-emerald-500/20",
        iconColor: "text-teal-400",
    },
    {
        title: "Opportunities",
        description: "Track sales pipeline",
        href: "/crm/opportunities",
        icon: Target,
        color: "from-lime-500/20 to-green-500/20",
        iconColor: "text-lime-400",
    },
];

interface Props {
    isMember?: boolean;
}

export default function DashboardNavGrid({ isMember = false }: Props) {
    // Filter items based on role
    const filteredNavItems = navItems.filter((item) => {
        if (isMember) {
            // Hide specific items for Members (Campaigns is now shown since members can access their own)
            if (["Lead Wizard", "Lead Pools"].includes(item.title)) {
                return false;
            }
        }
        return true;
    });

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {filteredNavItems.map((item) => (
                <Link
                    key={item.title}
                    href={item.href}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:bg-accent/50 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                    {/* Glass Gradient Background - enhanced opacity for faint hue */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-20 group-hover:opacity-100 transition-opacity duration-300`} />

                    <div className="relative z-10 flex flex-col items-center justify-center space-y-3 text-center">
                        {/* Spiced up icon container with gradient background and ring */}
                        <div className={`p-3 rounded-full bg-gradient-to-br ${item.color} border border-border shadow-lg group-hover:scale-110 transition-transform duration-300 ${item.iconColor} ring-1 ring-white/20 group-hover:ring-white/40`}>
                            <item.icon className="w-8 h-8" strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <span className="block text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                                {item.title}
                            </span>
                            <span className="block text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                {item.description}
                            </span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
