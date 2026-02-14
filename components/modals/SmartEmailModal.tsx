"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useCompletion } from "@ai-sdk/react";
import {
    Loader2,
    Mail,
    Wand2,
    Send,
    ShieldCheck,
    MousePointerClick,
    Eye,
    CheckCircle2,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface SmartEmailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recipientEmail: string;
    recipientName?: string;
    leadId?: string;
    contactId?: string;
    accountId?: string;
}

export function SmartEmailModal({
    open,
    onOpenChange,
    recipientEmail,
    recipientName,
    leadId,
    contactId,
    accountId,
}: SmartEmailModalProps) {
    const [loading, setLoading] = useState(false);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [trackClicks, setTrackClicks] = useState(true);
    const [trackOpens, setTrackOpens] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);

    const { toast } = useToast();

    const { complete, completion, isLoading: isAiLoading } = useCompletion({
        api: "/api/ai/enhance-email",
        onFinish: (prompt, result) => {
            setMessage(result);
            toast({ title: "Email optimized by AI" });
        },
    });

    const handleEnhance = async () => {
        if (!message) {
            toast({
                variant: "destructive",
                title: "Nothing to enhance",
                description: "Please write a draft first.",
            });
            return;
        }
        await complete(message, {
            body: {
                subject,
                instruction: "Make it more professional, persuasive, and clear. Keep the tone friendly but corporate."
            }
        });
    };

    const onSend = async () => {
        if (!subject || !message) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please provide both a subject and a message.",
            });
            return;
        }

        try {
            setLoading(true);
            await axios.post("/api/email/send", {
                to: recipientEmail,
                subject,
                text: message,
                leadId,
                contactId,
                accountId,
                trackClicks,
                trackOpens,
            });

            setIsSuccess(true);
            toast({
                title: "Email Sent",
                description: "Your message is on its way and being tracked.",
            });

            setTimeout(() => {
                onOpenChange(false);
                setSubject("");
                setMessage("");
                setIsSuccess(false);
            }, 2000);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Delivery Failed",
                description: "Check your connection or email settings.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-[#0a0a0a] border-white/10 shadow-2xl">
                <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-6 border-b border-white/5">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                <Mail className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white tracking-tight">Compose Tracking Email</DialogTitle>
                                <DialogDescription className="text-white/50 text-xs">
                                    Sending as <span className="text-emerald-400 font-medium">{process.env.NEXT_PUBLIC_APP_NAME || "Basalt CRM"}</span> to {recipientName || recipientEmail}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/50">
                            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Message Sent!</h3>
                        <p className="text-white/50 text-sm">Logging activity to lead timeline...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-white/40">Recipient</Label>
                                        <div className="h-10 px-3 rounded-lg border border-white/5 bg-white/[0.02] flex items-center text-sm text-white/70">
                                            {recipientEmail}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-white/40">Subject Line</Label>
                                        <Input
                                            id="subject"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Special follow up regarding..."
                                            className="h-10 bg-white/[0.02] border-white/10 focus:border-emerald-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 space-y-4">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 block">Tracking & Intelligence</Label>

                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                <MousePointerClick className="h-3.5 w-3.5 text-orange-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-white/80">CTR Tracking</span>
                                                <span className="text-[10px] text-white/30 truncate max-w-[120px]">Detect when links are clicked</span>
                                            </div>
                                        </div>
                                        <Switch checked={trackClicks} onCheckedChange={setTrackClicks} />
                                    </div>

                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Eye className="h-3.5 w-3.5 text-blue-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-white/80">Open Tracking</span>
                                                <span className="text-[10px] text-white/30 truncate max-w-[120px]">Know if they read it</span>
                                            </div>
                                        </div>
                                        <Switch checked={trackOpens} onCheckedChange={setTrackOpens} />
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/50" />
                                        <span className="text-[10px] text-white/30 italic">Activity will be logged to CRM timeline</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-white/40">Message Body</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 rounded-full"
                                        onClick={handleEnhance}
                                        disabled={isAiLoading || !message}
                                    >
                                        {isAiLoading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1.5 h-3 w-3" />}
                                        {isAiLoading ? "OPTIMIZING..." : "OPTIMIZE WITH AI"}
                                    </Button>
                                </div>
                                <div className="relative">
                                    <Textarea
                                        id="message"
                                        value={isAiLoading ? completion : message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your professional message here..."
                                        className="min-h-[220px] bg-white/[0.02] border-white/10 focus:border-emerald-500/50 resize-none leading-relaxed"
                                    />
                                    {isAiLoading && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px] rounded-md">
                                            <div className="flex items-center gap-2 bg-black border border-white/10 px-4 py-2 rounded-full shadow-2xl">
                                                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                                                <span className="text-xs font-medium text-white">AI is crafting your response...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-[#0f0f0f] border-t border-white/5 flex items-center justify-between">
                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                                className="text-white/40 hover:text-white hover:bg-white/5"
                            >
                                Discard Draft
                            </Button>
                            <Button
                                onClick={onSend}
                                disabled={loading || !subject || !message}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/20"
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                SEND TRACKED EMAIL
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
