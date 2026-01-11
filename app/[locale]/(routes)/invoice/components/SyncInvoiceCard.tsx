
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { runCronJob } from "@/actions/cron/get-invoice-from-mail";

// Duplicate of the CardContent style to ensure consistency
const CardContent = ({ card, loading = false }: { card: any, loading?: boolean }) => (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 md:p-6 hover:bg-accent/50 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] text-left w-full h-full cursor-pointer">
        <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-20 group-hover:opacity-60 transition-opacity duration-300`} />
        <div className="relative z-10 flex flex-col items-center justify-center space-y-2 text-center h-full">
            <div className={`p-3 rounded-full bg-gradient-to-br ${card.color} border border-border shadow-lg group-hover:scale-110 transition-transform duration-300 ${card.iconColor} ring-1 ring-white/20 group-hover:ring-white/40`}>
                <Loader2 className={`w-6 h-6 md:w-8 md:h-8 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
            </div>
            <div className="space-y-0.5">
                <span className="block text-sm md:text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    {card.title}
                </span>
                <span className="block text-[10px] md:text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                    {card.description}
                </span>
            </div>
        </div>
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
