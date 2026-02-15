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
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { PanelTopClose, PanelTopOpen, FolderOpen, FileText, ListTodo } from "lucide-react";
import { ProjectCard } from "./project-card";
import { Task } from "../data/schema";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  stats?: {
    activeTasks: number;
    documents: number;
  };
}

export function ProjectsDataTable<TData, TValue>({
  columns,
  data,
  stats,
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
  const [viewMode, setViewMode] = React.useState<ViewMode>("card");
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
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  // Force card view on mobile, map viewMode to display logic
  const currentView = isMobile ? "card" : viewMode;

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

  // Calculate stats
  const calculatedStats = React.useMemo(() => ({
    total: data.length,
    activeTasks: stats?.activeTasks ?? 0,
    documents: stats?.documents ?? 0,
  }), [data, stats]);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{calculatedStats.total}</p>
              <p className="text-xs text-muted-foreground">Total Projects</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ListTodo className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{calculatedStats.activeTasks}</p>
              <p className="text-xs text-muted-foreground">Active Tasks</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{calculatedStats.documents}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-3">
        <div className="flex-1 w-full">
          <DataTableToolbar table={table} />
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* ViewToggle (Desktop Only) */}
          {!isMobile && (
            <ViewToggle value={viewMode} onChange={setViewMode} />
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
          {currentView === "card" ? (
            /* Card Grid View */
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
          ) : currentView === "compact" ? (
            /* Compact Grid View */
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const orig: any = row.original;
                  return (
                    <a
                      key={row.id}
                      href={`/campaigns/boards/${orig?.id}`}
                      className="group border rounded-lg p-3 bg-card hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                      {orig?.brand_logo_url && (
                        <img src={orig.brand_logo_url} alt="" className="h-8 w-8 object-contain rounded mb-2" />
                      )}
                      <h3 className="font-medium text-sm truncate">{orig?.title || "Untitled"}</h3>
                      <p className="text-xs text-muted-foreground truncate">{orig?.description || "No description"}</p>
                    </a>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No results found.
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        <TableHead className="w-[50px]"></TableHead>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id} className="relative" style={{ width: header.getSize() }}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              {header.column.getCanResize() && (
                                <div
                                  onMouseDown={header.getResizeHandler()}
                                  onTouchStart={header.getResizeHandler()}
                                  className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none ${header.column.getIsResizing() ? "bg-primary" : "bg-border opacity-0 hover:opacity-100"
                                    }`}
                                />
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

