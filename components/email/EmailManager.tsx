"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface EmailManagerProps {
    teamId: string;
}

interface EmailItem {
    id: string;
    lead: {
        firstName: string;
        lastName: string;
        email: string;
        company: string;
    };
    subject: string;
    body_text?: string;
    body_html?: string;
    sentAt: string;
    status: string;
}

export function EmailManager({ teamId }: EmailManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emails, setEmails] = useState<EmailItem[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                search,
                status: statusFilter === "ALL" ? "" : statusFilter
            });
            const res = await fetch(`/api/teams/${teamId}/emails?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setEmails(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch emails", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchEmails();
        }
    }, [isOpen, page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) {
                setPage(1); // Reset to page 1 on search change
                fetchEmails();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRefresh = () => {
        fetchEmails();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Manage Emails</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Email History</DialogTitle>
                    <DialogDescription>
                        View and manage all emails sent by your team.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-4 py-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search recipient, subject, company..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="SENT">Sent</SelectItem>
                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                            <SelectItem value="OPENED">Opened</SelectItem>
                            <SelectItem value="CLICKED">Clicked</SelectItem>
                            <SelectItem value="REPLIED">Replied</SelectItem>
                            <SelectItem value="BOUNCED">Bounced</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={handleRefresh}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <div className="flex-1 overflow-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Sent At</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && emails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : emails.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No emails found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                emails.map((email) => (
                                    <TableRow key={email.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {email.lead?.firstName} {email.lead?.lastName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {email.lead?.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate" title={email.subject}>
                                            {email.subject || "(No Subject)"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                email.status === 'SENT' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                    email.status === 'FAILED' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                        'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                            }>
                                                {email.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {email.sentAt ? format(new Date(email.sentAt), "MMM d, h:mm a") : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(email)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Page {page} of {totalPages || 1}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Detail View Dialog (Nested or Overlay) */}
                {selectedEmail && (
                    <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Email Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-semibold text-muted-foreground">To:</span>
                                        <div className="mt-1">{selectedEmail.lead?.email}</div>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-muted-foreground">Sent:</span>
                                        <div className="mt-1">
                                            {selectedEmail.sentAt ? format(new Date(selectedEmail.sentAt), "PPpp") : "-"}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="font-semibold text-muted-foreground">Subject:</span>
                                        <div className="mt-1 font-medium">{selectedEmail.subject}</div>
                                    </div>
                                </div>
                                <div className="border rounded-md p-4 bg-muted/20 max-h-[400px] overflow-auto whitespace-pre-wrap font-mono text-sm">
                                    {selectedEmail.body_text || selectedEmail.body_html || "No content available."}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </DialogContent>
        </Dialog>
    );
}
