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
import StageProgressBar, { type StageDatum } from "@/components/StageProgressBar";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { PanelTopClose, PanelTopOpen } from "lucide-react";
import { ProjectCard } from "./project-card";
import { Task } from "../data/schema";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function ProjectsDataTable<TData, TValue>({
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
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [projectPools, setProjectPools] = React.useState<Record<string, { poolId: string; name: string; stageData: StageDatum[]; total: number }[]>>({});
  const [view, setView] = React.useState<"table" | "compact" | "grid">("grid");
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

  async function toggleExpand(projectId: string) {
    setExpanded((prev) => ({ ...prev, [projectId]: !prev[projectId] }));
    // Lazy-load pools data when expanding for the first time
    if (!projectPools[projectId]) {
      try {
        const res = await fetch("/api/leads/pools", { cache: "no-store" as any });
        const j = await res.json().catch(() => null);
        const pools: any[] = Array.isArray(j?.pools) ? j.pools : [];
        const assigned = pools.filter((p) => (p?.icpConfig?.assignedProjectId === projectId));
        const stageKeys = ["Identify", "Engage_AI", "Engage_Human", "Offering", "Finalizing", "Closed"] as const;
        const items: { poolId: string; name: string; stageData: StageDatum[]; total: number }[] = [];
        for (const p of assigned) {
          try {
            const rl = await fetch(`/api/leads/pools/${encodeURIComponent(p.id)}/leads?mine=true`, { cache: "no-store" as any });
            const jl = await rl.json().catch(() => null);
            const leads: any[] = Array.isArray(jl?.leads) ? jl.leads : [];
            const counts: Record<string, number> = {};
            for (const k of stageKeys) counts[k] = 0;
            for (const l of leads) {
              const s = ((l as any).pipeline_stage as string) || "Identify";
              counts[s] = (counts[s] || 0) + 1;
            }
            const stageData: StageDatum[] = stageKeys.map((k) => ({ key: k, label: (k as string).replace("_", " "), count: counts[k] || 0 }));
            items.push({ poolId: p.id, name: p.name, stageData, total: leads.length || 1 });
          } catch { }
        }
        setProjectPools((prev) => ({ ...prev, [projectId]: items }));
      } catch { }
    }
  }

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
                  <ProjectCard key={row.id} row={row as unknown as Row<Task>} />
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
                <Table className="table-fixed w-full">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        <TableHead className="w-[50px]"></TableHead>
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
                      table.getRowModel().rows.map((row) => {
                        const orig: any = row.original as any;
                        const projectId = orig?.id as string;
                        const pools = projectPools[projectId] || [];
                        // Overall stage aggregation
                        const agg: Record<string, number> = {};
                        const keys = ["Identify", "Engage_AI", "Engage_Human", "Offering", "Finalizing", "Closed"] as const;
                        for (const k of keys) agg[k] = 0;
                        let total = 0;
                        for (const item of pools) {
                          total += item.total;
                          for (const sd of item.stageData) {
                            agg[sd.key as any] = (agg[sd.key as any] || 0) + (sd.count || 0);
                          }
                        }
                        const overall: StageDatum[] = keys.map((k) => ({ key: k as any, label: (k as string).replace("_", " "), count: agg[k] || 0 }));

                        return (
                          <React.Fragment key={row.id}>
                            <TableRow
                              data-state={row.getIsSelected() && "selected"}
                            >
                              <TableCell className="w-[50px] p-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(projectId);
                                  }}
                                  className="p-1 hover:bg-muted rounded-md transition-colors"
                                >
                                  {expanded[projectId] ? (
                                    <PanelTopClose className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <PanelTopOpen className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                              </TableCell>
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="break-words">
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                            {expanded[projectId] && (
                              <TableRow>
                                <TableCell colSpan={row.getVisibleCells().length + 1}>
                                  <div className="space-y-4 p-3 bg-muted/30 rounded">
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1">Overall Progress</div>
                                      <StageProgressBar stages={overall} total={Math.max(total, 1)} orientation="horizontal" nodeSize={14} trackHeight={12} showMetadata={true} />
                                    </div>
                                    <div className="space-y-2">
                                      {pools.map((p) => (
                                        <div key={p.poolId} className="space-y-1">
                                          <div className="text-xs font-medium">{p.name}</div>
                                          <StageProgressBar stages={p.stageData} total={p.total} orientation="horizontal" nodeSize={12} trackHeight={10} showMetadata={true} />
                                        </div>
                                      ))}
                                      {pools.length === 0 && (
                                        <div className="text-xs text-muted-foreground">No lead pools assigned to this project.</div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length + 1}
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

