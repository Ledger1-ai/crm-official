"use client";

import { useState, useMemo } from "react";
import {
    Plus,
    Trash2,
    Calculator,
    ChevronLeft,
    Save,
    Search,
    Package,
    ShoppingCart,
    Info,
    Calendar,
    User,
    Building2,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { createQuote } from "@/actions/crm/quotes";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    description?: string;
    category?: string;
}

interface QuoteBuilderClientProps {
    products: Product[];
    accounts: { id: string, name: string }[];
    contacts: { id: string, first_name: string, last_name: string, account?: string }[];
}

interface LineItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number; // percentage
}

export default function QuoteBuilderClient({ products, accounts, contacts }: QuoteBuilderClientProps) {
    const router = useRouter();
    const [title, setTitle] = useState(`New Proposal - ${format(new Date(), "PP")}`);
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    const [selectedContact, setSelectedContact] = useState<string>("");
    const [expirationDate, setExpirationDate] = useState<string>(
        format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd") // 30 days default
    );
    const [items, setItems] = useState<LineItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Derived values
    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }, [items]);

    const totalDiscount = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.discount / 100)), 0);
    }, [items]);

    const total = subtotal - totalDiscount;

    const addItem = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setItems([...items, {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 1,
            unitPrice: product.price,
            discount: 0
        }]);
        toast.success(`Added ${product.name} to quote`);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof LineItem, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const handleSave = async () => {
        if (!selectedAccount) {
            toast.error("Please select an account");
            return;
        }
        if (items.length === 0) {
            toast.error("Please add at least one item to the quote");
            return;
        }

        setIsSaving(true);
        try {
            const res = await createQuote({
                title,
                accountId: selectedAccount,
                contactId: selectedContact || undefined,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    discount: Number(item.discount),
                    totalPrice: (item.quantity * item.unitPrice) * (1 - item.discount / 100)
                })),
                totalAmount: total,
                expirationDate: new Date(expirationDate)
            });

            if (res.success) {
                toast.success("Quote created successfully!");
                router.push("/crm/quotes");
            } else {
                toast.error(res.error || "Failed to create quote");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Configuration & Items */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            Proposal Header
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider underline decoration-primary/40 underline-offset-4 mb-2 block">
                                Quote Title
                            </label>
                            <Input
                                placeholder="e.g. Enterprise Software License Q1"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider underline decoration-primary/40 underline-offset-4 mb-2 block">
                                Expiration Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={expirationDate}
                                    onChange={(e) => setExpirationDate(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider underline decoration-primary/40 underline-offset-4 mb-2 block">
                                Account
                            </label>
                            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Select an account" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider underline decoration-primary/40 underline-offset-4 mb-2 block">
                                Primary Contact
                            </label>
                            <Select value={selectedContact} onValueChange={setSelectedContact}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Select a contact" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {contacts.filter(c => !selectedAccount || c.account === selectedAccount).map(con => (
                                        <SelectItem key={con.id} value={con.id}>{con.first_name} {con.last_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Line Items
                        </CardTitle>
                        <Select onValueChange={addItem}>
                            <SelectTrigger className="w-[250px] bg-primary text-primary-foreground border-none">
                                <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    <span>Add Product</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{p.name}</span>
                                            <span className="text-[10px] text-muted-foreground">SKU: {p.sku} | ${p.price}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="pl-6">Product</TableHead>
                                    <TableHead className="w-24">Qty</TableHead>
                                    <TableHead className="w-32">Unit Price</TableHead>
                                    <TableHead className="w-24">Disc %</TableHead>
                                    <TableHead className="text-right pr-6">Total</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-8 w-8 opacity-20" />
                                                <p className="text-sm italic">No products added yet. Use the button above to start.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{item.productName}</span>
                                                    <span className="text-[10px] uppercase font-mono text-muted-foreground">{item.sku}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                    className="h-8 text-center"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                                                    <Input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                                                        className="h-8 pl-5 text-right font-mono"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    max="100"
                                                    min="0"
                                                    value={item.discount}
                                                    onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))}
                                                    className="h-8 text-center"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold pr-6">
                                                ${((item.quantity * item.unitPrice) * (1 - item.discount / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="pr-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(idx)}
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Totals & Actions */}
            <div className="space-y-6">
                <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-primary" />
                            Quote Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-mono">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Discount</span>
                            <span className="font-mono text-emerald-600">-${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="font-bold">Estimated Total</span>
                            <span className="text-2xl font-black text-primary font-mono">
                                ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="pt-4 space-y-3">
                            <Button
                                className="w-full h-12 text-lg font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                Finalize & Save Quote
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-10 gap-2 font-semibold"
                                onClick={() => router.back()}
                                disabled={isSaving}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Discard Changes
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t p-4">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-muted-foreground italic">
                                Once saved, this quote will be assigned a unique ID and can be exported as a PDF or sent directly to the client via email.
                            </p>
                        </div>
                    </CardFooter>
                </Card>

                {/* Quick Tips */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg h-fit">
                            <Calculator className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-primary">CPQ AI Assistant</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                You can adjust unit prices and apply discounts per line item. The system automatically recalculates the total in real-time.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
