"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

import { priorities, statuses } from "./data";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
    table: Table<TData>;
}

export function DataTableToolbar<TData>({
    table,
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder="Filter by document name ..."
                    value={
                        (table.getColumn("document_name")?.getFilterValue() as string) ?? ""
                    }
                    onChange={(event) =>
                        table.getColumn("document_name")?.setFilterValue(event.target.value)
                    }
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => table.resetColumnFilters()}
                        className="h-8 px-2 lg:px-3"
                    >
                        Reset
                        <Cross2Icon className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Sort By Dropdown */}
                <Select
                    value={table.getState().sorting?.[0]?.id || ""}
                    onValueChange={(value) => {
                        if (value) {
                            const [id, desc] = value.split(":");
                            table.setSorting([{ id, desc: desc === "desc" }]);
                        } else {
                            table.setSorting([]);
                        }
                    }}
                >
                    <SelectTrigger className="h-8 w-[130px]">
                        <span className="text-xs text-muted-foreground mr-1">Sort</span>
                        <SelectValue placeholder="Values" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt:desc">Newest First</SelectItem>
                        <SelectItem value="createdAt:asc">Oldest First</SelectItem>
                        <SelectItem value="document_name:asc">Name (A-Z)</SelectItem>
                        <SelectItem value="document_name:desc">Name (Z-A)</SelectItem>
                    </SelectContent>
                </Select>

                <DataTableViewOptions table={table} />
            </div>
        </div>
    );
}
