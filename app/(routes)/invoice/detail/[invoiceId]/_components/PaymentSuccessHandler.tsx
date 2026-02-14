
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifySurgePayment } from "@/actions/invoice/verify-payment";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PaymentSuccessHandlerProps {
    invoiceId: string;
}

export function PaymentSuccessHandler({ invoiceId }: PaymentSuccessHandlerProps) {
    const searchParams = useSearchParams();
    const paymentStatus = searchParams.get("payment");
    const router = useRouter();
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (paymentStatus === "success") {
            const verify = async () => {
                setVerifying(true);
                try {
                    const result = await verifySurgePayment(invoiceId);
                    if (result.success) {
                        toast.success("Payment Verified! Thank you.");
                        // Clear payment param
                        // Note: Router push might re-trigger render
                        router.replace(`/invoice/detail/${invoiceId}`, { scroll: false });
                    } else {
                        toast.error(result.message || "Payment verification incomplete.");
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to verify payment status.");
                } finally {
                    setVerifying(false);
                }
            };

            verify();
        }
    }, [paymentStatus, invoiceId, router]);

    if (!verifying) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-zinc-900 p-6 rounded-lg text-white flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p>Verifying Payment...</p>
            </div>
        </div>
    );
}
