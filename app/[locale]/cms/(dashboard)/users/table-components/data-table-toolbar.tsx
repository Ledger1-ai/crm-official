"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { ViewToggle, ViewMode } from "@/components/ViewToggle";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function DataTableToolbar<TData>({
  table,
  viewMode,
  onViewModeChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter Users ..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
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

      {/* View controls grouped together */}
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
        {viewMode && onViewModeChange && (
          <ViewToggle value={viewMode} onChange={onViewModeChange} />
        )}
      </div>
    </div>
  );
}
