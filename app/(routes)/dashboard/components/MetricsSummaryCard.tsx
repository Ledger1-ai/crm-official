"use client";

import { motion } from "framer-motion";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
};

import Link from "next/link";

interface MetricsSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  iconName: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accentColor?: "cyan" | "violet" | "emerald" | "amber" | "rose";
  size?: "default" | "large";
  href?: string;
}

const accentColors = {
  cyan: {
    bg: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/30",
    icon: "text-cyan-400 bg-cyan-500/20",
    glow: "shadow-cyan-500/20",
    text: "text-cyan-400",
  },
  violet: {
    bg: "from-violet-500/20 to-violet-600/5",
    border: "border-violet-500/30",
    icon: "text-violet-400 bg-violet-500/20",
    glow: "shadow-violet-500/20",
    text: "text-violet-400",
  },
  emerald: {
    bg: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/30",
    icon: "text-emerald-400 bg-emerald-500/20",
    glow: "shadow-emerald-500/20",
    text: "text-emerald-400",
  },
  amber: {
    bg: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30",
    icon: "text-amber-400 bg-amber-500/20",
    glow: "shadow-amber-500/20",
    text: "text-amber-400",
  },
  rose: {
    bg: "from-rose-500/20 to-rose-600/5",
    border: "border-rose-500/30",
    icon: "text-rose-400 bg-rose-500/20",
    glow: "shadow-rose-500/20",
    text: "text-rose-400",
  },
};

export function MetricsSummaryCard({
  title,
  value,
  subtitle,
  iconName,
  trend,
  accentColor = "cyan",
  size = "default",
  href,
}: MetricsSummaryCardProps) {
  const colors = accentColors[accentColor];
  const Icon = iconMap[iconName] || DollarSign;

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl h-full",
        colors.bg,
        colors.border,
        size === "large" ? "p-8" : "p-6",
        "hover:shadow-lg transition-all duration-300",
        `hover:${colors.glow}`,
        href && "cursor-pointer"
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Icon className="w-full h-full" />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "p-3 rounded-xl",
              colors.icon
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
                trend.isPositive
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p
            className={cn(
              "font-bold tracking-tight mt-1",
              size === "large" ? "text-4xl" : "text-3xl"
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className={cn("text-sm mt-1", colors.text)}>{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
