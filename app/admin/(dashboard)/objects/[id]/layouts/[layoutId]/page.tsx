"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    LayoutTemplate,
    GripVertical,
    Plus,
    Trash2,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

// Simple Drag & Drop Layout Editor (Mockup/Foundation)
// In a real implementation, we'd use dnd-kit or react-beautiful-dnd

export default function LayoutEditorPage() {
    const router = useRouter();
    const params = useParams();
    const { id, layoutId } = params as { id: string; layoutId: string };

    const [isLoading, setIsLoading] = useState(true);
    const [objectDef, setObjectDef] = useState<any>(null);
    const [layout, setLayout] = useState<any>({
        name: "",
        sections: [],
        isDefault: false
    });

    // Available fields
    const [availableFields, setAvailableFields] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        try {
            // Fetch layout
            if (layoutId !== "new") {
                const layoutRes = await fetch(`/api/schema/objects/${id}/layouts/${layoutId}`);
                if (layoutRes.ok) {
                    const data = await layoutRes.json();
                    setLayout(data);
                }
            } else {
                setLayout({
                    name: "New Layout",
                    sections: [
                        {
                            id: "default_section",
                            title: "Information",
                            columns: 2,
                            fields: []
                        }
                    ],
                    isDefault: false
                });
            }

            // Fetch object fields
            const objRes = await fetch(`/api/schema/objects/${id}`);
            if (objRes.ok) {
                const data = await objRes.json();
                setObjectDef(data);
                setAvailableFields(data.fields || []);
            }
        } catch (error) {
            toast.error("Failed to load editor");
        } finally {
            setIsLoading(false);
        }
    }, [id, layoutId]);

    useEffect(() => {
        if (id && layoutId) {
            fetchData();
        }
    }, [id, layoutId, fetchData]);

    const handleSave = async () => {
        try {
            const method = layoutId === "new" ? "POST" : "PUT";
            const url = layoutId === "new"
                ? `/api/schema/objects/${id}/layouts`
                : `/api/schema/objects/${id}/layouts/${layoutId}`;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(layout)
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success("Layout saved");
            router.push(`/admin/objects/${id}`);
        } catch (error) {
            toast.error("Error saving layout");
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Layout Editor: {layout.name}</h1>
                        <p className="text-muted-foreground">{objectDef?.name} Object</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center space-x-2 mr-4">
                        <Switch
                            checked={layout.isDefault}
                            onCheckedChange={(c) => setLayout({ ...layout, isDefault: c })}
                        />
                        <Label>Set as Default</Label>
                    </div>
                    <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Layout
                    </Button>
                </div>
            </div>

            {/* Editor Canvas */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Left Panel: Fields Palette */}
                <div className="w-64 border rounded-md bg-muted/10 flex flex-col">
                    <div className="p-3 border-b bg-muted/20 font-medium">Available Fields</div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {availableFields.map(field => (
                            <div
                                key={field.id}
                                className="p-2 bg-background border rounded shadow-sm text-sm hover:border-primary cursor-move flex items-center gap-2"
                                draggable
                            >
                                <GripVertical className="w-3 h-3 text-muted-foreground" />
                                {field.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Panel: Layout Preview */}
                <div className="flex-1 bg-muted/5 border rounded-md p-8 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <Label>Layout Name</Label>
                        <Input
                            className="max-w-xs"
                            value={layout.name}
                            onChange={(e) => setLayout({ ...layout, name: e.target.value })}
                        />
                    </div>

                    {/* Sections */}
                    <div className="space-y-6">
                        {layout.sections?.map((section: any, idx: number) => (
                            <Card key={idx} className="border-dashed border-2">
                                <CardHeader className="py-3 bg-muted/10 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                                    <Button variant="ghost" size="sm"><Settings className="w-3 h-3" /></Button>
                                </CardHeader>
                                <CardContent className="min-h-[100px] p-4 bg-background/50">
                                    <div className={`grid grid-cols-${section.columns || 2} gap-4`}>
                                        <div className="col-span-1 p-3 border border-dashed rounded text-center text-sm text-muted-foreground">
                                            Drop fields here
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <Button variant="outline" className="w-full border-dashed">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Section
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
