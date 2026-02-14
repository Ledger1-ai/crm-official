"use client";

import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
    CreditCard,
    Wallet,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Download,
    FileText,
    Receipt,
    Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { downloadInvoicePDF, downloadInvoicesSummaryPDF } from "@/lib/generate-invoice-pdf";

interface BillingHistoryViewProps {
    subscriptions: any[];
    invoices?: any[];
}

export const BillingHistoryView = ({ subscriptions, invoices = [] }: BillingHistoryViewProps) => {
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

    const toggleExpand = (teamId: string) => {
        setExpandedTeamId(prev => prev === teamId ? null : teamId);
    };

    const getTeamInvoices = (teamId: string) => {
        return invoices.filter((inv: any) => inv.tenant_id === teamId);
    };

    const handleDownloadInvoice = (invoice: any) => {
        try {
            downloadInvoicePDF(invoice);
            toast.success("Invoice PDF downloaded");
        } catch (e) {
            console.error("PDF generation failed", e);
            toast.error("Failed to generate PDF");
        }
    };

    const handleExportAllCSV = () => {
        if (!subscriptions.length) return;
        const headers = ["Team", "Slug", "Plan", "Amount", "Payment Method", "Next Billing", "Status", "Last Charge"];
        const rows = subscriptions.map((sub: any) => [
            sub.team?.name || "",
            sub.team?.slug || "",
            sub.plan_name,
            sub.amount.toFixed(2),
            sub.customer_wallet ? `Crypto (${sub.customer_wallet.slice(0, 6)}...)` : "Card",
            format(new Date(sub.next_billing_date), "yyyy-MM-dd"),
            sub.status,
            sub.last_charge_date ? format(new Date(sub.last_charge_date), "yyyy-MM-dd HH:mm") : "N/A"
        ]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `platform-subscriptions-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Subscriptions exported");
    };

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
            <CardHeader className="border-b border-zinc-800 bg-zinc-900/50 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    Platform Billing History
                </CardTitle>
                <div className="flex items-center gap-2">
                    {invoices.length > 0 && (
                        <Button variant="outline" size="sm" className="gap-2 border-zinc-700 text-zinc-300 hover:text-white" onClick={() => {
                            try { downloadInvoicesSummaryPDF(invoices, "Platform Invoices"); toast.success("PDF exported"); } catch { toast.error("Failed to export PDF"); }
                        }}>
                            <FileText className="w-3.5 h-3.5" />
                            Export PDF
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-2 border-zinc-700 text-zinc-300 hover:text-white" onClick={handleExportAllCSV}>
                        <Download className="w-3.5 h-3.5" />
                        CSV
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-zinc-950">
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest w-8"></TableHead>
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
                        {subscriptions.map((sub) => {
                            const teamInvoices = getTeamInvoices(sub.tenant_id);
                            const isExpanded = expandedTeamId === sub.tenant_id;
                            const hasInvoices = teamInvoices.length > 0;

                            return (
                                <React.Fragment key={sub.id}>
                                    <TableRow
                                        className={`border-zinc-800 transition-colors ${hasInvoices ? "cursor-pointer hover:bg-zinc-800/30" : "hover:bg-zinc-800/20"}`}
                                        onClick={() => hasInvoices && toggleExpand(sub.tenant_id)}
                                    >
                                        <TableCell className="w-8 px-3">
                                            {hasInvoices ? (
                                                isExpanded
                                                    ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                                                    : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                                            ) : (
                                                <div className="w-3.5" />
                                            )}
                                        </TableCell>
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

                                    {/* Expanded Invoice Rows */}
                                    {isExpanded && hasInvoices && (
                                        <TableRow className="border-0">
                                            <TableCell colSpan={8} className="p-0 bg-zinc-950/50">
                                                <div className="px-6 py-4 border-l-2 border-indigo-500/30 ml-4">
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2">
                                                        <Receipt className="w-3 h-3" />
                                                        Invoices ({teamInvoices.length})
                                                    </div>
                                                    <div className="space-y-2">
                                                        {teamInvoices.map((inv: any) => (
                                                            <div
                                                                key={inv.id}
                                                                className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex items-center gap-2">
                                                                        {inv.type === "AI_USAGE" ? (
                                                                            <Cpu className="w-3.5 h-3.5 text-violet-400" />
                                                                        ) : (
                                                                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                                        )}
                                                                        <span className="font-mono text-xs text-zinc-300">{inv.invoice_number}</span>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-400">
                                                                        {inv.type}
                                                                    </Badge>
                                                                    <span className="text-[10px] text-zinc-500">
                                                                        {format(new Date(inv.period_start), "MMM d")} — {format(new Date(inv.period_end), "MMM d, yyyy")}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="font-bold text-white text-sm">${inv.total.toFixed(2)}</span>
                                                                    <Badge className={
                                                                        inv.payment_status === "PAID" ? "bg-green-500/20 text-green-500 border-green-500/20 text-[9px]" :
                                                                            inv.payment_status === "PENDING" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/20 text-[9px]" :
                                                                                inv.payment_status === "WAIVED" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/20 text-[9px]" :
                                                                                    "bg-red-500/20 text-red-500 border-red-500/20 text-[9px]"
                                                                    }>
                                                                        {inv.payment_status}
                                                                    </Badge>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 px-2 text-zinc-400 hover:text-white"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDownloadInvoice(inv);
                                                                        }}
                                                                    >
                                                                        <Download className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

