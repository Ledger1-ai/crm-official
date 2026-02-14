
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { saveSubscription } from "@/actions/billing/save-subscription";

export const SurgeSubscriptionCard = () => {
    const [loading, setLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleVaultAndSubscribe = async () => {
        setLoading(true);
        try {
            // Use the "Premium Agent Access" plan details
            const res = await saveSubscription({
                planName: "Premium Agent Access",
                amount: 100.00,
                billingDay: new Date().getDate(),
                discountApplied: false,
                interval: "monthly"
            });

            if (res.error) {
                toast.error(res.error);
                setLoading(false);
            } else if (res.url) {
                toast.success("Redirecting to BasaltSURGE Secure Portal...");
                window.location.href = res.url;
            } else {
                // Determine success based on response
                toast.success("Subscription initiated!");
                setIsSubscribed(true);
                setLoading(false);
            }
        } catch (error) {
            toast.error("Subscription failed.");
            setLoading(false);
        }
    };

    if (isSubscribed) {
        return (
            <Card className="border-green-500/50 bg-green-500/5 overflow-hidden">
                <CardContent className="pt-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-green-500 rounded-full p-3 text-white">
                            <ShieldCheck size={32} />
                        </div>
                    </div>
                    <CardTitle className="text-green-500 mb-2">Active Subscription</CardTitle>
                    <CardDescription>
                        Your card is securely vaulted via BasaltSURGE.
                        charges will occur on the 14th of each month.
                    </CardDescription>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-blue-500/20 shadow-xl overflow-hidden group">
            <div className="bg-blue-600 h-1.5 w-full" />
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">Premium Agent Access</CardTitle>
                        <CardDescription>Billed Monthly via Surge Hybrid Rails</CardDescription>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-lg">
                        < Zap className="text-blue-600" size={20} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono">$100.00</span>
                    <span className="text-muted-foreground text-sm">/ month</span>
                </div>

                <div className="p-6 bg-muted/30 border border-dashed rounded-xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                    </div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold block">
                        PCI-Compliant Checkout
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
                        For your security, you will be redirected to the <strong>BasaltSURGE Safe Portal</strong> to complete this transaction.
                    </p>
                </div>

                <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Card-to-Crypto Automatic Conversion
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Payout in USDC on Base Network
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Non-custodial secure vaulting
                    </li>
                </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 h-11 transition-all"
                    onClick={handleVaultAndSubscribe}
                    disabled={loading}
                >
                    {loading ? "Vaulting Card..." : "Securely Subscribe"}
                </Button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                    <span>Powered by</span>
                    <Image src="/Surge32.png" width={14} height={14} alt="Surge" className="grayscale opacity-50" />
                    <span className="font-bold">BasaltSURGE</span>
                </div>
            </CardFooter>
        </Card>
    );
};
