
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    CreditCard,
    ShieldCheck,
    Sparkles,
    Clock,
    CheckCircle2,
    Calendar,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BillingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PLANS = [
    {
        name: "Testing Plan",
        slug: "FREE",
        monthly: 2,
        annual: 18, // 25% off
        features: ["Uptime Monitoring", "Test Integration", "1 User"]
    },
    {
        name: "Individual Basic",
        slug: "INDIVIDUAL_BASIC",
        monthly: 50,
        annual: 450, // 25% off (50 * 12 * 0.75)
        features: ["500 Leads / mo", "Basic Enrichment", "2 Users"]
    },
    {
        name: "Individual Pro",
        slug: "INDIVIDUAL_PRO",
        monthly: 150,
        annual: 1350, // 25% off (150 * 12 * 0.75)
        features: ["2,500 Leads / mo", "VoiceHub Access", "4 Users"],
        popular: true
    }
];

import { saveSubscription } from "@/actions/billing/save-subscription";

export const BillingModal = ({ isOpen, onClose }: BillingModalProps) => {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
    const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto">("card");
    const [selectedPlan, setSelectedPlan] = useState(PLANS[2]);
    const [loading, setLoading] = useState(false);
    const [wallet, setWallet] = useState("");

    // Calculate dynamic billing day
    const signupDay = new Date().getDate();
    const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const billingDayStr = `${getOrdinal(signupDay)} of each month`;

    // Auto-switch to Crypto mode if wallet is entered AND valid
    const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setWallet(val);

        // Strict ETH address validation: 0x followed by 40 hex characters
        const isValidParams = val.startsWith("0x") && val.length === 42;

        if (isValidParams) {
            setPaymentMethod("crypto");
            setBillingCycle("annual");
        } else if (val.length === 0 && paymentMethod === "crypto") {
            setPaymentMethod("card");
        }
    };

    const monthlyPrice = selectedPlan.monthly;
    let finalPrice = monthlyPrice;
    let discountLabel = "";

    // Derived state for validation
    const isCryptoValid = wallet.startsWith("0x") && wallet.length === 42;

    if (billingCycle === "annual") {
        if (paymentMethod === "crypto" && isCryptoValid) {
            // 25% Discount for Crypto P2P (Annual) - ONLY if wallet is valid
            finalPrice = (monthlyPrice * 12) * 0.75;
            discountLabel = "Crypto P2P (-25%)";
        } else {
            // 20% Discount for Card/Standard (Annual)
            finalPrice = (monthlyPrice * 12) * 0.80;
            discountLabel = "Annual (-20%)";
        }
    } else {
        finalPrice = monthlyPrice;
    }


    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await saveSubscription({
                planName: selectedPlan.slug,
                amount: finalPrice,
                billingDay: signupDay,
                customerWallet: wallet.startsWith("0x") ? wallet : undefined,
                discountApplied: billingCycle === "annual", // Logic tracks if ANY annual discount applied
                interval: billingCycle
            });

            if (res.error) {
                toast.error(res.error);
                setLoading(false);
            } else if (res.url) {
                toast.success("Redirecting to Portal...");
                window.location.assign(res.url as string);
            } else {
                toast.success(`Subscription Plan Updated!`);
                onClose();
                setLoading(false);
            }
        } catch (error) {
            toast.error("Subscription failed.");
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl bg-[#09090b] border-zinc-800 p-0 overflow-hidden text-white shadow-2xl">
                <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                    {/* Sidebar / Plan Selector */}
                    <div className="w-full md:w-96 bg-zinc-950/80 backdrop-blur-md border-r border-zinc-800 p-8 flex flex-col relative overflow-hidden">
                        {/* Ambient Background Glow */}
                        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none opacity-50" />

                        <DialogHeader className="mb-8 relative z-10">
                            <DialogTitle className="flex items-center gap-2 text-2xl tracking-tight font-bold">
                                <Sparkles className="text-cyan-400 w-6 h-6" />
                                Subscriptions
                            </DialogTitle>
                            <DialogDescription className="text-zinc-500 text-sm">
                                Choose your tier. Scale dynamically.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Billing Toggle */}
                        <div className="flex bg-zinc-900/50 p-1.5 rounded-xl mb-8 border border-zinc-800/50 relative z-10">
                            <button
                                onClick={() => { setBillingCycle("monthly"); setPaymentMethod("card"); }}
                                className={cn(
                                    "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all",
                                    billingCycle === "monthly" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle("annual")}
                                className={cn(
                                    "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all relative overflow-hidden",
                                    billingCycle === "annual" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                Annual
                                <div className={cn("absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]", billingCycle === "annual" ? "block" : "hidden")} />
                                <span className={cn("ml-2 text-[10px] px-1.5 py-0.5 rounded-full transition-colors",
                                    (paymentMethod === 'crypto' && isCryptoValid) ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]" : "bg-cyan-500/20 text-cyan-400")}>
                                    {(paymentMethod === 'crypto' && isCryptoValid) ? '-25%' : '-20%'}
                                </span>
                            </button>
                        </div>

                        {/* Plans List */}
                        <div className="space-y-3 flex-1 overflow-y-auto pr-2 relative z-10">
                            {PLANS.map((plan) => (
                                <button
                                    key={plan.name}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden",
                                        selectedPlan.name === plan.name
                                            ? "border-primary/50 bg-primary/10 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
                                            : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className={cn("text-sm font-bold tracking-tight mb-1", selectedPlan.name === plan.name ? "text-primary" : "text-zinc-300")}>
                                                {plan.name}
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {plan.features.slice(0, 2).map((f, i) => (
                                                    <span key={i} className="text-[10px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">{f}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {plan.popular && (
                                            <span className="text-[9px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-black tracking-wider uppercase shadow-lg">PRO</span>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-baseline gap-1">
                                        <span className="text-2xl font-mono font-bold tracking-tighter text-white">
                                            ${billingCycle === "monthly" ? plan.monthly : Math.round(billingCycle === "annual" ? (paymentMethod === 'crypto' ? plan.annual / 12 : (plan.monthly * 12 * 0.8) / 12) : plan.monthly)}
                                        </span>
                                        <span className="text-xs text-zinc-500 font-medium">/mo</span>
                                        {billingCycle === "annual" && (
                                            <span className="ml-auto text-xs text-zinc-400 line-through decoration-zinc-600">
                                                ${plan.monthly}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 relative z-10">
                            <Label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 block">
                                P2P Discount Activator
                            </Label>
                            <div className="relative group">
                                <div className={cn("absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg blur opacity-20 transition duration-500", isCryptoValid ? "opacity-75 animate-pulse" : "group-hover:opacity-40")}></div>
                                <Input
                                    placeholder="Paste Wallet Address (0x)..."
                                    value={wallet}
                                    onChange={handleWalletChange}
                                    className={cn(
                                        "bg-zinc-950 border-zinc-800 h-10 text-xs font-mono relative focus:ring-0 transition-colors pl-9",
                                        isCryptoValid ? "border-emerald-500/50 text-emerald-400" : "focus:border-emerald-500"
                                    )}
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <div className={cn("w-2 h-2 rounded-full transition-all duration-300", isCryptoValid ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-zinc-700")} />
                                </div>
                            </div>

                            <div className={cn("overflow-hidden transition-all duration-500 ease-in-out", isCryptoValid ? "max-h-12 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0")}>
                                <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <Sparkles className="w-3 h-3 text-emerald-400 animate-spin-slow" />
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider animate-pulse">
                                        25% P2P Discount Unlocked
                                    </p>
                                </div>
                            </div>
                            {!isCryptoValid && (
                                <p className="text-[9px] text-zinc-500 mt-2 font-medium uppercase tracking-widest animate-pulse pl-1">
                                    Pay with Crypto • <span className="text-emerald-400">Save 25%</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Main Content / Payment Method */}
                    <div className="flex-1 p-8 md:p-10 bg-[#09090b] flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="max-w-xl mx-auto w-full h-full flex flex-col z-10">
                            <div className="mb-8">
                                <h3 className="text-3xl font-bold mb-3 flex items-center gap-3 tracking-tight text-white">
                                    {paymentMethod === 'crypto' ? (
                                        <>
                                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                <Sparkles className="text-emerald-400 w-6 h-6" />
                                            </div>
                                            $USDC Peer to Peer
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                <CreditCard className="text-indigo-400 w-6 h-6" />
                                            </div>
                                            Information
                                        </>
                                    )}
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                                    {paymentMethod === 'crypto'
                                        ? "Direct wallet-to-wallet transfer. No intermediaries. No automated pull. Pure P2P settlement."
                                        : "Secure automated billing via BasaltSURGE Hybrid Rails. Funds settled in USDC on Base."}
                                </p>
                            </div>

                            <Card className={cn("bg-zinc-900/50 border-zinc-800 mb-8 overflow-hidden transition-all duration-500", paymentMethod === 'crypto' ? "border-emerald-500/30 ring-1 ring-emerald-500/20" : "")}>
                                <div className="flex flex-row md:items-center p-6 gap-6">
                                    <div className={cn("hidden md:flex w-12 h-12 rounded-full items-center justify-center flex-shrink-0", paymentMethod === 'crypto' ? "bg-emerald-500/10" : "bg-indigo-500/10")}>
                                        {paymentMethod === 'crypto' ? <Sparkles className="w-6 h-6 text-emerald-400" /> : <ShieldCheck className="w-6 h-6 text-indigo-400" />}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                                            {paymentMethod === 'crypto' ? "PEER-TO-PEER SETTLEMENT" : "Secure Payment Portal"}
                                        </h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                                            {paymentMethod === 'crypto'
                                                ? "Direct P2P Transfer. Must be settled in USDC on Base Network to qualify for the 25% discount."
                                                : "Redirects to BasaltSURGE Safe Portal for PCI-compliant card vaulting."}
                                        </p>
                                    </div>
                                </div>
                                {paymentMethod !== 'crypto' && (
                                    <div className="bg-zinc-950/50 px-6 py-2 flex items-center justify-between border-t border-zinc-800/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] text-zinc-400 font-medium">Results: Encryption Active</span>
                                        </div>
                                        <Clock className="text-zinc-600 w-3 h-3" />
                                    </div>
                                )}
                            </Card>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="text-zinc-500 w-4 h-4" />
                                        <span className="font-medium text-zinc-300">Next Billing Day</span>
                                    </div>
                                    <span className="font-mono font-bold text-cyan-400">{billingDayStr}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/50 transition-colors relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                    <div className="flex items-center gap-3 relative z-10">
                                        <CheckCircle2 className="text-zinc-500 w-4 h-4" />
                                        <span className="font-medium text-zinc-300">Total Due Today</span>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <div className="text-[10px] text-zinc-500 mb-0.5 text-right uppercase tracking-wider font-bold">
                                            {selectedPlan.name} • {billingCycle}
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            {discountLabel && (
                                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase", paymentMethod === 'crypto' ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400")}>
                                                    {discountLabel}
                                                </span>
                                            )}
                                            <span className="font-mono font-bold text-2xl text-white tracking-tight">
                                                ${finalPrice.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <Button
                                    className={cn(
                                        "w-full h-16 rounded-2xl text-lg font-bold shadow-2xl transition-all group overflow-hidden relative",
                                        paymentMethod === 'crypto'
                                            ? "bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                                            : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_40px_rgba(79,70,229,0.4)]"
                                    )}
                                    onClick={handleSave}
                                    disabled={loading}
                                >
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {loading ? "Processing..." : (
                                            <>
                                                {paymentMethod === 'crypto' ? "Confirm P2P Transfer (USDC Only)" : `Activate ${selectedPlan.name}`}
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </Button>
                                <p className="text-center text-[10px] text-zinc-600 mt-6 leading-relaxed px-8">
                                    {paymentMethod === 'crypto'
                                        ? "P2P Transactions must be in USDC on Base Network. Volatility protection ensures your rate is locked."
                                        : "By subscribing, you enable BasaltSURGE Hybrid Rails. Charges are processed in USDC via Base network automation."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
