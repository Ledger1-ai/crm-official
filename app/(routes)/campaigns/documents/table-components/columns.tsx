"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { labels, priorities, statuses } from "./data";
import { Task } from "./schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import moment from "moment";
import BlobLink from "@/components/BlobLink";

import { FolderKanban, FileText } from "lucide-react";

export const columns: ColumnDef<Task>[] = [
    {
        accessorKey: "createdAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Date Created" />
        ),
        cell: ({ row }) => (
            <div className="w-[80px]">
                {moment(row.getValue("createdAt")).format("YY-MM-DD")}
            </div>
        ),
    },
    {

        id: "preview",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Preview" />
        ),
        cell: ({ row }) => {
            const url = (row.original as any)?.document_file_url as string | undefined;
            if (!url || !/^https?:\/\//i.test(url)) return null;

            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || /\.(jpg|jpeg|png|gif|webp)\?/i.test(url);
            const isPdf = /\.pdf$/i.test(url) || /\.pdf\?/i.test(url);

            if (isImage) {
                return (
                    <a href={url} target="_blank" rel="noreferrer" className="block relative w-10 h-10 overflow-hidden rounded-md border hover:opacity-80 transition-opacity bg-muted/20">

                        <img
                            src={url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </a>
                )
            }

            if (isPdf) {
                return (
                    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 rounded-md border bg-red-50/50 hover:bg-red-100/50 transition-colors group" title="View PDF">
                        <FileText className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
                    </a>
                )
            }

            return <BlobLink href={url} />;
        },
    },
    {
        accessorKey: "assigned_to_board",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Project" />
        ),
        cell: ({ row }) => {
            const board = row.original.assigned_to_board;
            return (
                <div className="w-[150px]">
                    {board ? (
                        <div className="flex items-center gap-2 text-primary">
                            {/* <FolderKanban className="h-3 w-3" /> */}
                            <span className="truncate font-medium">{board.title}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "assigned_to_user",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Assigned to" />
        ),

        cell: ({ row }) => (
            <div className="w-[150px]">
                {
                    //@ts-ignore
                    //TODO: fix this
                    row.getValue("assigned_to_user")?.name ?? "Unassigned"
                }
            </div>
        ),
    },
    {
        accessorKey: "document_name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Document name" />
        ),
        cell: ({ row }) => {
            return (
                <div className="flex space-x-2">
                    <span className="max-w-[500px] truncate font-medium">
                        {row.getValue("document_name")}
                    </span>
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => <DataTableRowActions row={row} />,
    },
];
