"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Calendar, Mail, FileText } from "lucide-react";
import { pushToJira } from "@/actions/cms/push-to-jira";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface Application {
    id: string;
    name: string;
    email: string;
    job: { title: string };
    status: string;
    jiraTicketId: string | null;
    createdAt: Date;
    coverLetter: string | null;
    resumeUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    phone: string | null;
}

export function ApplicationsClient({ initialApplications }: { initialApplications: Application[] }) {
    const [applications, setApplications] = useState(initialApplications);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    const handlePushToJira = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening modal
        if (processingId) return;
        setProcessingId(id);

        try {
            const result = await pushToJira(id);
            if (result.success) {
                toast.success(result.message);
                // Optimistic update or refresh could happen here, keeping simple for now rely on revalidatePath
                // Assuming client rehydration or simple router refresh needed if not using real-time
                setApplications(apps => apps.map(app =>
                    app.id === id ? { ...app, jiraTicketId: result.message.split(": ")[1] || "TIKET", status: "REVIEWING" } : app
                ));
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to push to Jira");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <>
            <div className="bg-[#0A0A0B] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-slate-400">Candidate</TableHead>
                            <TableHead className="text-slate-400">Role</TableHead>
                            <TableHead className="text-slate-400">Applied</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-slate-400">Jira Ticket</TableHead>
                            <TableHead className="text-right text-slate-400">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.map((app) => (
                            <TableRow
                                key={app.id}
                                className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                onClick={() => setSelectedApp(app)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-white font-semibold">{app.name}</span>
                                        <span className="text-xs text-slate-500">{app.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-300">{app.job.title}</TableCell>
                                <TableCell className="text-slate-400 text-sm">
                                    {new Date(app.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        app.status === "PENDING" ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10" :
                                            app.status === "REVIEWING" ? "border-blue-500/50 text-blue-400 bg-blue-500/10" :
                                                app.status === "HIRED" ? "border-green-500/50 text-green-400 bg-green-500/10" :
                                                    "border-slate-500/50 text-slate-400"
                                    }>
                                        {app.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {app.jiraTicketId ? (
                                        <div className="flex items-center gap-2 text-blue-400 font-mono text-xs bg-blue-500/10 px-2 py-1 rounded w-fit">
                                            <ExternalLink className="h-3 w-3" />
                                            {app.jiraTicketId}
                                        </div>
                                    ) : (
                                        <span className="text-slate-600 text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {!app.jiraTicketId && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 border border-blue-600/20"
                                            onClick={(e) => handlePushToJira(app.id, e)}
                                            disabled={!!processingId}
                                        >
                                            {processingId === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Push to Jira"}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {applications.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        No applications found yet.
                    </div>
                )}
            </div>

            <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
                <DialogContent className="max-w-2xl bg-[#0F0F1A] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                            Candidate Profile
                            {selectedApp?.jiraTicketId && (
                                <Badge variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-500/10 font-normal">
                                    Jira: {selectedApp.jiraTicketId}
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Detailed information about the candidate.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedApp && (
                        <div className="space-y-8 mt-4">
                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <InfoItem icon={<FileText className="h-4 w-4" />} label="Name" value={selectedApp.name} />
                                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={selectedApp.email} />
                                <InfoItem icon={<ExternalLink className="h-4 w-4" />} label="LinkedIn" value={selectedApp.linkedinUrl} isLink />
                                <InfoItem icon={<ExternalLink className="h-4 w-4" />} label="Portfolio" value={selectedApp.portfolioUrl} isLink />
                                <InfoItem icon={<FileText className="h-4 w-4" />} label="Resume" value={selectedApp.resumeUrl} isLink />
                                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Applied For" value={selectedApp.job.title} />
                            </div>

                            {/* Cover Letter */}
                            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Cover Letter</h4>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                                    {selectedApp.coverLetter || "No cover letter provided."}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <Button variant="ghost" onClick={() => setSelectedApp(null)}>Close</Button>
                                {!selectedApp.jiraTicketId && (
                                    <Button onClick={(e) => handlePushToJira(selectedApp.id, e)} disabled={!!processingId}>
                                        {processingId === selectedApp.id ? "Pushing..." : "Process in Jira"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function InfoItem({ icon, label, value, isLink }: any) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 uppercase font-medium">
                {icon} {label}
            </span>
            {isLink ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 truncate text-sm">
                    {value}
                </a>
            ) : (
                <span className="text-white text-sm font-medium truncate" title={value}>{value}</span>
            )}
        </div>
    );
}
