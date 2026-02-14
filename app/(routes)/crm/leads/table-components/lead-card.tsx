import { Lead } from "../table-data/schema";
import { DataTableRowActions } from "./data-table-row-actions";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Calendar, User, Building2 } from "lucide-react";
import moment from "moment";
import { Row } from "@tanstack/react-table";

interface LeadCardProps {
    row: Row<Lead>;
}

export function LeadCard({ row }: LeadCardProps) {
    const lead = row.original;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                        {lead.company ? (
                            <>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span>{lead.company}</span>
                            </>
                        ) : (
                            <span className="text-muted-foreground italic">No Company</span>
                        )}
                    </div>
                    <div className="text-sm font-medium">
                        {lead.firstName} {lead.lastName}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                        {lead.status}
                    </Badge>
                    <DataTableRowActions row={row} />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2 text-sm">
                {lead.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{lead.email}</span>
                    </div>
                )}
                {lead.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{lead.phone}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>
                        {/* @ts-ignore */}
                        {lead.assigned_to_user?.name || "Unassigned"}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center border-t bg-muted/20 mt-auto">
                <div className="flex items-center gap-1 mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>Updated {moment(lead.updatedAt).fromNow()}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
