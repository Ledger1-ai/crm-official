"use client";

import { AdminUser } from "../table-data/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNowStrict } from "date-fns";
import { DataTableRowActions } from "../table-components/data-table-row-actions";
import { statuses } from "../table-data/data";
import { Mail, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserCardProps {
    user: AdminUser;
    compact?: boolean;
}

export function UserCard({ user, compact = false }: UserCardProps) {
    const status = statuses.find(s => s.value === user.userStatus);
    const initials = (user.name || "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const roleVariant = user.team_role === "OWNER" ? "default" :
        user.team_role === "ADMIN" ? "secondary" : "outline";

    // Compact view for grid layout
    if (compact) {
        return (
            <Card className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || ""} alt={user.name || ""} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {initials || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{user.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <Badge variant={roleVariant} className="text-xs">
                            {user.team_role || "MEMBER"}
                        </Badge>
                        <DataTableRowActions row={{ original: user } as any} />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Full card view
    return (
        <Card className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar || ""} alt={user.name || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {initials || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-semibold text-lg">{user.name}</div>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="w-3 h-3 mr-1" />
                                {user.email}
                            </div>
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
            <CardContent className="pb-3 text-sm space-y-2">
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground flex items-center">
                        <Shield className="w-3 h-3 mr-1.5" /> Role
                    </span>
                    <Badge variant={roleVariant}>{user.team_role || "MEMBER"}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
                    <span className="text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1.5" /> Last Login
                    </span>
                    <span className="text-sm">
                        {user.lastLoginAt
                            ? formatDistanceToNowStrict(new Date(user.lastLoginAt), { addSuffix: true })
                            : "Never"}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="pt-3 flex justify-end border-t">
                <DataTableRowActions row={{ original: user } as any} />
            </CardFooter>
        </Card>
    );
}
