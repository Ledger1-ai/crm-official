"use client";

import { FileText, Briefcase, BookOpen, Globe, Share2, Users, ArrowRight, Activity, Mail, Image as ImageIcon, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SystemStatusModal } from "@/components/cms/SystemStatusModal";
import { SupportInboxModal } from "@/components/cms/SupportInboxModal";
import { cn } from "@/lib/utils";

const items = [
    {
        title: "Blog",
        description: "Manage blog posts",
        href: "/cms/blog",
        icon: FileText,
        gradient: "from-blue-500/20 via-blue-500/5 to-transparent border-blue-500/20 hover:border-blue-500/50",
        iconColor: "text-blue-400",
        type: "link"
    },
    {
        title: "Careers",
        description: "Manage job postings",
        href: "/cms/careers",
        icon: Briefcase,
        gradient: "from-purple-500/20 via-purple-500/5 to-transparent border-purple-500/20 hover:border-purple-500/50",
        iconColor: "text-purple-400",
        type: "link"
    },
    {
        title: "Documentation",
        description: "Help docs & guides",
        href: "/cms/docs",
        icon: BookOpen,
        gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/20 hover:border-emerald-500/50",
        iconColor: "text-emerald-400",
        type: "link"
    },
    {
        title: "Media Library",
        description: "Manage images & files",
        href: "/cms/media",
        icon: ImageIcon,
        gradient: "from-orange-500/20 via-orange-500/5 to-transparent border-orange-500/20 hover:border-orange-500/50",
        iconColor: "text-orange-400",
        type: "link"
    },
    {
        title: "System Status",
        description: "Real-time metrics",
        action: "system_status",
        icon: Activity,
        gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent border-cyan-500/20 hover:border-cyan-500/50",
        iconColor: "text-cyan-400",
        type: "modal"
    },
    {
        title: "Social Media",
        description: "Configure social links",
        href: "/cms/social",
        icon: Share2,
        gradient: "from-pink-500/20 via-pink-500/5 to-transparent border-pink-500/20 hover:border-pink-500/50",
        iconColor: "text-pink-400",
        type: "link"
    },
    {
        title: "Footer Manager",
        description: "Edit site footer",
        href: "/cms/footer",
        icon: Globe,
        gradient: "from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/50",
        iconColor: "text-amber-400",
        type: "link"
    },
    {
        title: "Settings",
        description: "System & User Settings",
        href: "/cms/settings",
        icon: Settings,
        gradient: "from-slate-500/20 via-slate-500/5 to-transparent border-slate-500/20 hover:border-slate-500/50",
        iconColor: "text-slate-400",
        type: "link"
    },
    {
        title: "Support Inbox",
        description: "Customer messages",
        action: "support_inbox",
        icon: Mail,
        gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent border-indigo-500/20 hover:border-indigo-500/50",
        iconColor: "text-indigo-400",
        type: "modal",
        badge: "New"
    }
];

export default function DashboardGrid() {
    const [activeModal, setActiveModal] = useState<string | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {items.map((item, idx) => {
                    const CardContent = (
                        <div className="relative h-full">
                            <div className={cn(
                                "h-full p-6 rounded-2xl bg-[#0A0A0B] border border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden group hover:shadow-2xl hover:shadow-black/50",
                            )}>
                                {/* Gradient Blob Background */}
                                <div className={cn("absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40", item.iconColor.replace("text-", "bg-"))} />

                                <div className="flex items-start justify-between relative z-10">
                                    <div className={cn("p-3 rounded-xl bg-slate-800 border border-white/5 shadow-inner", item.iconColor)}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    {item.badge && (
                                        <div className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                            {item.badge}
                                        </div>
                                    )}
                                    {/* Arrow icon shown for links */}
                                    {!item.badge && item.type === "link" && (
                                        <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                                    )}
                                </div>

                                <div className="mt-5 relative z-10">
                                    <h3 className="text-lg font-bold text-white group-hover:tracking-wide transition-all duration-300">{item.title}</h3>
                                    <p className="text-sm text-slate-400 mt-1 font-medium">{item.description}</p>
                                </div>

                                {/* Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </div>
                        </div>
                    );

                    if (item.type === "link") {
                        return (
                            <Link key={idx} href={item.href!} className="block h-full cursor-pointer">
                                {CardContent}
                            </Link>
                        );
                    } else {
                        return (
                            <button key={idx} onClick={() => setActiveModal(item.action!)} className="block w-full text-left h-full cursor-pointer">
                                {CardContent}
                            </button>
                        );
                    }
                })}
            </div>

            {/* Active Users Modal removed from grid */}

            <SystemStatusModal
                isOpen={activeModal === "system_status"}
                onClose={() => setActiveModal(null)}
            />

            <SupportInboxModal
                isOpen={activeModal === "support_inbox"}
                onClose={() => setActiveModal(null)}
            />
        </>
    );
}
