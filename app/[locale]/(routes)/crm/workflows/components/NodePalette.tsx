"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Clock,
    Mail,
    MessageSquare,
    CheckSquare,
    Bell,
    GitBranch,
    LayoutGrid,
    Database,
    Repeat,
    CheckCircle2,
    FileEdit,
    Shield,
} from "lucide-react";

interface NodePaletteProps {
    onAddNode: (type: string, label: string) => void;
}

const nodeCategories = [
    {
        title: "Flow Control",
        items: [
            {
                type: "condition",
                label: "Decision",
                description: "If / Else branch",
                icon: GitBranch,
                color: "text-amber-500",
            },
            {
                type: "delay",
                label: "Wait",
                description: "Pause before next step",
                icon: Clock,
                color: "text-blue-500",
            },
            {
                type: "loop",
                label: "Loop",
                description: "Iterate over collection",
                icon: Repeat,
                color: "text-indigo-500",
            },
        ],
    },
    {
        title: "Actions",
        items: [
            {
                type: "action",
                label: "Send Email",
                description: "Send an email",
                icon: Mail,
                color: "text-green-500",
            },
            {
                type: "action",
                label: "Send SMS",
                description: "Send a text message",
                icon: MessageSquare,
                color: "text-green-500",
            },
            {
                type: "action",
                label: "Create Task",
                description: "Create a task for team",
                icon: CheckSquare,
                color: "text-green-500",
            },
            {
                type: "action",
                label: "Notify",
                description: "Send notification",
                icon: Bell,
                color: "text-green-500",
            },
        ],
    },
    {
        title: "Data",
        items: [
            {
                type: "updateRecord",
                label: "Create Record",
                description: "Create a new record",
                icon: Database,
                color: "text-cyan-500",
            },
            {
                type: "updateRecord",
                label: "Update Record",
                description: "Modify existing record",
                icon: FileEdit,
                color: "text-cyan-500",
            },
            {
                type: "updateRecord",
                label: "Get Records",
                description: "Query records",
                icon: Database,
                color: "text-slate-500",
            },
        ],
    },
    {
        title: "Screens & Approvals",
        items: [
            {
                type: "screen",
                label: "Screen",
                description: "Collect user input",
                icon: LayoutGrid,
                color: "text-purple-500",
            },
            {
                type: "approval",
                label: "Approval",
                description: "Submit for approval",
                icon: CheckCircle2,
                color: "text-rose-500",
            },
        ],
    },
];

export function NodePalette({ onAddNode }: NodePaletteProps) {
    return (
        <Card className="w-[220px] shadow-lg max-h-[70vh]">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-orange-500" />
                    Add Steps
                </CardTitle>
                <CardDescription className="text-xs">
                    Click to add to canvas
                </CardDescription>
            </CardHeader>
            <ScrollArea className="max-h-[55vh]">
                <CardContent className="space-y-3 pt-0">
                    {nodeCategories.map((category, catIdx) => (
                        <div key={category.title}>
                            {catIdx > 0 && <Separator className="mb-2" />}
                            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 px-1">
                                {category.title}
                            </div>
                            <div className="space-y-0.5">
                                {category.items.map((option, index) => {
                                    const Icon = option.icon;
                                    return (
                                        <Button
                                            key={`${option.type}-${index}`}
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start gap-2 h-auto py-1.5"
                                            onClick={() => onAddNode(option.type, option.label)}
                                        >
                                            <Icon className={`h-3.5 w-3.5 ${option.color}`} />
                                            <div className="text-left">
                                                <div className="text-xs font-medium">{option.label}</div>
                                                <div className="text-[10px] text-muted-foreground leading-tight">
                                                    {option.description}
                                                </div>
                                            </div>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </ScrollArea>
        </Card>
    );
}
