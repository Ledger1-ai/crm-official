"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RadialProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
  color?: "cyan" | "violet" | "emerald" | "amber" | "rose";
  className?: string;
}

const colorStyles = {
  cyan: {
    stroke: "stroke-cyan-500",
    text: "text-cyan-400",
    glow: "drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]",
  },
  violet: {
    stroke: "stroke-violet-500",
    text: "text-violet-400",
    glow: "drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]",
  },
  emerald: {
    stroke: "stroke-emerald-500",
    text: "text-emerald-400",
    glow: "drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]",
  },
  amber: {
    stroke: "stroke-amber-500",
    text: "text-amber-400",
    glow: "drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]",
  },
  rose: {
    stroke: "stroke-rose-500",
    text: "text-rose-400",
    glow: "drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]",
  },
};

export function RadialProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  color = "cyan",
  className,
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const colors = colorStyles[color];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            className="stroke-white/10"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <motion.circle
            className={cn(colors.stroke, colors.glow)}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-bold", colors.text)}>
            {value}
          </span>
          {max > 0 && (
            <span className="text-xs text-muted-foreground">
              of {max}
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-3 text-center">
        <p className="text-sm font-medium text-white">{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

interface QuickStatsProps {
  title: string;
  stats: Array<{
    value: number;
    max: number;
    label: string;
    sublabel?: string;
    color: "cyan" | "violet" | "emerald" | "amber" | "rose";
  }>;
  className?: string;
}

export function QuickStats({ title, stats, className }: QuickStatsProps) {
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
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      <div className="flex flex-wrap justify-around gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <RadialProgress
              value={stat.value}
              max={stat.max}
              label={stat.label}
              sublabel={stat.sublabel}
              color={stat.color}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
