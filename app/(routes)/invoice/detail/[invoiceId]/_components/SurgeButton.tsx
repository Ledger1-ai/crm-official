
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Coins, CheckCircle2 } from "lucide-react";
import { generateSurgeLink } from "@/actions/invoice/generate-surge-link";
import { toast } from "sonner"; // Assuming sonner is installed

interface Props {
    invoiceId: string;
    paymentLink?: string | null;
    paymentStatus?: string | null;
    amount?: string | null;
    currency?: string | null;
}

export const SurgeButton = ({ invoiceId, paymentLink, paymentStatus, amount, currency }: Props) => {
    const [loading, setLoading] = useState(false);

    if (paymentStatus === "PAID") {
        return (
            <div className="flex items-center gap-2 text-green-500 font-medium p-2 border border-green-500/20 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                Paid via Crypto
            </div>
        );
    }

    if (paymentLink) {
        return (
            <Button
                variant="default"
                className="bg-[#0052FF] hover:bg-[#0052FF]/90 text-white w-full sm:w-auto" // Coinbase Blue
                onClick={() => window.open(paymentLink, "_blank")}
            >
                <Coins className="w-4 h-4 mr-2" />
                Pay {amount} {currency || "USDC"}
            </Button>
        );
    }

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateSurgeLink(invoiceId); // Calls server action
            if (result.success) {
                toast.success("Payment link generated!");
                // UI will update via server revalidation or router refresh
            } else {
                toast.error("Failed to generate link.");
            }
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleGenerate}
            disabled={loading}
            variant="outline"
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 w-full sm:w-auto"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Coins className="w-4 h-4 mr-2" />}
            Enable Crypto Payments (Base)
        </Button>
    );
};
