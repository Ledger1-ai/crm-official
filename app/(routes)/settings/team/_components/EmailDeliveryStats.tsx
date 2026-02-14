"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, MailCheck } from "lucide-react";
import { format } from "date-fns";
import { EmailManager } from "./EmailManager";

interface EmailDeliveryStatsProps {
    teamId: string;
}

interface SentItem {
    id: string;
    lead: {
        firstName: string;
        lastName: string;
        email: string;
        company: string;
    };
    subject: string;
    sentAt: string; // or updatedAt if sentAt not available
    status: string;
}

export function EmailDeliveryStats({ teamId }: EmailDeliveryStatsProps) {
    const [stats, setStats] = useState<SentItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!teamId) return;
        fetchStats();
    }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchStats = async () => {
        setLoading(true);
        try {
            // We need a new endpoint for this: /api/teams/[teamId]/email-stats
            const res = await fetch(`/api/teams/${teamId}/email-stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch email stats", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MailCheck className="w-5 h-5 text-primary" />
                    Recent Deliveries
                </CardTitle>
                <CardDescription>
                    Tracking the last 10 emails sent via your team configuration.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-end mb-4">
                    <EmailManager teamId={teamId} />
                </div>
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : stats.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No emails sent yet.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Sent At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.lead.firstName} {item.lead.lastName}</span>
                                            <span className="text-xs text-muted-foreground">{item.lead.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={item.subject}>
                                        {item.subject}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {item.sentAt ? format(new Date(item.sentAt), "MMM d, h:mm a") : "-"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
