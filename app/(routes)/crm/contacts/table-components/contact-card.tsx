"use client";

import { Row } from "@tanstack/react-table";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Building2, Globe } from "lucide-react";
import { Opportunity } from "../table-data/schema";

interface ContactCardProps {
    row: Row<Opportunity>;
}

export function ContactCard({ row }: ContactCardProps) {
    const contact = row.original;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.first_name || ""} {contact.last_name}</span>
                    </div>
                    {contact.position && (
                        <p className="text-sm text-muted-foreground">{contact.position}</p>
                    )}
                </div>
                <Badge variant={contact.status ? "default" : "secondary"}>
                    {contact.status ? "Active" : "Inactive"}
                </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2 text-sm">
                {contact.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{contact.email}</span>
                    </div>
                )}
                {contact.mobile_phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{contact.mobile_phone}</span>
                    </div>
                )}
                {contact.office_phone && !contact.mobile_phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{contact.office_phone}</span>
                    </div>
                )}
                {contact.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span className="truncate">{contact.website}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center border-t bg-muted/20 mt-auto">
                {contact.type && (
                    <Badge variant="outline" className="text-xs">
                        {contact.type}
                    </Badge>
                )}
            </CardFooter>
        </Card>
    );
}
