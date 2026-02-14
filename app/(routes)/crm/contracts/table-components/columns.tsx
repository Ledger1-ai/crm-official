"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { statuses } from "../table-data/data";
import { Lead } from "../table-data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import moment from "moment";
import { toast } from "sonner";
import { Globe, PlusCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDealRoom } from "@/actions/crm/create-deal-room";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px]">
        {moment(row.getValue("createdAt")).format("YY-MM-DD")}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last update" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px]">
        {moment(row.getValue("updatedAt")).format("YY-MM-DD")}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "customerSignedDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer signed" />
    ),
    cell: ({ row }) => (
      <div className="w-[150px]">
        {row.getValue("customerSignedDate")
          ? moment(row.getValue("customerSignedDate")).format("YY-MM-DD")
          : "Not signed yet"}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),

    cell: ({ row }) => <div className="w-[150px]">{row.getValue("title")}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "assigned_to_user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned to" />
    ),

    cell: ({ row }) => (
      <div className="w-[150px]">
        {row.original.assigned_to_user
          ? row.original.assigned_to_user.name
          : "Unassigned"}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "company",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),

    cell: ({ row }) => (
      <div className="">
        {row.original.assigned_account
          ? row.original.assigned_account.name
          : "Unassigned"}
      </div>
    ),
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("status")
      );
      if (!status) {
        return null;
      }
      return (
        <div className="flex w-[100px] items-center">
          {status.icon && (
            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <span>{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "deal_room",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deal Room" />
    ),
    cell: ({ row }) => {
      // @ts-ignore
      const room = row.original.deal_room;

      const handleCreate = async () => {
        toast.promise(createDealRoom(row.original.id), {
          loading: "creating room...",
          success: (data) => {
            if (data.success) {
              window.open(`/proposal/${data.slug}`, '_blank');
              return "Room created & opened!";
            } else {
              throw new Error("Failed");
            }
          },
          error: "Could not create room"
        })
      };

      if (room && room.is_active) {
        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100" onClick={() => window.open(`/proposal/${room.slug}`, '_blank')}>
                    <Globe className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open Live Deal Room</p>
                  <p className="text-xs text-muted-foreground">{room.total_views} views</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {room.last_viewed_at && (
              <Badge variant="outline" className="text-[10px] h-5 border-emerald-200 text-emerald-600">
                Viewed {moment(room.last_viewed_at).fromNow()}
              </Badge>
            )}
          </div>
        );
      }

      return (
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleCreate}>
          <PlusCircle className="h-3 w-3" />
          Create Room
        </Button>
      );
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
