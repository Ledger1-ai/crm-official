"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Loader2, Target } from "lucide-react"; // Using global search icons
import { searchOpportunities } from "@/actions/invoice/search-opportunities";
import { assignInvoiceToOpportunity } from "@/actions/invoice/assign-to-opportunity";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    type: string;
}

interface AssignOpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: string;
}

export default function AssignOpportunityModal({ isOpen, onClose, invoiceId }: AssignOpportunityModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const { toast } = useToast();

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            // Use dedicated search action
            const opportunities = await searchOpportunities(val);
            setResults(opportunities);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onAssign = async (opportunity: SearchResult) => {
        try {
            setAssigning(true);
            const result = await assignInvoiceToOpportunity(invoiceId, opportunity.id, opportunity.type);

            if (result.error) throw new Error(result.error);

            toast({
                title: "Success",
                description: `Invoice assigned to ${opportunity.title}`,
            });
            onClose();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to assign opportunity",
            });
        } finally {
            setAssigning(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] w-[95vw]">
                <DialogHeader>
                    <DialogTitle>Assign to Opportunity</DialogTitle>
                    <DialogDescription>
                        Search for an opportunity.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 w-full overflow-hidden">
                    {/* Search Input */}
                    <div className="relative flex items-center w-full">
                        <div className="flex items-center transition-all duration-300 ease-in-out border rounded-md bg-background/50 w-full px-3 py-2 shadow-sm border-gray-800 focus-within:ring-1 focus-within:ring-ring focus-within:border-primary">
                            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                            <input
                                className="!bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50 h-full min-w-0"
                                placeholder="Search opportunities (e.g. XoinPay)..."
                                value={query}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/70 shrink-0" />}
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="max-h-[300px] overflow-y-auto overflow-x-hidden space-y-2 p-1">
                        {query.length >= 2 && results.length === 0 && !loading && (
                            <div className="text-center text-sm text-muted-foreground py-4">No opportunities found.</div>
                        )}

                        {results.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 px-3 py-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors group border border-transparent hover:border-border w-full max-w-full"
                                onClick={() => !assigning && onAssign(item)}
                            >
                                <div className={cn(
                                    "flex items-center justify-center h-8 w-8 rounded-full shrink-0",
                                    item.type === 'project_opportunity' ? "bg-blue-500/20 text-blue-500" : "bg-orange-500/20 text-orange-500"
                                )}>
                                    <Target className="h-4 w-4" />
                                </div>
                                <div className="flex-1 overflow-hidden min-w-0">
                                    <div className="text-sm font-medium truncate">{item.title}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {item.type === 'project_opportunity' ? 'Project Feature' : 'CRM Opportunity'} • {item.subtitle}
                                    </div>
                                </div>
                                {assigning ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                                ) : (
                                    <div className="text-xs text-primary opacity-0 group-hover:opacity-100 font-medium shrink-0">Assign</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
