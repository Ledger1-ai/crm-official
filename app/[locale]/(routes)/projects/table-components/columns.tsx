"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";

import { visibility } from "../data/data";
import { Task } from "../data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import moment from "moment";
import Link from "next/link";

export const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "date_created",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Created" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[80px]">
        {moment(row.getValue("date_created")).format("YY-MM-DD")}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "assigned_user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned to" />
    ),

    cell: ({ row }) => (
      <div className="min-w-[100px]">
        {row.original.assigned_user.name ?? "Unassigned"}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },

  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <Link href={`/projects/boards/${row.original.id}`} prefetch={false}>
        <div className="flex items-center gap-2 min-w-[200px]">
          {row.original.brand_logo_url && (
            <img src={row.original.brand_logo_url} alt="Logo" className="h-10 w-10 object-contain rounded hover:opacity-90 transition-opacity" />
          )}
          <span className="font-medium">{row.getValue("title")}</span>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[200px] max-w-[400px] line-clamp-2" title={row.getValue("description")}>
        {row.getValue("description")}
      </div>
    ),
  },
  {
    accessorKey: "visibility",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Visibility" />
    ),
    cell: ({ row }) => {
      const status = visibility.find(
        (status) => status.value === row.getValue("visibility")
      );

      if (!status) {
        return null;
      }

      return (
        <div className="flex items-center">
          {status.label && <Badge variant="outline">{status.label}</Badge>}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },

  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
