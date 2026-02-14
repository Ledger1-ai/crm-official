"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { statuses } from "../table-data/data";
import { AdminUser } from "../table-data/schema";
import { DataTableRowActions } from "./data-table-row-actions";
import { DataTableColumnHeader } from "./data-table-column-header";
import { formatDistanceToNowStrict } from "date-fns";

export const columns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: "avatar",
    header: "",
    cell: ({ row }) => {
      const name = row.original.name || "";
      const avatar = row.original.avatar;
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatar || undefined} alt={name} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="E-mail" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("email")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "team_role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = (row.getValue("team_role") as string) || "MEMBER";
      const variant = role === "OWNER" ? "default" :
        role === "ADMIN" ? "secondary" :
          role === "VIEWER" ? "outline" : "outline";
      return (
        <Badge variant={variant} className="text-xs">
          {role}
        </Badge>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "department",
    accessorFn: (row) => row.assigned_department?.name || row.assigned_team?.name || "Organization",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Department" />
    ),
    cell: ({ row }) => {
      // Prioritize department if it exists
      const dept = row.original.assigned_department;
      const team = row.original.assigned_team;

      const displayTeam = dept || team;
      const teamName = displayTeam?.name;
      const isDept = !!dept || displayTeam?.team_type === 'DEPARTMENT';

      return (
        <div className="flex items-center gap-2">
          {isDept && <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-500/50 text-amber-500">Dept</Badge>}
          <span className={!teamName ? "text-muted-foreground/50 italic" : ""}>
            {teamName || "Organization"}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "lastLoginAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Login" />
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.lastLoginAt
          ? formatDistanceToNowStrict(new Date(row.original.lastLoginAt), {
            addSuffix: true,
          })
          : "Never"}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "userStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("userStatus")
      );

      if (!status) {
        return null;
      }

      return (
        <div className="flex items-center">
          {status.icon && (
            // @ts-ignore
            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row, table }) => <DataTableRowActions row={row} departments={(table.options.meta as any)?.departments || []} />,
  },
];
