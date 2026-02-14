"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FunnelStage {
  name: string;
  value: number;
  color: string;
}

interface PipelineFunnelProps {
  title: string;
  subtitle?: string;
  data: FunnelStage[];
  className?: string;
}

const stageColors: Record<string, { bg: string; text: string; bar: string }> = {
  Identify: {
    bg: "bg-slate-500/20",
    text: "text-slate-300",
    bar: "bg-gradient-to-r from-slate-500 to-slate-400",
  },
  Engage_AI: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-300",
    bar: "bg-gradient-to-r from-cyan-500 to-cyan-400",
  },
  Engage_Human: {
    bg: "bg-blue-500/20",
    text: "text-blue-300",
    bar: "bg-gradient-to-r from-blue-500 to-blue-400",
  },
  Offering: {
    bg: "bg-violet-500/20",
    text: "text-violet-300",
    bar: "bg-gradient-to-r from-violet-500 to-violet-400",
  },
  Finalizing: {
    bg: "bg-amber-500/20",
    text: "text-amber-300",
    bar: "bg-gradient-to-r from-amber-500 to-amber-400",
  },
  Closed: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-300",
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-400",
  },
};

export function PipelineFunnel({
  title,
  subtitle,
  data,
  className,
}: PipelineFunnelProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Total
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((stage, index) => {
          const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const colors = stageColors[stage.name] || {
            bg: "bg-gray-500/20",
            text: "text-gray-300",
            bar: "bg-gradient-to-r from-gray-500 to-gray-400",
          };

          return (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      colors.bar.replace("bg-gradient-to-r", "bg")
                    )}
                    style={{
                      backgroundColor: `hsl(var(--${stage.name.toLowerCase()}-500))`,
                    }}
                  />
                  <span className={cn("text-sm font-medium", colors.text)}>
                    {stage.name.replace("_", " ")}
                  </span>
                </div>
                <span className="text-sm font-bold text-white">
                  {stage.value}
                </span>
              </div>
              <div className="relative h-8 rounded-lg overflow-hidden bg-white/5">
                <motion.div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-lg",
                    colors.bar
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Conversion rate indicator */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Conversion Rate (Identify → Closed)
          </span>
          <span className="text-lg font-bold text-emerald-400">
            {data[0]?.value > 0
              ? ((data[data.length - 1]?.value / data[0]?.value) * 100).toFixed(
                  1
                )
              : 0}
            %
          </span>
        </div>
      </div>
    </motion.div>
  );
}
