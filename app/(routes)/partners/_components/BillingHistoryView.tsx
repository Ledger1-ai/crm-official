"use client";

import React from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Wallet, AlertTriangle } from "lucide-react";

interface BillingHistoryViewProps {
    subscriptions: any[];
}

export const BillingHistoryView = ({ subscriptions }: BillingHistoryViewProps) => {
    if (!subscriptions || subscriptions.length === 0) {
        return (
            <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-10 text-center text-zinc-500">
                    No billing history found.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    Platform Billing History
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-zinc-950">
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Team</TableHead>
                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Plan</TableHead>
                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Amount</TableHead>
                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Payment Method</TableHead>
                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Next Billing</TableHead>
                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Last Charge</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscriptions.map((sub) => (
                            <TableRow key={sub.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                                <TableCell className="font-medium text-white">
                                    <div>{sub.team?.name}</div>
                                    <div className="text-[10px] text-zinc-500 font-mono">{sub.team?.slug}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/5">
                                        {sub.plan_name}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-bold text-white">
                                    ${sub.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    {sub.customer_wallet ? (
                                        <div className="flex items-center gap-2 text-cyan-400">
                                            <Wallet className="w-3 h-3" />
                                            <span className="text-[10px] font-mono">{sub.customer_wallet.slice(0, 6)}...{sub.customer_wallet.slice(-4)}</span>
                                            {sub.discount_applied && <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 text-[8px] h-4">5% OFF</Badge>}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <CreditCard className="w-3 h-3" />
                                            <span className="text-[10px]">Vaulted Card</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-zinc-300 text-xs">
                                    {format(new Date(sub.next_billing_date), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={
                                            sub.status === "ACTIVE" ? "bg-green-500/20 text-green-500 border-green-500/20" :
                                                sub.status === "OVERDUE" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/20 animate-pulse" :
                                                    "bg-red-500/20 text-red-500 border-red-500/20"
                                        }
                                    >
                                        {sub.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {sub.last_charge_date ? (
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-zinc-300">{format(new Date(sub.last_charge_date), "MMM d, HH:mm")}</div>
                                            <div className={`text-[9px] ${sub.last_charge_status === "SYSTEM_FREE_CREDIT" ? "text-cyan-400 font-bold" :
                                                    sub.last_charge_status?.includes("SUCCESS") ? "text-green-500" : "text-red-500"
                                                } flex items-center gap-1`}>
                                                {sub.last_charge_status === "SYSTEM_FREE_CREDIT" ? (
                                                    "System Credit (Free)"
                                                ) : (
                                                    <>
                                                        {!sub.last_charge_status?.includes("SUCCESS") && <AlertTriangle className="w-2 h-2" />}
                                                        {sub.last_charge_status}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-600 text-[10px]">No charges yet</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
