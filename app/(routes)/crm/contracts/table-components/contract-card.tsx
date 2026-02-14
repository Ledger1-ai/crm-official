"use client";

import { Row } from "@tanstack/react-table";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Calendar, User, Building2 } from "lucide-react";
import moment from "moment";
import { Lead as Contract } from "../table-data/schema";

interface ContractCardProps {
    row: Row<Contract>;
}

export function ContractCard({ row }: ContractCardProps) {
    const contract = row.original;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{contract.title}</span>
                    </div>
                </div>
                {contract.status && (
                    <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                        {contract.status}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2 text-sm">
                {contract.value !== undefined && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>${contract.value.toLocaleString()}</span>
                    </div>
                )}
                {contract.assigned_account?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{contract.assigned_account.name}</span>
                    </div>
                )}
                {contract.assigned_to_user?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{contract.assigned_to_user.name}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center border-t bg-muted/20 mt-auto">
                <div className="flex items-center gap-1 mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                        {contract.startDate && moment(contract.startDate).format("MMM D")}
                        {contract.endDate && ` - ${moment(contract.endDate).format("MMM D, YYYY")}`}
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
