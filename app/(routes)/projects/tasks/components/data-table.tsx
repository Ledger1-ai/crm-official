"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { PanelTopClose, PanelTopOpen } from "lucide-react";
import TaskCard from "./TaskCard";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { Badge } from "@/components/ui/badge";
import { statuses, priorities } from "../data/data";
import moment from "moment";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function TasksDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [hide, setHide] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4 w-full overflow-hidden">

      {hide ? (
        <div className="flex gap-2 text-sm text-muted-foreground">
          This content is hidden now. Click on <PanelTopOpen className="inline h-4 w-4" /> to show content
        </div>
      ) : (
        <>
          <DataTableToolbar
            table={table}
            viewMode={viewMode}
            setViewMode={setViewMode}
            hide={hide}
            setHide={setHide}
          />

          {/* Table View */}
          {viewMode === "table" && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id} className="whitespace-nowrap">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-2">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View for Table Mode */}
              <div className="md:hidden space-y-3">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TaskCard key={row.id} task={row.original as any} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No results.
                  </div>
                )}
              </div>
            </>
          )}

          {/* Compact Grid View */}
          {viewMode === "compact" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const task = row.original as any;
                  const status = statuses.find((s) => s.value === task.taskStatus);
                  const priority = priorities.find((p) => p.value === task.priority);
                  return (
                    <div
                      key={row.id}
                      className="group border rounded-lg bg-card p-3 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="font-medium text-sm truncate">{task.title || "Untitled"}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {task.assigned_user?.name || "Unassigned"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.dueDateAt ? moment(task.dueDateAt).format("MMM D") : "—"}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {status && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">
                              {status.label}
                            </Badge>
                          )}
                          {priority && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">
                              {priority.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No results.
                </div>
              )}
            </div>
          )}

          {/* Card View */}
          {viewMode === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TaskCard key={row.id} task={row.original as any} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No results.
                </div>
              )}
            </div>
          )}

          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}


