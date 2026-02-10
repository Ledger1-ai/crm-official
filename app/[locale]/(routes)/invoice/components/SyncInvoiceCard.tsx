
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { runCronJob } from "@/actions/cron/get-invoice-from-mail";

// Duplicate of the CardContent style to ensure consistency
const CardContent = ({ card, loading = false }: { card: any, loading?: boolean }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-[#27272a] bg-[#09090b] p-3 transition-all duration-300 h-[110px] w-full cursor-pointer">
        {/* Giant Watermark Icon - Positioned Right */}
        <Loader2
            className={`absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-colors duration-500 pointer-events-none opacity-10 group-hover:opacity-20 ${card.iconColor} ${loading ? "animate-spin" : ""}`}
        />

        <div className="relative z-10 w-full h-full flex flex-col justify-center items-start pl-1">
            <div className="space-y-0.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 group-hover:text-foreground transition-colors">
                    {card.title}
                </span>
                <span className="block text-xl font-bold tracking-tight text-foreground">
                    {card.description}
                </span>
            </div>
        </div>

        {/* Subtle Glow on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
);

type SyncInvoiceCardProps = {
    card: any;
};

export const SyncInvoiceCard = ({ card }: SyncInvoiceCardProps) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const runCron = async () => {
        try {
            setIsLoading(true);
            const response = await runCronJob();
            // Also invoke our invoice refetch logic locally (for recent documents not picked up)
            try {
                await fetch("/api/invoice/refetch", { method: "POST" });
                toast.success("Sync & Processing triggered.");
            } catch (e) { console.warn("Refetch trigger failed", e); }

            toast.success(response.message);
        } catch (error) {
            console.log(error);
            toast.error("Failed to sync invoices");
        } finally {
            setIsLoading(false);
            router.refresh();
        }
    };

    return (
        <div onClick={runCron} className="h-full">
            <CardContent card={card} loading={isLoading} />
        </div>
    );
};
