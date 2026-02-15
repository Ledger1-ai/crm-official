"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

import { priorities, statuses } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  // Guard against missing columns to avoid TanStack Table console errors
  const statusColumn = table.getAllColumns().find((c) => c.id === "taskStatus");
  const priorityColumn = table.getAllColumns().find((c) => c.id === "priority");

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Document name ..."
          value={
            (table.getColumn("document_name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("document_name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[350px]"
        />
        {statusColumn && (
          <DataTableFacetedFilter
            column={statusColumn!}
            title="Status"
            options={statuses}
          />
        )}
        {priorityColumn && (
          <DataTableFacetedFilter
            column={priorityColumn!}
            title="Priority"
            options={priorities}
          />
        )}
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
      <DataTableViewOptions table={table} />
    </div>
  );
}
