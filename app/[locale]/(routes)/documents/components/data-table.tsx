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
  Row,
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
import { DocumentCard } from "./document-card";
import { Task } from "../data/schema";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DocumentsDataTable<TData, TValue>({
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
  const [view, setView] = React.useState<"table" | "grid">("table");
  const [hide, setHide] = React.useState(false);

  // Mobile detection using shared hook
  const isMobile = useIsMobile();

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

  // Force grid view on mobile
  const currentView = isMobile ? "grid" : view;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start gap-3">
        <div className="flex-1 w-full">
          <DataTableToolbar table={table} />
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Layout Toggles (Desktop Only) */}
          {!isMobile && (
            <div className="flex items-center border rounded-md p-1 bg-muted/50">
              <button
                onClick={() => setView("table")}
                className={`p-1.5 rounded-sm transition-all ${view === "table" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                title="Table View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="M3 9h18" /><path d="M3 15h18" /><rect width="18" height="18" x="3" y="3" rx="2" /></svg>
              </button>
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-sm transition-all ${view === "grid" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                title="Grid View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
              </button>
            </div>
          )}

          {hide ? (
            <PanelTopOpen
              onClick={() => setHide(!hide)}
              className="text-muted-foreground cursor-pointer"
            />
          ) : (
            <PanelTopClose
              onClick={() => setHide(!hide)}
              className="text-muted-foreground cursor-pointer"
            />
          )}
        </div>
      </div>

      {hide ? (
        <div className="flex gap-2 text-muted-foreground text-sm italic">
          Content hidden. Click the icon to expand.
        </div>
      ) : (
        <>
          {currentView === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <DocumentCard key={row.id} row={row as unknown as Row<Task>} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No results found.
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
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
                            <TableCell key={cell.id}>
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
              <DataTablePagination table={table} />
            </>
          )}
        </>
      )}
    </div>
  );
}

