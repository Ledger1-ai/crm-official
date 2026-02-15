"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { closeDealAndCreateProject } from "@/actions/crm/close-deal-and-create-project";
import { createInvoiceFromOpportunity } from "@/actions/invoice/create-invoice-from-opportunity"; // Import new action
import { crm_Opportunity_Status } from "@prisma/client";

interface OpportunityActionsProps {
    opportunityId: string;
    status?: crm_Opportunity_Status | null;
    hasAccount?: boolean;
}

export function OpportunityActions({ opportunityId, status, hasAccount }: OpportunityActionsProps) {
    const [loadingClose, setLoadingClose] = useState(false);
    const [loadingInvoice, setLoadingInvoice] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const isClosed = status === "CLOSED"; // Or WON if using that logic internally

    const onCloseDeal = async () => {
        try {
            setLoadingClose(true);
            const res = await closeDealAndCreateProject(opportunityId);

            if (res.success) {
                toast({
                    title: "Congratulations!",
                    description: "Deal closed and Project created successfully.",
                });
                router.refresh();
                if (res.data?.projectId) {
                    router.push(`/campaigns/boards/${res.data.projectId}`);
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: res.error || "Failed to close deal",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong",
            });
        } finally {
            setLoadingClose(false);
        }
    };

    const onCreateInvoice = async () => {
        try {
            setLoadingInvoice(true);
            const res = await createInvoiceFromOpportunity(opportunityId);

            if (res.success) {
                toast({
                    title: "Invoice Created",
                    description: "Draft invoice generated successfully.",
                });
                router.refresh();
                if (res.data?.invoiceId) {
                    router.push(`/invoice/${res.data.invoiceId}`);
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: res.error || "Failed to create invoice",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong",
            });
        } finally {
            setLoadingInvoice(false);
        }
    };


    if (isClosed) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-emerald-500 font-medium px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mr-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Closed Won</span>
                </div>
                <Button
                    onClick={onCreateInvoice}
                    disabled={loadingInvoice}
                    variant="outline"
                    className="gap-2"
                    size="sm"
                >
                    {loadingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Create Invoice
                </Button>
            </div>

        );
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                onClick={onCreateInvoice}
                disabled={loadingInvoice}
                variant="outline"
                className="gap-2 mr-2"
                size="sm"
            >
                {loadingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Create Invoice
            </Button>
            <Button
                onClick={onCloseDeal}
                disabled={loadingClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                size="sm"
            >
                {loadingClose ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Close Won (Create Project)
            </Button>
        </div>
    );
}
