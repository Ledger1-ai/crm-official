"use client";

import React, { useMemo, useState } from "react";
import { AiModel } from "@prisma/client";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { Input } from "@/components/ui/input";
import { AiModelRow } from "./AiModelRow";
import { AiModelCard } from "./AiModelCard";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AiPricingTableProps {
    models: AiModel[];
}

export const AiPricingTable = ({ models }: AiPricingTableProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [searchQuery, setSearchQuery] = useState("");
    const [visibleColumns, setVisibleColumns] = useState({
        provider: true,
        name: true,
        modelId: true,
        context: true,
        inputCost: true,
        outputCost: true,
        markup: true,
        ourPrice: true,
        active: true,
        default: true
    });

    // Filter models
    const filteredModels = useMemo(() => {
        if (!searchQuery) return models;
        const q = searchQuery.toLowerCase();
        return models.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.provider.toLowerCase().includes(q) ||
            m.modelId.toLowerCase().includes(q)
        );
    }, [models, searchQuery]);

    const toggleColumn = (key: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Column resizing logic
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        provider: 120,
        name: 200,
        modelId: 150,
        context: 120,
        inputCost: 120,
        outputCost: 120,
        markup: 100,
        ourPrice: 120,
        active: 80,
        default: 80
    });
    const resizingRef = React.useRef<{ col: string; startX: number; startWidth: number } | null>(null);

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current) return;
            const { col, startX, startWidth } = resizingRef.current;
            const diff = e.pageX - startX;
            setColumnWidths((prev) => ({ ...prev, [col]: Math.max(50, startWidth + diff) }));
        };
        const handleMouseUp = () => {
            if (resizingRef.current) {
                resizingRef.current = null;
                document.body.style.cursor = '';
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResize = (e: React.MouseEvent, col: string) => {
        e.preventDefault();
        e.stopPropagation();
        resizingRef.current = { col, startX: e.pageX, startWidth: columnWidths[col] || 100 };
        document.body.style.cursor = 'col-resize';
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-full sm:w-64"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* View Column Toggle */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto hidden h-9 lg:flex">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                View
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[150px]">
                            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.keys(visibleColumns).map((key) => (
                                <DropdownMenuCheckboxItem
                                    key={key}
                                    className="capitalize"
                                    checked={visibleColumns[key as keyof typeof visibleColumns]}
                                    onCheckedChange={(value) => toggleColumn(key as keyof typeof visibleColumns)}
                                >
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View Mode Toggle */}
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
                <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden overflow-x-auto">
                    <Table style={{ tableLayout: 'fixed', minWidth: '100%' }}>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                {visibleColumns.provider && (
                                    <TableHead className="relative overflow-hidden" style={{ width: columnWidths.provider }}>
                                        Provider
                                        <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-primary/50 cursor-col-resize z-10 transition-colors" onMouseDown={(e) => startResize(e, 'provider')} />
                                    </TableHead>
                                )}
                                {visibleColumns.name && (
                                    <TableHead className="relative overflow-hidden" style={{ width: columnWidths.name }}>
                                        Model Name
                                        <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-primary/50 cursor-col-resize z-10 transition-colors" onMouseDown={(e) => startResize(e, 'name')} />
                                    </TableHead>
                                )}
                                {visibleColumns.modelId && (
                                    <TableHead className="relative overflow-hidden hidden md:table-cell" style={{ width: columnWidths.modelId }}>
                                        ID
                                        <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-primary/50 cursor-col-resize z-10 transition-colors" onMouseDown={(e) => startResize(e, 'modelId')} />
                                    </TableHead>
                                )}
                                {visibleColumns.context && (
                                    <TableHead className="relative overflow-hidden" style={{ width: columnWidths.context }}>
                                        Context
                                        <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-primary/50 cursor-col-resize z-10 transition-colors" onMouseDown={(e) => startResize(e, 'context')} />
                                    </TableHead>
                                )}
                                {visibleColumns.inputCost && (
                                    <TableHead className="relative overflow-hidden" style={{ width: columnWidths.inputCost }}>
                                        Input Cost
                                        <div className="text-[10px] text-muted-foreground font-normal">($/1M Tokens)</div>
                                        <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-primary/50 cursor-col-resize z-10 transition-colors" onMouseDown={(e) => startResize(e, 'inputCost')} />
                                    </TableHead>
                                )}
                                {visibleColumns.outputCost && (
                                    <TableHead className="relative overflow-hidden" style={{ width: columnWidths.outputCost }}>
                                        Output Cost
                                        <div className="text-[10px] text-muted-foreground font-normal">($/1M Tokens)</div>
                                        <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-primary/50 cursor-col-resize z-10 transition-colors" onMouseDown={(e) => startResize(e, 'outputCost')} />
                                    </TableHead>
                                )}
                                {visibleColumns.markup && (
                                    <TableHead className="relative overflow-hidden" style={{ width: columnWidths.markup }}>
                                        Margin
                                        <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-primary/50 cursor-col-resize z-10 transition-colors" onMouseDown={(e) => startResize(e, 'markup')} />
                                    </TableHead>
                                )}
                                {visibleColumns.ourPrice && (
                                    <TableHead className="relative overflow-hidden" style={{ width: columnWidths.ourPrice }}>
                                        Our Price
                                        <div className="text-[10px] text-muted-foreground font-normal">($/1M Tokens)</div>
                                        <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-primary/50 cursor-col-resize z-10 transition-colors" onMouseDown={(e) => startResize(e, 'ourPrice')} />
                                    </TableHead>
                                )}
                                {visibleColumns.active && (
                                    <TableHead className="relative overflow-hidden" style={{ width: columnWidths.active }}>
                                        Active
                                        <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-primary/50 cursor-col-resize z-10 transition-colors" onMouseDown={(e) => startResize(e, 'active')} />
                                    </TableHead>
                                )}
                                {visibleColumns.default && (
                                    <TableHead className="relative overflow-hidden" style={{ width: columnWidths.default }}>
                                        Default
                                        <div className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 hover:bg-primary/50 cursor-col-resize z-10 transition-colors" onMouseDown={(e) => startResize(e, 'default')} />
                                    </TableHead>
                                )}
                                <TableHead className="text-right w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredModels.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">
                                        No models found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredModels.map((model) => (
                                    <AiModelRow
                                        key={model.id}
                                        model={model}
                                        visibleColumns={visibleColumns}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Grid (Compact) View */}
            {viewMode === 'compact' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredModels.map((model) => (
                        <AiModelCard key={model.id} model={model} mode="compact" />
                    ))}
                </div>
            )}

            {/* Card (Detailed) View */}
            {viewMode === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredModels.map((model) => (
                        <AiModelCard key={model.id} model={model} mode="card" />
                    ))}
                </div>
            )}
        </div>
    );
};
