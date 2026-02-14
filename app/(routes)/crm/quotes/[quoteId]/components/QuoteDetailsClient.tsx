"use client";

import { useState, useRef } from "react";
import {
    FileText,
    Printer,
    Mail,
    ChevronLeft,
    Download,
    Building2,
    User,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Package,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";

interface QuoteItem {
    id: string;
    product: {
        name: string;
        sku: string;
    };
    quantity: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
}

interface Quote {
    id: string;
    title: string;
    quoteNumber: string;
    status: string;
    totalAmount: number;
    expirationDate: string | null;
    createdAt: string;
    account?: { name: string; address?: string };
    contact?: { first_name: string; last_name: string; email?: string };
    items: QuoteItem[];
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    DRAFT: { label: "Draft", color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: Clock },
    SENT: { label: "Sent", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: ExternalLink },
    ACCEPTED: { label: "Accepted", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
    REJECTED: { label: "Rejected", color: "bg-rose-500/10 text-rose-500 border-rose-500/20", icon: XCircle },
    EXPIRED: { label: "Expired", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AlertCircle },
};

// Import ExternalLink since statusMap uses it but it wasn't in the initial list
import { ExternalLink } from "lucide-react";

export default function QuoteDetailsClient({ quote }: { quote: Quote }) {
    const router = useRouter();
    const contentRef = useRef<HTMLDivElement>(null);
    const [isEmailing, setIsEmailing] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Quote_${quote.quoteNumber}`,
    });

    const sendEmail = async () => {
        setIsEmailing(true);
        try {
            const response = await fetch(`/api/crm/quotes/${quote.id}/send-email`, {
                method: "POST"
            });
            const result = await response.json();
            if (response.ok) {
                toast.success("Quote sent to client successfully!");
            } else {
                toast.error(result.error || "Failed to send quote");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsEmailing(false);
        }
    };

    const StatusIcon = statusMap[quote.status]?.icon || Clock;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 border-b">
                <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                    Back to List
                </Button>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => handlePrint()}>
                        <Printer className="h-4 w-4" />
                        Print / PDF
                    </Button>
                    <Button
                        className="gap-2 bg-primary"
                        onClick={sendEmail}
                        disabled={isEmailing}
                    >
                        {isEmailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Send via Email
                    </Button>
                </div>
            </div>

            {/* Quote Content (Printable Area) */}
            <Card ref={contentRef} className="border-none shadow-none bg-card">
                <CardHeader className="flex flex-row items-start justify-between pb-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <FileText className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight">{quote.title}</h1>
                                <p className="text-muted-foreground font-mono">{quote.quoteNumber}</p>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={cn("gap-1.5 px-3 py-1 font-bold text-sm", statusMap[quote.status]?.color)}
                        >
                            <StatusIcon className="h-4 w-4" />
                            {statusMap[quote.status]?.label}
                        </Badge>
                    </div>

                    <div className="text-right space-y-2">
                        <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Proposal Date</div>
                        <div className="text-lg font-semibold">{format(new Date(quote.createdAt), "MMMM dd, yyyy")}</div>
                        <div className="pt-4">
                            <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Valid Until</div>
                            <div className="text-lg font-semibold text-rose-600">
                                {quote.expirationDate ? format(new Date(quote.expirationDate), "MMMM dd, yyyy") : "N/A"}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-12">
                    {/* Billing info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                <Building2 className="h-3 w-3" />
                                Prepared for
                            </h2>
                            <div className="p-4 rounded-xl border bg-muted/30 space-y-1">
                                <div className="font-bold text-lg">{quote.account?.name || "No Account"}</div>
                                {quote.contact && (
                                    <div className="text-sm text-muted-foreground">
                                        Attn: {quote.contact.first_name} {quote.contact.last_name}
                                    </div>
                                )}
                                {quote.contact?.email && (
                                    <div className="text-sm text-primary font-medium">{quote.contact.email}</div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4 text-right">
                            <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2 justify-end">
                                <Calendar className="h-3 w-3" />
                                Issuing Entity
                            </h2>
                            <div className="space-y-1">
                                <div className="font-bold text-lg">Basalt Echo CRM</div>
                                <div className="text-sm text-muted-foreground italic">Powered by Advanced Agentic Coding</div>
                                <div className="text-sm text-muted-foreground uppercase text-[10px]">Financial Services Division</div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Pricing Configuration</h2>
                        <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="pl-6">Description</TableHead>
                                        <TableHead className="w-24 text-center">Qty</TableHead>
                                        <TableHead className="w-32 text-right">Unit Price</TableHead>
                                        <TableHead className="w-24 text-center">Disc %</TableHead>
                                        <TableHead className="text-right pr-6">Line Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quote.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">{item.product.name}</span>
                                                    <span className="text-[10px] font-mono text-muted-foreground leading-none">{item.product.sku}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-mono">${item.unitPrice.toLocaleString()}</TableCell>
                                            <TableCell className="text-center">
                                                {item.discount > 0 ? (
                                                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
                                                        -{item.discount}%
                                                    </Badge>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right pr-6 font-bold font-mono text-primary">
                                                ${item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end pt-6">
                        <div className="w-full sm:w-80 space-y-3">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span className="text-muted-foreground">Original Subtotal</span>
                                <span className="font-mono">${quote.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span className="text-muted-foreground">Volume Discount Applied</span>
                                <span className="font-mono text-emerald-600">
                                    -${(quote.items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0) - quote.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-lg font-black uppercase tracking-tighter">Total Proposal</span>
                                <span className="text-3xl font-black text-primary font-mono tabular-nums">
                                    ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                        <h3 className="text-xs font-black uppercase text-primary tracking-widest mb-3 flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" />
                            Terms & Conditions
                        </h3>
                        <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4 italic">
                            <li>All prices are quoted in USD and subject to applicable taxes.</li>
                            <li>This proposal is strictly valid until the expiration date shown above.</li>
                            <li>Standard implementation timelines begin upon acceptance and deposit payment.</li>
                            <li>Pricing includes 12 months of premium support and maintenance.</li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-center border-t py-8 bg-muted/20 mt-12">
                    <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                        <Download className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Generated Securely by Basalt Echo</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
