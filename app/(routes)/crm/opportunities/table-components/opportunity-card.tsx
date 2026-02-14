"use client";

import { Row } from "@tanstack/react-table";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, DollarSign, Calendar, User, Building2 } from "lucide-react";
import moment from "moment";
import { Opportunity } from "../table-data/schema";

interface OpportunityCardProps {
    row: Row<Opportunity>;
}

export function OpportunityCard({ row }: OpportunityCardProps) {
    const opportunity = row.original;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{opportunity.name}</span>
                    </div>
                    {opportunity.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{opportunity.description}</p>
                    )}
                </div>
                {opportunity.status && (
                    <Badge variant="outline">{opportunity.status}</Badge>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2 text-sm">
                {opportunity.expected_revenue && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>${opportunity.expected_revenue.toLocaleString()}</span>
                    </div>
                )}
                {/* @ts-ignore */}
                {opportunity.assigned_account?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {/* @ts-ignore */}
                        <span>{opportunity.assigned_account.name}</span>
                    </div>
                )}
                {/* @ts-ignore */}
                {opportunity.assigned_to_user?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3 w-3" />
                        {/* @ts-ignore */}
                        <span>{opportunity.assigned_to_user.name}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center border-t bg-muted/20 mt-auto">
                {opportunity.close_date && (
                    <div className="flex items-center gap-1 mt-2">
                        <Calendar className="h-3 w-3" />
                        <span>Close {moment(opportunity.close_date).format("MMM D, YYYY")}</span>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
