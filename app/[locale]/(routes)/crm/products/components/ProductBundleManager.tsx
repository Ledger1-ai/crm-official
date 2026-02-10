"use client";

import { useState } from "react";
import {
    Plus,
    Trash2,
    Layers,
    ChevronRight,
    Box,
    CheckSquare,
    Square,
    Loader2,
    Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { updateProductBundles } from "@/actions/crm/products/bundles";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
}

interface BundleItem {
    childProductId: string;
    quantity: number;
    isRequired: boolean;
    // UI only
    name?: string;
    sku?: string;
}

interface ProductBundleManagerProps {
    product: any;
    allProducts: Product[];
    onClose: () => void;
}

export default function ProductBundleManager({ product, allProducts, onClose }: ProductBundleManagerProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState<BundleItem[]>(
        (product.bundles || []).map((b: any) => ({
            childProductId: b.childProductId,
            quantity: b.quantity,
            isRequired: b.isRequired,
            name: b.childProduct?.name,
            sku: b.childProduct?.sku
        }))
    );

    const addItem = (productId: string) => {
        if (items.find(i => i.childProductId === productId)) {
            toast.error("Product already in bundle");
            return;
        }

        const selected = allProducts.find(p => p.id === productId);
        if (!selected) return;

        setItems([...items, {
            childProductId: productId,
            quantity: 1,
            isRequired: false,
            name: selected.name,
            sku: selected.sku
        }]);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx: number, field: keyof BundleItem, value: any) => {
        const newItems = [...items];
        (newItems[idx] as any)[field] = value;
        setItems(newItems);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await updateProductBundles(
                product.id,
                items.map(i => ({
                    childProductId: i.childProductId,
                    quantity: i.quantity,
                    isRequired: i.isRequired
                }))
            );
            if (res.success) {
                toast.success("Bundle updated successfully");
                router.refresh();
                onClose();
            } else {
                toast.error(res.error || "Failed to update bundle");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Layers className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle>Bundle Builder: {product.name}</DialogTitle>
                            <DialogDescription>
                                Add components and define quantities for this product bundle.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Select onValueChange={addItem}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Add product to bundle..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {allProducts
                                        .filter(p => p.id !== product.id)
                                        .map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name} (${p.price})
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-xl border shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="pl-6">Component</TableHead>
                                    <TableHead className="w-24 text-center">Qty</TableHead>
                                    <TableHead className="w-24 text-center">Required</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                                            No components added to this bundle yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, idx) => (
                                        <TableRow key={item.childProductId}>
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{item.name}</span>
                                                    <span className="text-[10px] uppercase font-mono text-muted-foreground">{item.sku}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                                    className="h-8 text-center"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => updateItem(idx, 'isRequired', !item.isRequired)}
                                                    className={cn("h-8 w-8", item.isRequired ? "text-primary" : "text-muted-foreground")}
                                                >
                                                    {item.isRequired ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="pr-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(idx)}
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-4 border-t px-6">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        disabled={isLoading}
                        className="gap-2"
                        onClick={handleSave}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Bundle Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
