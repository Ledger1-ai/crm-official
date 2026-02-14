"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Users2,
  Zap,
  Contact,
  LandmarkIcon,
  HeartHandshake,
  Coins,
  FilePenLine,
  FolderKanban,
  CheckSquare,
  Target,
  FileText,
  HardDrive,
  LucideIcon,
  Megaphone,
  LayoutGrid,
  Phone,
  Wand2,
  Folder,
  Shield,
  CheckCircle2,
  Radio,
  Headset,
  BarChart3,
  Package,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardCard from "../../crm/dashboard/_components/DashboardCard";
import { useDashboardLayout } from "../../crm/dashboard/_context/DashboardLayoutContext";
import { X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React, { useState } from "react";

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  TrendingUp,
  Users2,
  Zap,
  Contact,
  LandmarkIcon,
  HeartHandshake,
  Coins,
  FilePenLine,
  FolderKanban,
  CheckSquare,
  Target,
  FileText,
  HardDrive,
  Megaphone,
  LayoutGrid,
  Phone,
  Wand2,
  Folder,
  Shield,
  CheckCircle2,
  Radio,
  Headset,
  BarChart3,
  Package
};

interface EntityItem {
  id: string;
  name: string;
  value: number;
  href: string;
  iconName: string;
  color: string;
  tooltip?: string;
}

interface EntityBreakdownProps {
  title: string;
  entities: EntityItem[];
  className?: string;
  hideHeader?: boolean;
  headerAction?: React.ReactNode;
}

const colorStyles: Record<string, { bg: string; border: string; icon: string }> = {
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: "text-cyan-500" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", icon: "text-violet-500" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-500" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-500" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-500" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/20", icon: "text-rose-500" },
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: "text-indigo-500" },
  pink: { bg: "bg-pink-500/10", border: "border-pink-500/20", icon: "text-pink-500" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "text-orange-500" },
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/20", icon: "text-teal-500" },
  yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: "text-yellow-500" },
};

// Mobile info popover component
function MobileInfoButton({ tooltip, entityName }: { tooltip: string; entityName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="md:hidden absolute top-2 right-2 z-30 w-5 h-5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200"
        aria-label={`Info about ${entityName}`}
      >
        <Info className="w-3 h-3" />
      </button>

      {/* Mobile popover overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[100] flex items-end justify-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Popover card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm mx-4 mb-8 rounded-2xl border border-white/15 bg-[#18181b]/95 backdrop-blur-xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <h4 className="text-sm font-bold text-white tracking-wide uppercase">{entityName}</h4>
            </div>
            <p className="text-[13px] leading-relaxed text-white/75">{tooltip}</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium transition-colors"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}

export function EntityBreakdown({
  title,
  entities,
  className,
  hideHeader = false,
  headerAction,
}: EntityBreakdownProps) {
  const { widgets, isEditMode, toggleWidgetVisibility } = useDashboardLayout();

  // Filter entities based on visibility in DashboardLayoutContext
  const visibleEntities = entities.filter(entity => {
    const widget = widgets.find(w => w.id === entity.id);
    return widget ? widget.isVisible : true; // Default to visible if not found
  });

  const total = visibleEntities.reduce((sum, e) => sum + e.value, 0);

  if (visibleEntities.length === 0 && !isEditMode) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          !hideHeader && "rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6",
          className
        )}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em]">{title}</h3>
            <div className="flex items-center gap-4">
              {headerAction ? headerAction : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">{total}</span>
                  <span className="text-xs text-muted-foreground uppercase">
                    Total Records
                  </span>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Entity grid using DashboardCard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleEntities.map((entity, index) => {
            const Icon = iconMap[entity.iconName] || DollarSign;

            // Map Entity colors to DashboardCard variants for base structure
            let variant: "default" | "success" | "info" | "violet" | "warning" = "default";
            if (entity.color === "emerald" || entity.color === "teal") variant = "success";
            if (entity.color === "cyan" || entity.color === "blue") variant = "info";
            if (entity.color === "violet" || entity.color === "indigo" || entity.color === "pink") variant = "violet";
            if (entity.color === "amber" || entity.color === "orange" || entity.color === "yellow" || entity.color === "rose") variant = "warning";

            const percentage = total > 0 ? ((entity.value / total) * 100).toFixed(1) : "0";
            const colors = colorStyles[entity.color] || colorStyles.cyan;

            return (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative group"
              >
                {isEditMode && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWidgetVisibility(entity.id, false);
                    }}
                    className="absolute -top-2 -right-2 z-50 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors border-2 border-white/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Desktop: Tooltip on hover */}
                {entity.tooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={entity.href} className={cn("block group h-full", isEditMode && "pointer-events-none")}>
                        <DashboardCard
                          icon={Icon}
                          label={entity.name}
                          count={entity.value}
                          description={`${percentage}% of records`}
                          variant={variant}
                          className={cn("transition-colors duration-300", colors.bg, colors.border, isEditMode && "opacity-50 grayscale-[0.5]")}
                          iconClassName={colors.icon}
                        />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="hidden md:block max-w-[260px] rounded-xl border border-white/15 bg-[#18181b]/95 backdrop-blur-xl px-4 py-3 shadow-2xl"
                    >
                      <p className="text-[12px] leading-relaxed text-white/80 font-medium">{entity.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link href={entity.href} className={cn("block group h-full", isEditMode && "pointer-events-none")}>
                    <DashboardCard
                      icon={Icon}
                      label={entity.name}
                      count={entity.value}
                      description={`${percentage}% of records`}
                      variant={variant}
                      className={cn("transition-colors duration-300", colors.bg, colors.border, isEditMode && "opacity-50 grayscale-[0.5]")}
                      iconClassName={colors.icon}
                    />
                  </Link>
                )}

                {/* Mobile: Info button with popover */}
                {entity.tooltip && (
                  <MobileInfoButton tooltip={entity.tooltip} entityName={entity.name} />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
