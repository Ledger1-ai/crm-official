"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Settings,
    LayoutTemplate
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FIELD_TYPES = [
    { value: "TEXT", label: "Text" },
    { value: "TEXTAREA", label: "Text Area" },
    { value: "NUMBER", label: "Number" },
    { value: "CURRENCY", label: "Currency" },
    { value: "DATE", label: "Date" },
    { value: "DATETIME", label: "Date/Time" },
    { value: "BOOLEAN", label: "Checkbox" },
    { value: "SELECT", label: "Picklist" },
    { value: "MULTI_SELECT", label: "Multi-Select Picklist" },
    { value: "EMAIL", label: "Email" },
    { value: "PHONE", label: "Phone" },
    { value: "URL", label: "URL" },
];

export default function ObjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [objectDef, setObjectDef] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [layouts, setLayouts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Field Creation
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [fieldName, setFieldName] = useState("");
    const [fieldApiName, setFieldApiName] = useState("");
    const [fieldType, setFieldType] = useState("TEXT");
    const [fieldRequired, setFieldRequired] = useState(false);

    const fetchObjectDetails = useCallback(async () => {
        try {
            const res = await fetch(`/api/schema/objects/${id}`);
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();
            setObjectDef(data);
            setFields(data.fields || []);

            // Fetch layouts
            const layoutRes = await fetch(`/api/schema/objects/${id}/layouts`);
            if (layoutRes.ok) {
                const layoutData = await layoutRes.json();
                setLayouts(layoutData);
            }
        } catch (error) {
            toast.error("Error loading object");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchObjectDetails();
    }, [id, fetchObjectDetails]);

    const handleCreateField = async () => {
        try {
            const res = await fetch("/api/schema/fields", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    object_id: id,
                    name: fieldName,
                    apiName: fieldApiName,
                    type: fieldType,
                    isRequired: fieldRequired
                })
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err);
            }

            const newField = await res.json();
            setFields([...fields, newField]);
            setIsFieldModalOpen(false);
            setFieldName("");
            setFieldApiName("");
            setFieldType("TEXT");
            toast.success("Field created");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // Auto-generate Field API Name
    useEffect(() => {
        if (fieldName) {
            const generated = fieldName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_c";
            if (!fieldApiName || fieldApiName.endsWith("_c")) {
                setFieldApiName(generated);
            }
        }
    }, [fieldName, fieldApiName]);

    const handleDeleteObject = async () => {
        if (!confirm("Are you sure? This will delete all data associated with this object.")) return;

        try {
            const res = await fetch(`/api/schema/objects/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Object deleted");
            router.push("/admin/objects");
        } catch (error) {
            toast.error("Failed to delete object");
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (!objectDef) return <div>Object not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/admin/objects")}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{objectDef.name} ({objectDef.apiName})</h1>
                    <p className="text-muted-foreground">{objectDef.description || "No description provided."}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    {!objectDef.isSystem && (
                        <Button variant="destructive" size="sm" onClick={handleDeleteObject}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Object
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="fields" className="w-full">
                <TabsList>
                    <TabsTrigger value="fields">Fields & Relationships</TabsTrigger>
                    <TabsTrigger value="layouts">Page Layouts</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="fields" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Fields</h3>
                        <Dialog open={isFieldModalOpen} onOpenChange={setIsFieldModalOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Field
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Custom Field</DialogTitle>
                                    <DialogDescription>Add a new column to this object.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Data Type</Label>
                                        <Select value={fieldType} onValueChange={setFieldType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FIELD_TYPES.map(t => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Field Label</Label>
                                        <Input value={fieldName} onChange={(e) => setFieldName(e.target.value)} placeholder="e.g. License Plate" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>API Name</Label>
                                        <Input value={fieldApiName} onChange={(e) => setFieldApiName(e.target.value)} />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="req" checked={fieldRequired} onCheckedChange={(c) => setFieldRequired(!!c)} />
                                        <Label htmlFor="req">Required Field</Label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsFieldModalOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateField}>Save Field</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Field Label</TableHead>
                                    <TableHead>API Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="w-[100px]">Required</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="bg-muted/30">
                                    <TableCell className="font-medium">Record ID</TableCell>
                                    <TableCell className="font-mono text-xs">id</TableCell>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Yes</TableCell>
                                </TableRow>
                                <TableRow className="bg-muted/30">
                                    <TableCell className="font-medium">Created Date</TableCell>
                                    <TableCell className="font-mono text-xs">createdAt</TableCell>
                                    <TableCell>DateTime</TableCell>
                                    <TableCell>Yes</TableCell>
                                </TableRow>
                                {fields.map((field) => (
                                    <TableRow key={field.id}>
                                        <TableCell className="font-medium">{field.name}</TableCell>
                                        <TableCell className="font-mono text-xs">{field.apiName}</TableCell>
                                        <TableCell>{field.type}</TableCell>
                                        <TableCell>{field.isRequired ? "Yes" : "No"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="layouts">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Page Layouts</h3>
                        <Button size="sm" onClick={() => router.push(`/admin/objects/${id}/layouts/new`)}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Layout
                        </Button>
                    </div>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Layout Name</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Created Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {layouts.length === 0 ? (
                                    <TableRow>
                                        <TableCell className="text-muted-foreground text-center" colSpan={4}>
                                            No layouts defined. Using system default.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    layouts.map((layout: any) => (
                                        <TableRow key={layout.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/admin/objects/${id}/layouts/${layout.id}`)}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                                                    {layout.name}
                                                    {layout.isDefault && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full">Default</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">Admin</TableCell>
                                            <TableCell className="text-muted-foreground">{new Date(layout.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="settings">
                    <div className="p-8 text-center text-muted-foreground border rounded-md border-dashed">
                        Object Settings coming soon.
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
