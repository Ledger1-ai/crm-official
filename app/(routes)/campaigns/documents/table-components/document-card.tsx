"use client";

import { Task } from "./schema";
import { DataTableRowActions } from "./data-table-row-actions";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Calendar, User, FileText, ExternalLink, FolderKanban } from "lucide-react";
import moment from "moment";
import { Row } from "@tanstack/react-table";
import BlobLink from "@/components/BlobLink";
import { Badge } from "@/components/ui/badge";

interface DocumentCardProps {
    row: Row<Task>;
}

export function DocumentCard({ row }: DocumentCardProps) {
    const doc = row.original as any;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1 flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{doc.document_name || "Untitled Document"}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <DataTableRowActions row={row} />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2 text-sm">
                {doc.description && (
                    <p className="text-muted-foreground line-clamp-2">{doc.description}</p>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{doc.assigned_to_user?.name || "Unassigned"}</span>
                </div>
                {doc.assigned_to_board ? (
                    <div className="flex items-center gap-2 text-primary">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span className="truncate">{doc.assigned_to_board.title}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground/50">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span className="italic">Unassigned Project</span>
                    </div>
                )}
                {doc.document_file_url && /^https?:\/\//i.test(doc.document_file_url) && (
                    <div className="flex items-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        <BlobLink href={doc.document_file_url} />
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center border-t bg-muted/20 mt-auto">
                <div className="flex items-center gap-1 mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>Created {moment(doc.createdAt).fromNow()}</span>
                </div>
            </CardFooter>
        </Card>
    );
}
