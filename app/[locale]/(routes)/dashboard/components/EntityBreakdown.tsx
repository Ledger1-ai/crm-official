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
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardCard from "../../crm/dashboard/_components/DashboardCard";

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
  name: string;
  value: number;
  href: string;
  iconName: string;
  color: string;
}

interface EntityBreakdownProps {
  title: string;
  entities: EntityItem[];
  className?: string;
  hideHeader?: boolean;
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

// ... inside component ...


export function EntityBreakdown({
  title,
  entities,
  className,
  hideHeader = false,
}: EntityBreakdownProps) {
  const total = entities.reduce((sum, e) => sum + e.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6",
        className
      )}
    >
      {!hideHeader && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-xs text-muted-foreground uppercase">
              Total Records
            </span>
          </div>
        </div>
      )}

      {/* Visual breakdown bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-white/5 mb-6">
        <div className="absolute inset-0 flex">
          {entities.map((entity, index) => {
            const width = total > 0 ? (entity.value / total) * 100 : 0;
            const colors = colorStyles[entity.color] || colorStyles.cyan;
            return (
              <motion.div
                key={entity.name}
                className={cn(
                  "h-full",
                  colors.bg.split(" ")[0].replace("/10", "/60")
                )}
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            );
          })}
        </div>
      </div>

      {/* Entity grid using DashboardCard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {entities.map((entity, index) => {
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
              key={entity.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={entity.href} className="block group h-full">
                <DashboardCard
                  icon={Icon}
                  label={entity.name}
                  count={entity.value}
                  description={`${percentage}% of records`}
                  variant={variant}
                  // Apply specific color overrides to matching valid tailwind classes
                  className={cn("transition-colors duration-300", colors.bg, colors.border)}
                  iconClassName={colors.icon}
                />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
