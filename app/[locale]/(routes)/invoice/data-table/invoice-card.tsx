"use client";

import { Row } from "@tanstack/react-table";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, FileText, User } from "lucide-react";
import moment from "moment";
import { Task } from "../data/schema";
import { statuses } from "../data/data";

interface InvoiceCardProps {
    row: Row<Task>;
}

export function InvoiceCard({ row }: InvoiceCardProps) {
    const invoice = row.original;
    const status = statuses.find((status) => status.value === invoice.status);

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{invoice.variable_symbol || "No Number"}</span>
                    </div>
                </div>
                {status && (
                    <Badge variant="outline" className="flex items-center gap-1">
                        {status.icon && <status.icon className="h-3 w-3" />}
                        {status.label}
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{invoice.partner || "Unknown Partner"}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>{invoice.invoice_amount} {invoice.invoice_currency}</span>
                </div>
                {invoice.rossum_status && (
                    <div className="text-xs text-muted-foreground">
                        Rossum: {invoice.rossum_status}
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center border-t bg-muted/20 mt-auto">
                <div className="flex items-center gap-1 mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>Due {moment(invoice.date_due).fromNow()}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
