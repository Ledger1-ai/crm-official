"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    CreditCard,
    Receipt,
    Cpu,
    Radio,
    Download,
    FileText,
    Calendar,
    TrendingUp,
    Wallet,
    AlertTriangle,
    Sparkles,
    Bot,
    Mail,
    Search,
    Brain,
    Zap,
} from "lucide-react";
import { toast } from "sonner";
import { downloadInvoicePDF, downloadInvoicesSummaryPDF } from "@/lib/generate-invoice-pdf";

// Service icon/color mapping
const SERVICE_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    text_generation: { icon: Sparkles, color: "text-violet-400", label: "Text Generation" },
    email_ai: { icon: Mail, color: "text-blue-400", label: "Email AI" },
    varuni: { icon: Brain, color: "text-pink-400", label: "Varuni" },
    enrichment: { icon: Search, color: "text-emerald-400", label: "Lead Enrichment" },
    lead_scoring: { icon: TrendingUp, color: "text-amber-400", label: "Lead Scoring" },
    default: { icon: Bot, color: "text-zinc-400", label: "AI Service" },
};

function getServiceMeta(service: string) {
    return SERVICE_META[service] || { ...SERVICE_META.default, label: service.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) };
}

interface AdminBillingDashboardProps {
    invoices: any[];
    aiUsageLogs: any[];
    aiUsageSummary: any[];
    subscription: any;
    teamId: string;
}

export function AdminBillingDashboard({
    invoices,
    aiUsageLogs,
    aiUsageSummary,
    subscription,
    teamId,

}: AdminBillingDashboardProps) {
    const [echoBalance, setEchoBalance] = useState<any>(null);
    const [echoLoading, setEchoLoading] = useState(true);

    const isExempt = subscription?.plan_name === "PLATFORM_ADMIN" || subscription?.last_charge_status === "SYSTEM_FREE_TIER";
    const displayPlanName = isExempt ? "Platform Admin (Exempt)" : subscription ? subscription.plan_name : "None";
    const displayAmount = isExempt ? "0.00" : subscription?.amount?.toFixed(2);
    const displayNextDate = isExempt ? "Lifetime Access" : subscription?.next_billing_date ? format(new Date(subscription.next_billing_date), "MMM d, yyyy") : "—";
    const displayInterval = isExempt ? "exempt" : subscription?.interval;

    // Fetch BasaltECHO balance live
    useEffect(() => {
        const fetchEchoBalance = async () => {
            try {
                const res = await fetch("/api/voicehub/credits");
                const data = await res.json();
                if (data.ok) {
                    setEchoBalance(data.balance);
                }
            } catch {
                // silently fail
            } finally {
                setEchoLoading(false);
            }
        };
        fetchEchoBalance();
    }, []);

    const handleDownloadInvoice = (invoice: any) => {
        try {
            downloadInvoicePDF(invoice);
            toast.success("Invoice PDF downloaded");
        } catch (e) {
            console.error("PDF generation failed", e);
            toast.error("Failed to generate PDF");
        }
    };

    const handleExportPDF = (invoiceList: any[], title = "Billing History") => {
        if (!invoiceList.length) return;
        try {
            downloadInvoicesSummaryPDF(invoiceList, title);
            toast.success("Summary PDF exported");
        } catch (e) {
            console.error("Summary PDF failed", e);
            toast.error("Failed to export PDF");
        }
    };

    const handleExportCSV = (invoiceList: any[], filename = "billing-history") => {
        if (!invoiceList.length) return;
        const headers = ["Invoice #", "Type", "Description", "Period", "Subtotal", "Discount", "Tax", "Total", "Status", "Date"];
        const rows = invoiceList.map((inv: any) => [
            inv.invoice_number,
            inv.type,
            `"${(inv.description || "").replace(/"/g, '""')}"`,
            `"${format(new Date(inv.period_start), "MMM d")} - ${format(new Date(inv.period_end), "MMM d, yyyy")}"`,
            inv.subtotal.toFixed(2),
            inv.discount.toFixed(2),
            inv.tax.toFixed(2),
            inv.total.toFixed(2),
            inv.payment_status,
            format(new Date(inv.createdAt), "MMM d, yyyy")
        ]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported");
    };

    // Calculate current month AI cost
    const totalAiCost = aiUsageSummary.reduce((sum: number, s: any) => sum + s.total_cost, 0);
    const totalAiRequests = aiUsageSummary.reduce((sum: number, s: any) => sum + s.request_count, 0);

    // Subscription info
    const subInvoices = invoices.filter((i: any) => i.type === "SUBSCRIPTION");
    const aiInvoices = invoices.filter((i: any) => i.type === "AI_USAGE");

    return (
        <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Subscription Status */}
                <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-all">
                    <CardContent className="p-5 relative">
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 -rotate-12 opacity-5 pointer-events-none">
                            <CreditCard className="w-full h-full text-indigo-500" />
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Subscription</div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold text-white tracking-tight">
                                {displayPlanName}
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            {subscription ? (
                                <>
                                    <Badge className={subscription.status === "ACTIVE" ? "bg-green-500/20 text-green-500 border-green-500/20" : "bg-yellow-500/20 text-yellow-500 border-yellow-500/20"}>
                                        {subscription.status}
                                    </Badge>
                                    <span className="text-[10px] text-zinc-500">${displayAmount} / {displayInterval}</span>
                                </>
                            ) : (
                                <span className="text-xs text-zinc-500">No active subscription</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Next Billing */}
                <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-all">
                    <CardContent className="p-5 relative">
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 -rotate-12 opacity-5 pointer-events-none">
                            <Calendar className="w-full h-full text-cyan-500" />
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Next Billing Date</div>
                        <div className="text-2xl font-bold text-cyan-400 tracking-tight">
                            {displayNextDate}
                        </div>
                        <div className="mt-2 text-[10px] text-zinc-500 font-medium">
                            {subscription?.billing_day ? `Billing day: ${subscription.billing_day}th` : "Not set"}
                        </div>
                    </CardContent>
                </Card>

                {/* AI Usage This Month */}
                <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-all">
                    <CardContent className="p-5 relative">
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 -rotate-12 opacity-5 pointer-events-none">
                            <Cpu className="w-full h-full text-violet-500" />
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">AI Usage (This Month)</div>
                        <div className="text-2xl font-bold text-violet-400 tracking-tight">
                            ${totalAiCost.toFixed(2)}
                        </div>
                        <div className="mt-2 text-[10px] text-zinc-500 font-medium">
                            {totalAiRequests} requests across {aiUsageSummary.length} services
                        </div>
                    </CardContent>
                </Card>

                {/* BasaltECHO Balance */}
                <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden group hover:border-zinc-700 transition-all">
                    <CardContent className="p-5 relative">
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 -rotate-12 opacity-5 pointer-events-none">
                            <Radio className="w-full h-full text-emerald-500" />
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">BasaltECHO Credits</div>
                        {echoLoading ? (
                            <div className="h-7 w-24 bg-zinc-800 animate-pulse rounded" />
                        ) : echoBalance ? (
                            <>
                                <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                                    {Math.floor((echoBalance.balanceSeconds || 0) / 60)} min
                                </div>
                                <div className="mt-2 text-[10px] text-zinc-500 font-medium">
                                    {echoBalance.plan || "Pay as you go"} • {echoBalance.unlimited ? "Unlimited" : `${echoBalance.balanceSeconds || 0}s remaining`}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-zinc-500 tracking-tight">—</div>
                                <div className="mt-2 text-[10px] text-zinc-500 font-medium">Not configured</div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for sections */}
            <Tabs defaultValue="subscription" className="w-full">
                <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
                    <TabsTrigger value="subscription" className="gap-2 data-[state=active]:bg-zinc-800">
                        <Receipt className="w-4 h-4" />
                        Subscription
                    </TabsTrigger>
                    <TabsTrigger value="ai-usage" className="gap-2 data-[state=active]:bg-zinc-800">
                        <Cpu className="w-4 h-4" />
                        AI Usage
                    </TabsTrigger>
                    <TabsTrigger value="echo" className="gap-2 data-[state=active]:bg-zinc-800">
                        <Radio className="w-4 h-4" />
                        BasaltECHO
                    </TabsTrigger>
                </TabsList>

                {/* Subscription Tab */}
                <TabsContent value="subscription" className="mt-4">
                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                        <CardHeader className="border-b border-zinc-800 bg-zinc-900/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-400" />
                                Subscription & Payment History
                            </CardTitle>
                            {subInvoices.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="gap-2 border-zinc-700 text-zinc-300 hover:text-white" onClick={() => handleExportPDF(subInvoices, "Subscription Invoices")}>
                                        <FileText className="w-3.5 h-3.5" />
                                        Export PDF
                                    </Button>
                                    <Button variant="outline" size="sm" className="gap-2 border-zinc-700 text-zinc-300 hover:text-white" onClick={() => handleExportCSV(subInvoices, "subscription-invoices")}>
                                        <Download className="w-3.5 h-3.5" />
                                        CSV
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            {subInvoices.length === 0 ? (
                                <div className="p-10 text-center text-zinc-500">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No subscription invoices yet</p>
                                    <p className="text-xs mt-1">Invoices will appear here after your first billing cycle.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-zinc-950">
                                        <TableRow className="border-zinc-800 hover:bg-transparent">
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Invoice #</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Period</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Plan</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Amount</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subInvoices.map((inv: any) => (
                                            <TableRow key={inv.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                                                <TableCell className="font-mono text-xs text-zinc-300">{inv.invoice_number}</TableCell>
                                                <TableCell className="text-xs text-zinc-400">
                                                    {format(new Date(inv.period_start), "MMM d")} — {format(new Date(inv.period_end), "MMM d, yyyy")}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/5 text-[10px]">
                                                        {inv.subscription?.plan_name || inv.description || "—"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold text-white">${inv.total.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        inv.payment_status === "PAID" ? "bg-green-500/20 text-green-500 border-green-500/20" :
                                                            inv.payment_status === "PENDING" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/20" :
                                                                inv.payment_status === "WAIVED" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/20" :
                                                                    "bg-red-500/20 text-red-500 border-red-500/20"
                                                    }>
                                                        {inv.payment_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-zinc-400">{format(new Date(inv.createdAt), "MMM d, yyyy")}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-zinc-400 hover:text-white" onClick={() => handleDownloadInvoice(inv)}>
                                                        <Download className="w-3.5 h-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI Usage Tab */}
                <TabsContent value="ai-usage" className="mt-4 space-y-4">
                    {/* Summary Cards */}
                    {aiUsageSummary.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {aiUsageSummary.map((s: any) => {
                                const meta = getServiceMeta(s.service);
                                const Icon = meta.icon;
                                return (
                                    <Card key={s.service} className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-all">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Icon className={`w-4 h-4 ${meta.color}`} />
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold truncate">{meta.label}</span>
                                            </div>
                                            <div className="text-lg font-bold text-white">${s.total_cost.toFixed(2)}</div>
                                            <div className="text-[10px] text-zinc-500 mt-1">{s.request_count} requests</div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* AI Usage Invoices */}
                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                        <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-violet-400" />
                                AI Consumption Receipts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {aiInvoices.length === 0 && aiUsageLogs.length === 0 ? (
                                <div className="p-10 text-center text-zinc-500">
                                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No AI usage recorded yet</p>
                                    <p className="text-xs mt-1">AI consumption will be tracked and billed monthly.</p>
                                </div>
                            ) : aiInvoices.length > 0 ? (
                                <Table>
                                    <TableHeader className="bg-zinc-950">
                                        <TableRow className="border-zinc-800 hover:bg-transparent">
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Invoice #</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Period</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Amount</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                                            <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {aiInvoices.map((inv: any) => (
                                            <TableRow key={inv.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                                                <TableCell className="font-mono text-xs text-zinc-300">{inv.invoice_number}</TableCell>
                                                <TableCell className="text-xs text-zinc-400">
                                                    {format(new Date(inv.period_start), "MMM d")} — {format(new Date(inv.period_end), "MMM d, yyyy")}
                                                </TableCell>
                                                <TableCell className="font-bold text-white">${inv.total.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        inv.payment_status === "PAID" ? "bg-green-500/20 text-green-500 border-green-500/20" :
                                                            inv.payment_status === "PENDING" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/20" :
                                                                "bg-red-500/20 text-red-500 border-red-500/20"
                                                    }>
                                                        {inv.payment_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-zinc-400">{format(new Date(inv.createdAt), "MMM d, yyyy")}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-zinc-400 hover:text-white" onClick={() => handleDownloadInvoice(inv)}>
                                                        <Download className="w-3.5 h-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                // Show usage logs if no invoices have been generated yet
                                <div className="p-6">
                                    <div className="text-xs text-zinc-400 mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                        Usage tracked — invoice will be generated at end of billing cycle.
                                    </div>
                                    <Table>
                                        <TableHeader className="bg-zinc-950">
                                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Service</TableHead>
                                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">User</TableHead>
                                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Tokens</TableHead>
                                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Cost</TableHead>
                                                <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Time</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {aiUsageLogs.slice(0, 50).map((log: any) => {
                                                const meta = getServiceMeta(log.service);
                                                const Icon = meta.icon;
                                                return (
                                                    <TableRow key={log.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                                                                <span className="text-xs text-zinc-300">{meta.label}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-zinc-400">{log.user?.name || log.user?.email || "—"}</TableCell>
                                                        <TableCell className="font-mono text-xs text-zinc-400">
                                                            {(log.tokens_in + log.tokens_out).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-white">${log.cost.toFixed(4)}</TableCell>
                                                        <TableCell className="text-[10px] text-zinc-500">{format(new Date(log.createdAt), "MMM d, HH:mm")}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* BasaltECHO Tab */}
                <TabsContent value="echo" className="mt-4">
                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                        <CardHeader className="border-b border-zinc-800 bg-zinc-900/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Radio className="w-5 h-5 text-emerald-400" />
                                BasaltECHO Credit Balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {echoLoading ? (
                                <div className="space-y-3">
                                    <div className="h-6 w-48 bg-zinc-800 animate-pulse rounded" />
                                    <div className="h-4 w-72 bg-zinc-800 animate-pulse rounded" />
                                </div>
                            ) : echoBalance ? (
                                <div className="space-y-6">
                                    {/* Balance Overview */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-5 rounded-2xl bg-zinc-800/30 border border-zinc-700/50">
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-2">Purchased</div>
                                            <div className="text-3xl font-bold text-emerald-400 tracking-tight font-mono">
                                                {Math.floor((echoBalance.purchasedSeconds || 0) / 60)}
                                                <span className="text-sm font-medium text-zinc-400 ml-1">min</span>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-zinc-800/30 border border-zinc-700/50">
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-2">Used</div>
                                            <div className="text-3xl font-bold text-amber-400 tracking-tight font-mono">
                                                {Math.floor((echoBalance.usedSeconds || 0) / 60)}
                                                <span className="text-sm font-medium text-zinc-400 ml-1">min</span>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-zinc-800/30 border border-zinc-700/50">
                                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-2">Remaining</div>
                                            <div className="text-3xl font-bold text-cyan-400 tracking-tight font-mono">
                                                {echoBalance.unlimited ? "∞" : Math.floor((echoBalance.balanceSeconds || 0) / 60)}
                                                {!echoBalance.unlimited && <span className="text-sm font-medium text-zinc-400 ml-1">min</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Usage Progress Bar */}
                                    {!echoBalance.unlimited && echoBalance.purchasedSeconds > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-zinc-400">
                                                <span>Usage</span>
                                                <span>{Math.round(((echoBalance.usedSeconds || 0) / echoBalance.purchasedSeconds) * 100)}%</span>
                                            </div>
                                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, ((echoBalance.usedSeconds || 0) / echoBalance.purchasedSeconds) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Plan Info */}
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/20 border border-zinc-700/30">
                                        <Zap className="w-5 h-5 text-emerald-400" />
                                        <div>
                                            <div className="text-sm font-bold text-white">{echoBalance.plan || "Pay As You Go"}</div>
                                            {echoBalance.planExpiry && (
                                                <div className="text-[10px] text-zinc-500">Expires: {format(new Date(echoBalance.planExpiry), "MMM d, yyyy")}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Radio className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                                    <p className="text-zinc-500 font-medium">BasaltECHO not configured</p>
                                    <p className="text-xs text-zinc-600 mt-1">Configure your BasaltECHO integration to view credit balance.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

