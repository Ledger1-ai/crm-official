
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Phone, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendInvoice } from "@/actions/invoice/send-invoice";
import { sendInvoiceSMS } from "@/actions/invoice/send-sms";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: any;
}

export function SendInvoiceDialog({ open, onOpenChange, invoice }: Props) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState(invoice.partner_email || "");
    const [phone, setPhone] = useState(invoice.partner_phone_number || "");
    const [mode, setMode] = useState<"email" | "sms">("email");

    const onSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let result;
            if (mode === "email") {
                result = await sendInvoice(invoice.id, email);
            } else {
                result = await sendInvoiceSMS(invoice.id, phone);
            }

            if (result.success) {
                toast.success(result.message);
                onOpenChange(false);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Send Invoice</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Deliver the payment link to your client via email or text.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800">
                        <TabsTrigger value="email" className="data-[state=active]:bg-zinc-800">
                            <Mail className="w-4 h-4 mr-2" /> Email
                        </TabsTrigger>
                        <TabsTrigger value="sms" className="data-[state=active]:bg-zinc-800">
                            <MessageSquare className="w-4 h-4 mr-2" /> Text
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={onSend} className="space-y-6 mt-6">
                        <TabsContent value="email" className="mt-0">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-400">Client Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="client@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-zinc-900 border-zinc-800 focus:ring-blue-500"
                                        required={mode === "email"}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="sms" className="mt-0">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-zinc-400">Client Phone Number (E.164)</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+15550001234"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="pl-10 bg-zinc-900 border-zinc-800 focus:ring-blue-500"
                                        required={mode === "sms"}
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-1">Must include country code (e.g. +1)</p>
                            </div>
                        </TabsContent>

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Send via {mode === "email" ? "Email" : "Text"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
