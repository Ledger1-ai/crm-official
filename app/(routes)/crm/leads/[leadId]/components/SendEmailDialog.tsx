
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useCompletion } from "@ai-sdk/react";
import { Loader2, Mail, Wand2, Sparkles } from "lucide-react";

interface SendEmailDialogProps {
    recipientEmail: string;
    trigger?: React.ReactNode;
}

export function SendEmailDialog({ recipientEmail, trigger }: SendEmailDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    // AI Integration
    const { complete, completion, isLoading: isAiLoading, setCompletion } = useCompletion({
        api: "/api/ai/enhance-email",
        onFinish: (prompt, result) => {
            setMessage(result);
            setCompletion("");
            toast({ title: "Email enhanced successfully" });
        },
        onError: (error) => {
            toast({ variant: "destructive", title: "AI Error", description: "Failed to enhance email." });
        }
    });

    const handleEnhance = async () => {
        if (!message) {
            toast({ variant: "destructive", title: "Empty Message", description: "Write a draft first for the AI to enhance." });
            return;
        }
        await complete(message, { body: { subject, instruction: "Fix grammar and make it more professional" } });
    };

    const onSend = async () => {
        if (!subject || !message) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please fill in all fields.",
            });
            return;
        }

        try {
            setLoading(true);
            await axios.post("/api/email/send", {
                to: recipientEmail,
                subject,
                text: message,
            });

            toast({
                title: "Success",
                description: "Email sent successfully.",
            });
            setOpen(false);
            setSubject("");
            setMessage("");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send email.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Send Email to {recipientEmail}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter subject..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="message">Message</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={handleEnhance}
                                disabled={isAiLoading || !message}
                            >
                                {isAiLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Wand2 className="mr-2 h-3 w-3" />}
                                {isAiLoading ? "Enhancing..." : "Enhance with AI"}
                            </Button>
                        </div>
                        <Textarea
                            id="message"
                            value={isAiLoading ? completion : message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            className="h-[200px]"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={onSend} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Email
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
