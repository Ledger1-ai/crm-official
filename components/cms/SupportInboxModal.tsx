"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getSupportTickets } from "@/actions/cms/support-tickets";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, ExternalLink, RefreshCw, Mail } from "lucide-react";

interface SupportInboxModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SupportInboxModal({ isOpen, onClose }: SupportInboxModalProps) {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [pushing, setPushing] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        const data = await getSupportTickets();
        setTickets(data);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchTickets();
        }
    }, [isOpen]);

    const pushToJira = async (ticketId: string) => {
        setPushing(true);
        try {
            const res = await fetch('/api/cms/support/jira', {
                method: 'POST',
                body: JSON.stringify({ ticketId })
            });
            if (res.ok) {
                const data = await res.json();
                // Update local state
                setTickets(prev => prev.map(t =>
                    t.id === ticketId
                        ? { ...t, status: "JIRA_CREATED", jiraTicketId: data.jiraId }
                        : t
                ));
                if (selectedTicket?.id === ticketId) {
                    setSelectedTicket(prev => ({ ...prev, status: "JIRA_CREATED", jiraTicketId: data.jiraId }));
                }
            } else {
                alert("Failed to push to Jira");
            }
        } catch (error) {
            console.error("Jira push failed");
        }
        setPushing(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[600px] bg-[#0F1115] border border-cyan-500/20 text-cyan-50 p-0 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] rounded-2xl flex flex-col">
                <DialogTitle className="sr-only">Support Inbox</DialogTitle>

                {/* Header */}
                <div className="bg-cyan-950/30 border-b border-cyan-500/20 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-cyan-400" />
                        <h2 className="text-lg font-bold tracking-wide text-white uppercase">Support Inbox</h2>
                    </div>
                    <button onClick={fetchTickets} className="p-2 hover:bg-white/5 rounded-full text-cyan-400 disabled:opacity-50">
                        <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Ticket List */}
                    <div className="w-1/3 border-r border-cyan-500/10 overflow-y-auto bg-black/20">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-cyan-500" /></div>
                        ) : (
                            tickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedTicket?.id === ticket.id ? "bg-cyan-950/30 border-l-2 border-l-cyan-400" : ""}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm text-white truncate max-w-[70%]">{ticket.name}</span>
                                        <span className="text-[10px] text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium mb-1 truncate">{ticket.subject || "No Subject"}</p>
                                    <div className="flex justify-between items-center">
                                        <Badge variant="outline" className={`text-[10px] h-5 ${ticket.source === "PRICING" ? "border-purple-500/50 text-purple-400 bg-purple-500/10" : "border-green-500/50 text-green-400 bg-green-500/10"}`}>
                                            {ticket.source}
                                        </Badge>
                                        {ticket.status === "JIRA_CREATED" && (
                                            <span className="text-[10px] text-blue-400 font-mono">{ticket.jiraTicketId}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {!loading && tickets.length === 0 && (
                            <p className="text-center text-gray-500 p-8 text-sm">No tickets found.</p>
                        )}
                    </div>

                    {/* Ticket Detail */}
                    <div className="flex-1 overflow-y-auto p-6 bg-[#0F1115]">
                        {selectedTicket ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{selectedTicket.subject || "No Subject"}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                            <span>{selectedTicket.name}</span>
                                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                            <span>{selectedTicket.email}</span>
                                        </div>
                                    </div>
                                    {selectedTicket.status === "JIRA_CREATED" ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-md">
                                            <span className="text-blue-400 text-xs font-mono font-bold">{selectedTicket.jiraTicketId}</span>
                                            <ExternalLink className="h-3 w-3 text-blue-400" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => pushToJira(selectedTicket.id)}
                                            disabled={pushing}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            Push to Jira
                                        </button>
                                    )}
                                </div>

                                <div className="bg-black/40 border border-white/5 rounded-xl p-6 min-h-[200px] text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedTicket.message}
                                </div>

                                <div className="pt-4 border-t border-white/5 flex gap-2">
                                    {/* Placeholder for reply implementation */}
                                    <button className="text-xs text-gray-500 hover:text-white transition-colors">Reply via Email</button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <Mail className="h-12 w-12 mb-4 opacity-20" />
                                <p>Select a ticket to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
