"use client";

import { LucideIcon } from "lucide-react";
import { ResultCard } from "./ResultCard";

interface ResultsSectionProps {
    title: string;
    data: any[];
    icon: LucideIcon;
    renderItem: (item: any) => {
        title: string;
        subtitle?: string | null;
        href: string;
    };
}

export const ResultsSection = ({
    title,
    data,
    icon: SectionIcon,
    renderItem,
}: ResultsSectionProps) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <SectionIcon className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                <span className="ml-auto text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {data.length} found
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((item: any) => {
                    const { title: itemTitle, subtitle, href } = renderItem(item);
                    return (
                        <ResultCard
                            key={item.id}
                            title={itemTitle || "Untitled"}
                            subtitle={subtitle}
                            href={href}
                            icon={SectionIcon}
                            type={title}
                        />
                    );
                })}
            </div>
        </div>
    );
};
