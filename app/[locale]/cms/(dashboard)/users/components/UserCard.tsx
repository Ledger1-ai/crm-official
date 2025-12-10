"use client";

import { AdminUser } from "../table-data/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import moment from "moment";
import { DataTableRowActions } from "../table-components/data-table-row-actions";
import { statuses } from "../table-data/data";
import { Mail, Calendar, Clock, Shield, Globe } from "lucide-react";

interface UserCardProps {
    user: AdminUser;
}

export function UserCard({ user }: UserCardProps) {
    const status = statuses.find(s => s.value === user.userStatus);

    return (
        <Card className="mb-4">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="font-semibold text-lg">{user.name}</div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                        </div>
                    </div>
                    {status && (
                        <Badge variant="outline" className="flex items-center gap-1">
                            {status.icon && <status.icon className="w-3 h-3" />}
                            {status.label}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pb-2 text-sm space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center">
                        <Shield className="w-3 h-3 mr-1" /> Role
                    </span>
                    <span className="font-medium">{user.team_role || "MEMBER"}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center">
                        <Globe className="w-3 h-3 mr-1" /> Language
                    </span>
                    <span>{user.userLanguage}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center">
                        <Calendar className="w-3 h-3 mr-1" /> Created
                    </span>
                    <span>{moment(user.created_on).format("YYYY/MM/DD")}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> Last Login
                    </span>
                    <span>
                        {formatDistanceToNowStrict(new Date(user.lastLoginAt || new Date()), { addSuffix: true })}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-end border-t">
                {/* We need to mock a row object for DataTableRowActions or refactor it. 
                    DataTableRowActions expects a Row<AdminUser>. 
                    Constructing a minimal mock row object. 
                */}
                <DataTableRowActions row={{ original: user } as any} />
            </CardFooter>
        </Card>
    );
}
