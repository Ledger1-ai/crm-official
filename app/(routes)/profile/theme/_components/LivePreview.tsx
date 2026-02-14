"use client";

import { Eye, TrendingUp, DollarSign, User, Mail, ArrowRight } from "lucide-react";

interface LivePreviewProps {
    colors: {
        background: string;
        surface: string;
        foreground: string;
        mutedForeground: string;
        primary: string;
        primaryForeground: string;
        accent: string;
        success: string;
        warning: string;
        error: string;
    };
    radius?: string;
    themeName: string;
}

export function LivePreview({ colors, radius = "0.5rem", themeName }: LivePreviewProps) {
    const hsl = (value: string) => `hsl(${value})`;
    const hsla = (value: string, alpha: number) => `hsl(${value} / ${alpha})`;

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <Eye className="w-4 h-4" />
                Live Preview
            </div>

            {/* Preview Canvas */}
            <div
                className="overflow-hidden border shadow-sm transition-all duration-300 ease-in-out"
                style={{
                    backgroundColor: hsl(colors.background),
                    borderColor: hsla(colors.primary, 0.2),
                    borderRadius: `calc(${radius} + 4px)`, // Outer container slightly larger
                    color: hsl(colors.foreground),
                }}
            >
                {/* Desktop Window Controls Decoration */}
                <div
                    className="h-3 w-full border-b flex items-center gap-1.5 px-3"
                    style={{
                        backgroundColor: hsla(colors.surface, 0.5),
                        borderColor: hsla(colors.primary, 0.1)
                    }}
                >
                    <div className="w-2 h-2 rounded-full opacity-20 bg-current" />
                    <div className="w-2 h-2 rounded-full opacity-20 bg-current" />
                    <div className="w-2 h-2 rounded-full opacity-20 bg-current" />
                </div>

                <div className="p-5 space-y-6">
                    {/* 1. Unified Metric Card Mockup */}
                    <div
                        className="border shadow-sm p-4 relative overflow-hidden"
                        style={{
                            backgroundColor: hsl(colors.surface),
                            borderColor: hsla(colors.primary, 0.1),
                            borderRadius: radius,
                        }}
                    >
                        {/* Soft Glow Background */}
                        <div
                            className="absolute -right-6 -top-6 w-24 h-24 blur-3xl opacity-20 pointer-events-none"
                            style={{ backgroundColor: hsl(colors.primary) }}
                        />

                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p
                                    className="text-xs font-medium uppercase tracking-wider mb-1"
                                    style={{ color: hsl(colors.mutedForeground) }}
                                >
                                    Total Revenue
                                </p>
                                <h3 className="text-2xl font-bold tracking-tight mb-2">
                                    $124,500.00
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                    <span
                                        className="flex items-center gap-0.5 bg-green-500/10 px-1.5 py-0.5 rounded"
                                        style={{
                                            color: hsl(colors.success),
                                            backgroundColor: hsla(colors.success, 0.15),
                                            borderRadius: `calc(${radius} - 2px)`,
                                        }}
                                    >
                                        <TrendingUp className="w-3 h-3" />
                                        +12.5%
                                    </span>
                                    <span style={{ color: hsla(colors.mutedForeground, 0.8) }}>
                                        from last month
                                    </span>
                                </div>
                            </div>
                            <div
                                className="p-2.5 rounded-lg shadow-sm"
                                style={{
                                    backgroundColor: hsla(colors.primary, 0.1),
                                    color: hsl(colors.primary),
                                    borderRadius: `calc(${radius} - 2px)`,
                                }}
                            >
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    {/* 2. Lead Row */}
                    <div
                        className="flex items-center gap-3 p-3 border hover:border-primary/20 transition-colors"
                        style={{
                            backgroundColor: hsla(colors.surface, 0.5),
                            borderColor: hsla(colors.primary, 0.1),
                            borderRadius: radius,
                        }}
                    >
                        {/* Avatar */}
                        <div
                            className="h-10 w-10 flex items-center justify-center font-semibold text-sm border shadow-sm shrink-0"
                            style={{
                                backgroundColor: hsla(colors.accent, 0.2),
                                color: hsl(colors.accent),
                                borderColor: hsla(colors.accent, 0.3),
                                borderRadius: "9999px", // Always rounded for avatar
                            }}
                        >
                            SC
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Sarah Connor</p>
                            <div className="flex items-center gap-1.5 text-xs truncate" style={{ color: hsl(colors.mutedForeground) }}>
                                <Mail className="w-3 h-3" />
                                sarah@skynet.com
                            </div>
                        </div>

                        <div
                            className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border"
                            style={{
                                backgroundColor: hsla(colors.primary, 0.1),
                                borderColor: hsla(colors.primary, 0.2),
                                color: hsl(colors.primary),
                                borderRadius: "9999px", // Capsule status
                            }}
                        >
                            Qualified
                        </div>
                    </div>

                    {/* 3. Form Element (Input + Button) */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wide opacity-80 pl-0.5">
                            Quick Action
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter campaign name..."
                                className="flex-1 px-3 py-2 text-sm border outline-none transition-all placeholder:opacity-50"
                                style={{
                                    backgroundColor: hsla(colors.surface, 0.3), // Slightly transparent to show bg0 if any
                                    borderColor: hsla(colors.primary, 0.2),
                                    color: hsl(colors.foreground),
                                    borderRadius: radius,
                                }}
                            />
                            <button
                                className="px-4 py-2 text-sm font-medium shadow-sm transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
                                style={{
                                    backgroundColor: hsl(colors.primary),
                                    color: hsl(colors.primaryForeground),
                                    borderRadius: radius,
                                }}
                            >
                                Save
                                <ArrowRight className="w-4 h-4 opacity-80" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
