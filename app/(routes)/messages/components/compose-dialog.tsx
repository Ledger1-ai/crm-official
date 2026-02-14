"use client";
import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TeamMember } from "./messages";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface ComposeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamMembers: TeamMember[];
    currentUserId: string;
}

export function ComposeDialog({ open, onOpenChange, teamMembers, currentUserId }: ComposeDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        to: "",
        subject: "",
        body: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipient_ids: [formData.to],
                    subject: formData.subject,
                    body_text: formData.body,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            toast({
                title: "Message sent",
                description: "Your message has been sent successfully.",
            });

            setFormData({ to: "", subject: "", body: "" });
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableRecipients = teamMembers.filter(m => m.id !== currentUserId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="to">To</Label>
                        <Select
                            value={formData.to}
                            onValueChange={(value) => setFormData({ ...formData, to: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select recipient" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRecipients.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.name || member.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="Message subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="body">Message</Label>
                        <Textarea
                            id="body"
                            placeholder="Write your message..."
                            className="min-h-[200px]"
                            value={formData.body}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !formData.to || !formData.subject}>
                            {isSubmitting ? "Sending..." : "Send"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
