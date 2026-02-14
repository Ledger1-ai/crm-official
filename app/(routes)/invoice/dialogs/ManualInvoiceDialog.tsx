
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { createManualInvoice } from "@/actions/invoice/create-manual-invoice";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

export function ManualInvoiceDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale as string;

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await createManualInvoice(formData);

            if (result.success && result.invoiceId) {
                toast.success("Invoice created!");
                setOpen(false);
                router.push(`/${locale}/invoice/detail/${result.invoiceId}`);
            } else {
                toast.error(result.error || "Failed");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="group relative overflow-hidden rounded-2xl border border-[#27272a] bg-[#09090b] p-3 transition-all duration-300 h-[110px] w-full cursor-pointer hover:border-primary/50">
                    <PlusCircle
                        className="absolute -right-4 -bottom-4 w-32 h-32 -rotate-12 transition-colors duration-500 pointer-events-none opacity-10 group-hover:opacity-20 text-emerald-400"
                    />
                    <div className="relative z-10 w-full h-full flex flex-col justify-center items-start pl-1">
                        <div className="space-y-0.5">
                            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 group-hover:text-foreground transition-colors">
                                Create New
                            </span>
                            <span className="block text-xl font-bold tracking-tight text-foreground">
                                Manual Invoice
                            </span>
                        </div>
                    </div>
                    {/* Subtle Glow on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Manual Invoice</DialogTitle>
                    <DialogDescription>
                        Create a simple invoice for testing payments or manual billing.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="number" className="text-right">
                                Number
                            </Label>
                            <Input
                                id="number"
                                name="number"
                                placeholder="INV-001"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount ($)
                            </Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="100.00"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Input
                                id="description"
                                name="description"
                                placeholder="Consulting Services"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Invoice
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
