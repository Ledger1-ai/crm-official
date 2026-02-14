"use client";

import { Task } from "../data/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, FolderOpen, Eye, Pencil, Trash, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { Row } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import AlertModal from "@/components/modals/alert-modal";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import UpdateProjectForm from "../forms/UpdateProject";
import { taskSchema } from "../data/schema";

interface ProjectCardProps {
    row: Row<Task>;
}

export function ProjectCard({ row }: ProjectCardProps) {
    const project = row.original;
    const parsedProject = taskSchema.parse(project);
    const router = useRouter();
    const { toast } = useToast();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const onDelete = async () => {
        setLoading(true);
        try {
            await axios.delete(`/api/projects/${parsedProject.id}`);
            toast({
                title: "Success",
                description: `Project: ${parsedProject.title}, deleted successfully`,
            });
            router.refresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error, project not deleted. Please try again.",
            });
        } finally {
            setDeleteOpen(false);
            setLoading(false);
        }
    };

    return (
        <>
            <AlertModal
                isOpen={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={onDelete}
                loading={loading}
            />
            <Sheet open={editOpen} onOpenChange={() => setEditOpen(false)}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Edit your project data</SheetTitle>
                        <SheetDescription></SheetDescription>
                    </SheetHeader>
                    <UpdateProjectForm initialData={parsedProject} openEdit={setEditOpen} />
                </SheetContent>
            </Sheet>

            <Card className="hover:shadow-md transition-shadow flex flex-col h-full">
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1 flex-1 min-w-0">
                        <Link href={`/campaigns/boards/${project.id}`} prefetch={false}>
                            <div className="font-semibold flex items-center gap-2 hover:text-primary transition-colors">
                                {project.brand_logo_url ? (
                                    <img src={project.brand_logo_url} alt="Logo" className="h-8 w-8 object-contain rounded" />
                                ) : (
                                    <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="truncate">{project.title}</span>
                            </div>
                        </Link>
                    </div>
                    {project.visibility && (
                        <Badge variant="outline" className="capitalize shrink-0">
                            <Eye className="h-3 w-3 mr-1" />
                            {project.visibility}
                        </Badge>
                    )}
                </CardHeader>

                <CardContent className="p-4 pt-2 flex-1 text-sm">
                    <div className="space-y-2">
                        <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                            {project.description || "No description"}
                        </p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{project.assigned_user?.name || "Unassigned"}</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-3 text-xs text-muted-foreground flex justify-between items-center border-t bg-muted/20">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{moment((project as any).date_created || (project as any).createdAt).fromNow()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => router.push(`/campaigns/boards/${project.id}`)}
                            title="View Board"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditOpen(true)}
                            title="Edit"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteOpen(true)}
                            title="Delete"
                        >
                            <Trash className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}

