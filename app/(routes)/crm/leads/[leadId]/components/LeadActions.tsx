"use client";

import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { convertLeadToOpportunity } from "@/actions/crm/convert-lead";
import { ArrowRightCircle, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { UpdateLeadForm } from "../../components/UpdateLeadForm";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

export function LeadActions({ data }: { data: any }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const onDelete = async () => {
        try {
            await axios.delete(`/api/crm/leads/${data.id}`);
            toast({
                title: "Success",
                description: "Lead deleted successfully",
            });
            router.push("/crm/leads"); // Redirect to list, not sales-command (old path)
            router.refresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong",
            });
        }
    };

    const onConvert = async () => {
        try {
            const res = await convertLeadToOpportunity(data.id);
            if (res.success) {
                toast({
                    title: "Success",
                    description: "Lead converted to Opportunity",
                });
                // Redirect to the new Opportunity
                if (res.data?.opportunityId) {
                    router.push(`/crm/opportunities/${res.data.opportunityId}`);
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: res.error || "Failed to convert",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong during conversion",
            });
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-white transition-colors" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onConvert} className="cursor-pointer text-indigo-500 focus:text-indigo-500 font-medium">
                        <ArrowRightCircle className="mr-2 h-4 w-4" /> Convert to Opportunity
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpen(true)} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-red-600 focus:text-red-600">
                        <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Lead</DialogTitle>
                    </DialogHeader>
                    <div className="p-4">
                        <UpdateLeadForm initialData={data} setOpen={setOpen} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
