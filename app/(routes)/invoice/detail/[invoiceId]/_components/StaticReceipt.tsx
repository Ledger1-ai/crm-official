
import React from 'react';
import { CheckCircle2, Hash, Calendar, Wallet, CreditCard, ShieldCheck, Clock, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StaticReceiptProps {
    data: any;
    status: string;
    paymentUrl?: string;
}

const StaticReceipt = ({ data, status, paymentUrl }: StaticReceiptProps) => {
    const isPaid = status === "PAID";
    const receipt = data?.receipt || data;
    const date = receipt?.createdAt ? new Date(receipt.createdAt).toLocaleString() : new Date().toLocaleString();

    return (
        <div className="flex flex-col items-center justify-start h-full w-full bg-[#0a0a0a] p-8 overflow-y-auto no-scrollbar">
            {/* The "Paper" Receipt */}
            <div className={`w-full max-w-md bg-zinc-900 border ${isPaid ? 'border-zinc-800' : 'border-blue-500/30'} rounded-2xl shadow-2xl relative overflow-hidden`}>
                {/* Top Brand Stripe */}
                <div className={`h-2 w-full ${isPaid ? 'bg-green-600' : 'bg-blue-600'}`} />

                <div className="p-8 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 ${isPaid ? 'bg-green-500/10 border-green-500/20' : 'bg-blue-500/10 border-blue-500/20'} border rounded-full flex items-center justify-center mb-4`}>
                        {isPaid ? (
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        ) : (
                            <Clock className="w-8 h-8 text-blue-500" />
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-white mb-1">
                        {isPaid ? "Transaction Successful" : "Invoice Pending"}
                    </h2>
                    <p className="text-zinc-500 text-sm mb-6">
                        {isPaid ? "Thank you for your payment" : "Waiting for payment via Surge Portal"}
                    </p>

                    <div className="text-4xl font-black text-white mb-8 tracking-tight">
                        ${receipt?.totalUsd || receipt?.invoice_amount || "0.00"} <span className="text-lg font-normal text-zinc-500">USD</span>
                    </div>

                    {!isPaid && paymentUrl && (
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white mb-8 py-6 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20"
                            onClick={() => window.open(paymentUrl, '_blank')}
                        >
                            Pay via Apple Pay / Crypto <ArrowUpRight className="ml-2 w-5 h-5" />
                        </Button>
                    )}

                    {/* Receipt Details Grid */}
                    <div className="w-full space-y-4 text-left border-t border-zinc-800 pt-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500 flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> ID</span>
                            <span className="text-zinc-300 font-mono text-xs">{receipt?.receiptId || receipt?.id?.substring(0, 8)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Date</span>
                            <span className="text-zinc-300">{date}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm text-zinc-500 mt-2 mb-1">
                            <span>Items</span>
                        </div>
                        <div className="space-y-2">
                            {receipt?.lineItems ? (
                                receipt.lineItems.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="text-zinc-400">{item.label}</span>
                                        <span className="text-zinc-200">${item.priceUsd?.toFixed(2)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400">Invoice Items</span>
                                    <span className="text-zinc-200">${receipt?.invoice_amount || "0.00"}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-zinc-800 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 flex items-center gap-2"><Wallet className="w-3.5 h-3.5" /> Merchant Wallet</span>
                                <span className="text-zinc-300 text-[10px] font-mono truncate max-w-[150px]">
                                    {receipt?.recipientWallet || "Primary Settlement"}
                                </span>
                            </div>
                            <div className={`flex justify-between items-center text-sm ${isPaid ? 'text-green-500/80' : 'text-zinc-500'}`}>
                                <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Security</span>
                                <span>{isPaid ? "Verified on Base" : "Encrypted (SSL)"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Deco */}
                <div className="bg-zinc-800/30 p-4 border-t border-zinc-800 flex items-center justify-center gap-2 grayscale opacity-50">
                    <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-500">Secured by BasaltSurge</span>
                </div>
            </div>

            {/* Aesthetic Meta Info */}
            <div className="mt-6 flex flex-col items-center gap-4 text-zinc-600 grayscale opacity-30 select-none">
                <p className="text-[10px] uppercase tracking-widest font-bold">Internal Reference Copy</p>
                <div className="flex gap-8">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-mono">STATUS</span>
                        <span className="text-xs font-mono">{isPaid ? "SETTLED" : "UNPAID"}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-mono">NETWORK</span>
                        <span className="text-xs font-mono">BASE (MAINNET)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaticReceipt;
