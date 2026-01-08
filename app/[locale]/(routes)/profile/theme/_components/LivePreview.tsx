"use client";

import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

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
    themeName: string;
}

export function LivePreview({ colors, themeName }: LivePreviewProps) {
    const hsl = (value: string) => `hsl(${value})`;

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                Live Preview
            </div>

            {/* Preview Container */}
            <div
                className="rounded-xl border p-5 space-y-4"
                style={{
                    backgroundColor: hsl(colors.background),
                    borderColor: `hsl(${colors.primary} / 0.3)`,
                }}
            >
                {/* Theme Name Header */}
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: hsl(colors.primary) }}
                    />
                    <div>
                        <p
                            className="font-semibold text-sm"
                            style={{ color: hsl(colors.foreground) }}
                        >
                            {themeName || "Custom Theme"}
                        </p>
                        <p
                            className="text-xs"
                            style={{ color: hsl(colors.mutedForeground) }}
                        >
                            Theme Preview
                        </p>
                    </div>
                </div>

                {/* Sample Card */}
                <div
                    className="rounded-lg border p-4"
                    style={{
                        backgroundColor: hsl(colors.surface),
                        borderColor: `hsl(${colors.primary} / 0.2)`,
                    }}
                >
                    <p
                        className="font-medium mb-1"
                        style={{ color: hsl(colors.foreground) }}
                    >
                        Card Title
                    </p>
                    <p
                        className="text-sm mb-1"
                        style={{ color: hsl(colors.mutedForeground) }}
                    >
                        Secondary text example
                    </p>
                    <p
                        className="text-xs"
                        style={{ color: `hsl(${colors.mutedForeground} / 0.7)` }}
                    >
                        Muted hint text
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap gap-2">
                    <button
                        className="px-4 py-2 rounded-md text-xs font-medium"
                        style={{
                            backgroundColor: hsl(colors.primary),
                            color: hsl(colors.primaryForeground),
                        }}
                    >
                        Primary
                    </button>
                    <button
                        className="px-4 py-2 rounded-md text-xs font-medium border"
                        style={{
                            backgroundColor: `hsl(${colors.accent} / 0.5)`,
                            borderColor: `hsl(${colors.primary} / 0.3)`,
                            color: hsl(colors.foreground),
                        }}
                    >
                        Secondary
                    </button>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                    <span
                        className="px-2.5 py-1 rounded text-xs font-medium"
                        style={{
                            backgroundColor: `hsl(${colors.success} / 0.2)`,
                            color: hsl(colors.success),
                        }}
                    >
                        Success
                    </span>
                    <span
                        className="px-2.5 py-1 rounded text-xs font-medium"
                        style={{
                            backgroundColor: `hsl(${colors.warning} / 0.2)`,
                            color: hsl(colors.warning),
                        }}
                    >
                        Warning
                    </span>
                    <span
                        className="px-2.5 py-1 rounded text-xs font-medium"
                        style={{
                            backgroundColor: `hsl(${colors.error} / 0.2)`,
                            color: hsl(colors.error),
                        }}
                    >
                        Error
                    </span>
                </div>

                {/* Now Playing Widget */}
                <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                        backgroundColor: `hsl(${colors.surface})`,
                        border: `1px solid hsl(${colors.primary} / 0.2)`,
                    }}
                >
                    <div
                        className="w-10 h-10 rounded-md"
                        style={{ backgroundColor: hsl(colors.primary) }}
                    />
                    <div className="flex-1">
                        <p
                            className="text-sm font-medium"
                            style={{ color: hsl(colors.foreground) }}
                        >
                            Now Playing
                        </p>
                        <p
                            className="text-xs"
                            style={{ color: hsl(colors.mutedForeground) }}
                        >
                            Artist Name
                        </p>
                    </div>
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: hsl(colors.primary) }}
                    >
                        <span style={{ color: hsl(colors.primaryForeground) }}>▶</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
