"use client";
import React, { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Eye, UserPlus, Check, X, Filter, ChevronDown, ChevronRight, Mail, Phone, Building, Trash2, Archive, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

interface FormSubmission {
    id: string;
    form_id: string;
    data: Record<string, any>;
    extracted_email: string | null;
    extracted_phone: string | null;
    extracted_name: string | null;
    extracted_company: string | null;
    status: string;
    lead_id: string | null;
    source_url: string | null;
    createdAt: Date;
    form: {
        id: string;
        name: string;
        slug: string;
    };
}

interface Form {
    id: string;
    name: string;
    slug: string;
}

interface FormSubmissionsViewProps {
    submissions: FormSubmission[];
    forms: Form[];
    initialFormId?: string;
    disableFormSelect?: boolean;
}

export function FormSubmissionsView({ submissions, forms, initialFormId = "all", disableFormSelect = false }: FormSubmissionsViewProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [selectedFormId, setSelectedFormId] = useState<string>(initialFormId);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [isCreatingLead, setIsCreatingLead] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [emailRecipient, setEmailRecipient] = useState("");
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [includeSubmissionData, setIncludeSubmissionData] = useState(true);
    const [includePdf, setIncludePdf] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const filteredSubmissions = submissions.filter((s) => {
        if (selectedFormId !== "all" && s.form_id !== selectedFormId) return false;
        if (statusFilter !== "all" && s.status !== statusFilter) return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                (s.extracted_name && s.extracted_name.toLowerCase().includes(query)) ||
                (s.extracted_email && s.extracted_email.toLowerCase().includes(query)) ||
                (s.extracted_company && s.extracted_company.toLowerCase().includes(query)) ||
                (s.form?.name && s.form.name.toLowerCase().includes(query))
            );
        }

        return true;
    });

    const handleViewDetails = (submission: FormSubmission) => {
        setSelectedSubmission(submission);
        setShowDetailDialog(true);
    };

    const handleOpenEmail = (submission: FormSubmission) => {
        setSelectedSubmission(submission);
        setEmailRecipient(submission.extracted_email || "");
        setEmailSubject(`Submission for ${submission.form?.name}`);
        setIncludeSubmissionData(true);
        setIncludePdf(false);

        const intro = `Hello,\n\nI'm sharing a submission from ${submission.form?.name} that needs review.`;
        setEmailBody(intro);
        setShowEmailDialog(true);
    };

    const handleSendEmail = async () => {
        if (!selectedSubmission?.extracted_email) return;

        setIsSendingEmail(true);

        let finalBody = emailBody;
        if (includeSubmissionData && selectedSubmission) {
            const formattedData = Object.entries(selectedSubmission.data)
                .map(([key, value]) => `• ${key.replace(/_/g, " ").toUpperCase()}: ${value}`)
                .join("\n");
            finalBody += `\n\n--- Submission Details ---\n${formattedData}\n\nView in CRM: ${window.location.origin}/crm/leads/${selectedSubmission.lead_id || "submission-" + selectedSubmission.id}`;
        }

        try {
            const res = await fetch("/api/forms/submissions/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionId: selectedSubmission.id,
                    to: emailRecipient,
                    subject: emailSubject,
                    body: finalBody,
                    includePdf: includePdf,
                }),
            });

            if (!res.ok) throw new Error("Failed to send email");

            toast({
                title: "Success",
                description: "Email sent successfully",
            });
            setShowEmailDialog(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send email",
                variant: "destructive",
            });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const toggleRowExpanded = (id: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleAction = async (submissionId: string, action: 'delete' | 'archive') => {
        setIsProcessing(submissionId);
        try {
            const res = await fetch("/api/forms/submissions/delete", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionId, action }),
            });

            if (!res.ok) throw new Error(`Failed to ${action} submission`);

            toast({
                title: "Success",
                description: `Submission ${action === 'delete' ? 'moved to trash' : 'archived'}`
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Operation failed",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(null);
        }
    };

    const handleCreateLead = async (submission: FormSubmission) => {
        if (submission.lead_id) {
            toast({
                title: "Lead already exists",
                description: "A lead has already been created from this submission.",
                variant: "destructive",
            });
            return;
        }

        setIsCreatingLead(submission.id);

        try {
            const response = await fetch("/api/forms/submissions/convert-to-lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submission_id: submission.id }),
            });

            if (!response.ok) {
                throw new Error("Failed to create lead");
            }

            const result = await response.json();
            toast({
                title: "Lead created",
                description: `Lead ${result.lead?.company || result.lead?.firstName || "Unknown"} has been created.`,
            });

            // Refresh the page to show updated data
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create lead. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsCreatingLead(null);
        }
    };

    const getStatusBadge = (status: string, leadId: string | null) => {
        if (leadId) {
            return <Badge variant="default" className="bg-green-600">Converted to Lead</Badge>;
        }
        switch (status) {
            case "NEW":
                return <Badge variant="default">New</Badge>;
            case "VIEWED":
                return <Badge variant="secondary">Viewed</Badge>;
            case "CONVERTED":
                return <Badge variant="default" className="bg-green-600">Converted</Badge>;
            case "SPAM":
                return <Badge variant="destructive">Spam</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {!disableFormSelect && (
                        <div className="w-[200px]">
                            <Select
                                value={selectedFormId}
                                onValueChange={(val) => {
                                    setSelectedFormId(val);
                                    router.push(val === "all" ? window.location.pathname : `${window.location.pathname}?form=${val}`);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by form" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Forms</SelectItem>
                                    {forms.map((form) => (
                                        <SelectItem key={form.id} value={form.id}>
                                            {form.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="w-[200px]">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="NEW">New</SelectItem>
                                <SelectItem value="VIEWED">Viewed</SelectItem>
                                <SelectItem value="CONVERTED">Converted</SelectItem>
                                <SelectItem value="SPAM">Spam</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Submissions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
                    <CardDescription>
                        Click on a row to expand and see full submission data. Create leads with one click.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[30px]"></TableHead>
                                    <TableHead>Form</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubmissions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No form submissions found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSubmissions.map((submission) => (
                                        <React.Fragment key={submission.id}>
                                            <TableRow
                                                className={cn(
                                                    "cursor-pointer hover:bg-muted/50",
                                                    expandedRows.has(submission.id) && "bg-muted/50"
                                                )}
                                                onClick={() => toggleRowExpanded(submission.id)}
                                            >
                                                <TableCell>
                                                    {expandedRows.has(submission.id) ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {submission.form?.name || "Unknown Form"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {submission.extracted_name && (
                                                            <span className="font-medium">{submission.extracted_name}</span>
                                                        )}
                                                        {submission.extracted_email && (
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Mail className="h-3 w-3" />
                                                                {submission.extracted_email}
                                                            </span>
                                                        )}
                                                        {submission.extracted_phone && (
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Phone className="h-3 w-3" />
                                                                {submission.extracted_phone}
                                                            </span>
                                                        )}
                                                        {submission.extracted_company && (
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Building className="h-3 w-3" />
                                                                {submission.extracted_company}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(submission.status, submission.lead_id)}
                                                </TableCell>
                                                <TableCell>
                                                    <span title={format(new Date(submission.createdAt), "PPpp")}>
                                                        {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                                                    </span>
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(submission)}
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {submission.extracted_email && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-blue-500 hover:text-blue-600"
                                                                onClick={() => handleOpenEmail(submission)}
                                                                title="Send Email"
                                                            >
                                                                <Mail className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {!submission.lead_id && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => handleCreateLead(submission)}
                                                                disabled={isCreatingLead === submission.id}
                                                                title="Convert to Lead"
                                                            >
                                                                {isCreatingLead === submission.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                                                            onClick={() => handleAction(submission.id, 'archive')}
                                                            disabled={isProcessing === submission.id}
                                                            title="Archive"
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                            onClick={() => handleAction(submission.id, 'delete')}
                                                            disabled={isProcessing === submission.id}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {expandedRows.has(submission.id) && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="bg-muted/30 p-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {Object.entries(submission.data).map(([key, value]) => (
                                                                <div key={key} className="border rounded p-2">
                                                                    <span className="text-xs font-medium text-muted-foreground capitalize">
                                                                        {key.replace(/_/g, " ")}
                                                                    </span>
                                                                    <p className="mt-1 text-sm break-all">{String(value) || "-"}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {submission.source_url && (
                                                            <div className="mt-4 text-xs text-muted-foreground">
                                                                Source: {submission.source_url}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Submission Details</DialogTitle>
                        <DialogDescription>
                            Submitted via {selectedSubmission?.form?.name} on{" "}
                            {selectedSubmission && format(new Date(selectedSubmission.createdAt), "PPpp")}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSubmission && (
                        <div className="flex-1 overflow-y-auto px-6 min-h-0">
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(selectedSubmission.data).map(([key, value]) => (
                                        <div key={key} className="group border rounded-xl p-4 bg-muted/30 hover:border-primary/50 transition-all">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                                {key.replace(/_/g, " ")}
                                            </span>
                                            <div className="text-sm font-medium break-all space-y-2">
                                                {String(value).startsWith('http') || String(value).startsWith('https') ? (
                                                    <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                                        {String(value)}
                                                    </a>
                                                ) : (
                                                    <p className="whitespace-pre-wrap">{String(value) || "-"}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedSubmission.source_url && (
                                    <div className="p-4 rounded-xl bg-muted/50 border flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Filter className="h-4 w-4" />
                                            <span>Source URL:</span>
                                        </div>
                                        <a href={selectedSubmission.source_url} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline">
                                            {selectedSubmission.source_url}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="p-6 pt-4 border-t bg-muted/5 gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                            Close
                        </Button>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            {selectedSubmission && !selectedSubmission.lead_id && (
                                <Button
                                    onClick={() => {
                                        handleCreateLead(selectedSubmission);
                                        setShowDetailDialog(false);
                                    }}
                                    disabled={isCreatingLead === selectedSubmission.id}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Confirm Lead
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="text-orange-500 border-orange-500/30 hover:bg-orange-50"
                                onClick={() => {
                                    if (selectedSubmission) {
                                        handleAction(selectedSubmission.id, 'archive');
                                        setShowDetailDialog(false);
                                    }
                                }}
                            >
                                <Archive className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (selectedSubmission) {
                                        handleAction(selectedSubmission.id, 'delete');
                                        setShowDetailDialog(false);
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email Dialog */}
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Send Email
                        </DialogTitle>
                        <DialogDescription>
                            Send a personalized email to {selectedSubmission?.extracted_email} from the CRM.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">To (Recipient Email)</label>
                            <Input
                                value={emailRecipient}
                                onChange={(e) => setEmailRecipient(e.target.value)}
                                placeholder="Enter recipient email address"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Subject</label>
                            <Input
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                placeholder="Email subject"
                            />
                        </div>
                        <div className="flex flex-col gap-2 py-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="includeData"
                                    checked={includeSubmissionData}
                                    onChange={(e) => setIncludeSubmissionData(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label
                                    htmlFor="includeData"
                                    className="text-sm font-medium leading-none cursor-pointer"
                                >
                                    Include answers in email body (Plain Text)
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="includePdf"
                                    checked={includePdf}
                                    onChange={(e) => setIncludePdf(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label
                                    htmlFor="includePdf"
                                    className="text-sm font-medium leading-none cursor-pointer"
                                >
                                    Attach submission as PDF document (Professional Report)
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message</label>
                            <textarea
                                className="w-full min-h-[200px] p-3 rounded-md border bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                placeholder="Type your message here..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSendEmail}
                            disabled={isSendingEmail || !emailBody || !emailSubject}
                        >
                            {isSendingEmail ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send from CRM
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
