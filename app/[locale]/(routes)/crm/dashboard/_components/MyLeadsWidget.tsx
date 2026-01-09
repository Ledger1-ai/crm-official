"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { UserPlus, CalendarIcon, ArrowRight, Building2, User } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Lead {
    id: string;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    email: string | null;
    createdAt: Date | null;
}

interface MyLeadsWidgetProps {
    leads: Lead[];
}

export default function MyLeadsWidget({ leads }: MyLeadsWidgetProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border-indigo-500/20 hover:border-indigo-500/40 border-dashed w-full justify-between">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">New Leads</span>
                    </div>
                    <Badge className="ml-1 px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 border-none">
                        {leads.length}
                    </Badge>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-500">
                        <UserPlus className="h-5 w-5" />
                        New Leads This Week
                    </DialogTitle>
                    <DialogDescription>
                        {leads.length > 0
                            ? `You have ${leads.length} new lead${leads.length === 1 ? '' : 's'} assigned this week.`
                            : "No new leads assigned this week."}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                    <div className="space-y-3">
                        {leads.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground opacity-60">
                                <UserPlus className="h-12 w-12 mb-3" />
                                <p>No new leads</p>
                            </div>
                        )}

                        {leads.map((lead) => (
                            <div key={lead.id} className="group flex items-start justify-between gap-3 p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
                                <div className="space-y-1.5 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate block">
                                            {lead.firstName || lead.lastName
                                                ? `${lead.firstName || ""} ${lead.lastName || ""}`
                                                : lead.company || "Unknown"}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                        {lead.company && (
                                            <span className="flex items-center gap-1">
                                                <Building2 className="h-3 w-3 opacity-70" />
                                                {lead.company}
                                            </span>
                                        )}
                                        {lead.createdAt && (
                                            <span className="flex items-center gap-1 opacity-70">
                                                <CalendarIcon className="h-3 w-3" />
                                                Added: {format(new Date(lead.createdAt), "EOKK")}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 pt-0.5">
                                    <Link href={`/crm/leads/${lead.id}`}>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
