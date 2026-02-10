"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Table as TableIcon } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ObjectManagerPage() {
    const router = useRouter();
    const [objects, setObjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [pluralName, setPluralName] = useState("");
    const [apiName, setApiName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        fetchObjects();
    }, []);

    const fetchObjects = async () => {
        try {
            const res = await fetch("/api/schema/objects");
            const data = await res.json();
            setObjects(data);
        } catch (error) {
            toast.error("Failed to load objects");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const res = await fetch("/api/schema/objects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    pluralName,
                    apiName,
                    description,
                }),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err);
            }

            const newObj = await res.json();
            setObjects([...objects, newObj]);
            setIsCreateOpen(false);
            setName("");
            setPluralName("");
            setApiName("");
            setDescription("");
            toast.success("Object created");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // Auto-generate API Name
    useEffect(() => {
        if (name) {
            const generated = name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_c";
            if (!apiName || apiName.endsWith("_c")) { // Only auto-update if user hasn't heavily customized it
                setApiName(generated);
            }
        }
    }, [name, apiName]);

    const filtered = objects.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.apiName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Object Manager</h1>
                    <p className="text-muted-foreground">
                        Create and manage custom data objects for your CRM.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Object
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Custom Object</DialogTitle>
                            <DialogDescription>
                                Define a new database entity. API Name must be unique.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Label</Label>
                                    <Input
                                        placeholder="e.g. Vehicle"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Plural Label</Label>
                                    <Input
                                        placeholder="e.g. Vehicles"
                                        value={pluralName}
                                        onChange={(e) => setPluralName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>API Name</Label>
                                <Input
                                    placeholder="e.g. vehicle_c"
                                    value={apiName}
                                    onChange={(e) => setApiName(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Must be unique, lowercase, and end in _c (convention).</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    placeholder="Describe this object..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Create Object</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search objects..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Label</TableHead>
                            <TableHead>API Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No objects found.</TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((obj) => (
                                <TableRow
                                    key={obj.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => router.push(`/admin/objects/${obj.id}`)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <TableIcon className="w-4 h-4 text-muted-foreground" />
                                            {obj.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{obj.apiName}</TableCell>
                                    <TableCell>{obj.description}</TableCell>
                                    <TableCell>
                                        {obj.isSystem ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                System
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                Custom
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Manage</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
