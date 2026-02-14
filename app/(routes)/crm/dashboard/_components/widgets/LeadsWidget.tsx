"use client";

import React, { useState } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { UserPlus, Building2, CalendarIcon, ArrowRight, Plus, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import RightViewModal from "@/components/modals/right-view-modal";
import { NewLeadForm } from "../../../leads/components/NewLeadForm";
import { SmartEmailModal } from "@/components/modals/SmartEmailModal";

interface Lead {
    id: string;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    createdAt: Date | null;
}

interface LeadsWidgetProps {
    leads: Lead[];
}

export const LeadsWidget = ({ leads: initialLeads }: LeadsWidgetProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const filteredLeads = initialLeads.filter(lead => {
        const name = `${lead.firstName || ""} ${lead.lastName || ""}`.toLowerCase();
        const company = (lead.company || "").toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || company.includes(searchTerm.toLowerCase());
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: teamData } = useSWR(isModalOpen ? "/api/team/members" : null, fetcher);
    const { data: accountsData } = useSWR(isModalOpen ? "/api/crm/account" : null, fetcher);

    const rightAction = (
        <RightViewModal
            title="Create New Lead"
            description="Complete the form to add a new lead to your pipeline."
            customTrigger
            label={
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={12} className="mr-1" />
                    NEW
                </Button>
            }
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
        >
            <NewLeadForm
                users={teamData?.members || []}
                accounts={accountsData || []}
                onFinish={() => setIsModalOpen(false)}
                redirectOnSuccess={false}
            />
        </RightViewModal>
    );

    return (
        <WidgetWrapper
            title="My Leads"
            icon={UserPlus}
            iconColor="text-indigo-400"
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            footerHref="/crm/leads"
            footerLabel="View All Leads"
            count={initialLeads.length}
            rightAction={rightAction}
        >
            <SmartEmailModal
                open={emailModalOpen}
                onOpenChange={setEmailModalOpen}
                recipientEmail={selectedLead?.email || ""}
                recipientName={`${selectedLead?.firstName || ""} ${selectedLead?.lastName || ""}`}
                leadId={selectedLead?.id}
            />
            <div className="space-y-1 pb-4 mt-2">
                {filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/30">
                        <UserPlus className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-[11px] font-medium italic">No leads found in this view</p>
                    </div>
                ) : (
                    filteredLeads.map((lead) => (
                        <div
                            key={lead.id}
                            className="group flex items-start justify-between gap-3 p-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-300"
                        >
                            <div className="space-y-1.5 overflow-hidden flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white/90 truncate group-hover:text-primary transition-colors">
                                        {lead.firstName || lead.lastName
                                            ? `${lead.firstName || ""} ${lead.lastName || ""}`
                                            : lead.company || "Unnamed Lead"}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1 text-[10px] text-muted-foreground font-medium">
                                    {lead.company && (
                                        <span className="flex items-center gap-1.5">
                                            <Building2 className="h-3 w-3 opacity-50" />
                                            {lead.company}
                                        </span>
                                    )}
                                    {lead.createdAt && (
                                        <span className="flex items-center gap-1.5">
                                            <CalendarIcon className="h-3 w-3 opacity-50" />
                                            Added {format(new Date(lead.createdAt), "MMM d, yyyy")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1 h-full pt-1">
                                {lead.email && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all duration-300"
                                        onClick={() => {
                                            setSelectedLead(lead);
                                            setEmailModalOpen(true);
                                        }}
                                        title={`Email ${lead.email}`}
                                    >
                                        <Mail className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                                {lead.phone && (
                                    <a href={`tel:${lead.phone}`} title={`Call ${lead.phone}`}>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-300"
                                        >
                                            <Phone className="h-3.5 w-3.5" />
                                        </Button>
                                    </a>
                                )}
                                <Link href={`/crm/leads/${lead.id}`}>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-primary hover:text-white transition-all duration-300"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </WidgetWrapper>
    );
};
