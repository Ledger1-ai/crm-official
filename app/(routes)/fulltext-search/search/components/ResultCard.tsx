"use client";

import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ResultCardProps {
    title: string;
    subtitle?: string | null;
    href: string;
    icon: LucideIcon;
    type: string;
}

export const ResultCard = ({
    title,
    subtitle,
    href,
    icon: Icon,
    type,
}: ResultCardProps) => {
    return (
        <Link
            href={href}
            className="group flex items-center p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md hover:bg-accent/50 transition-all duration-200"
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="ml-4 flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none truncate">{title}</p>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                        {type}
                    </span>
                </div>
                {subtitle && (
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                        {subtitle}
                    </p>
                )}
            </div>
        </Link>
    );
};
