"use client";

import { Row } from "@tanstack/react-table";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Calendar, User } from "lucide-react";
import moment from "moment";
import { Account } from "../table-data/schema";

interface AccountCardProps {
    row: Row<Account>;
}

export function AccountCard({ row }: AccountCardProps) {
    const account = row.original;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{account.name}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2 text-sm">
                {account.contacts && account.contacts.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{account.contacts.length} contact(s)</span>
                    </div>
                )}
                {/* @ts-ignore */}
                {account.assigned_to_user?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3 w-3" />
                        {/* @ts-ignore */}
                        <span>Assigned to {account.assigned_to_user.name}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center border-t bg-muted/20 mt-auto">
                {account.createdAt && (
                    <div className="flex items-center gap-1 mt-2">
                        <Calendar className="h-3 w-3" />
                        <span>Created {moment(account.createdAt).fromNow()}</span>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
