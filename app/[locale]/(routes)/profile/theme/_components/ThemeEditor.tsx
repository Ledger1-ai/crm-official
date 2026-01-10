"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    RotateCcw,
    Save,
    X,
    Download,
    Upload,
    Check,
    AlertTriangle,
    Sparkles,
    MousePointer2,
    Move,
    Type,
    Palette,
    Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "./ColorPicker";
import { LivePreview } from "./LivePreview";
import { THEME_PRESETS, type ThemePreset } from "@/app/providers/ThemeProvider";

// Default colors for a new custom theme
const DEFAULT_CUSTOM_COLORS = {
    background: "0 0% 6%",
    surface: "0 0% 8%",
    elevated: "0 0% 14%",
    foreground: "0 0% 98%",
    mutedForeground: "0 0% 65%",
    primary: "45 90% 50%",
    primaryForeground: "0 0% 5%",
    accent: "45 90% 20%",
    accentGlow: "45 90% 35%",
    // Removed Status Colors as per new plan
};

const DEFAULT_RADIUS = "0.5rem";

// Preset theme metadata for quick start
const PRESET_COLORS: Record<ThemePreset, Partial<typeof DEFAULT_CUSTOM_COLORS>> = {
    "obsidian-gold": { primary: "45 90% 50%", accent: "45 90% 20%" },
    "midnight-protocol": { primary: "191 65% 58%", accent: "191 65% 20%" },
    "neon-circuit": { primary: "300 100% 50%", accent: "300 100% 20%" },
    "prismatic-aurora": { primary: "270 70% 60%", accent: "270 70% 25%" },
    "deep-ocean": { primary: "200 100% 40%", accent: "200 100% 15%" },
    "crimson-night": { primary: "0 80% 50%", accent: "0 80% 15%" },
    "monochrome-studio": { primary: "0 0% 100%", accent: "0 0% 20%" },
    "forest-spectrum": { primary: "150 60% 50%", accent: "150 60% 15%" },
};

export interface CustomTheme {
    id: string;
    name: string;
    colors: typeof DEFAULT_CUSTOM_COLORS;
    radius: string;
    motion: "fast" | "fluid";
    createdAt: number;
    shared?: boolean;
}

interface ThemeEditorProps {
    onBack: () => void;
    editingTheme?: CustomTheme | null;
    activeThemeId?: string;
    activeCustomTheme?: CustomTheme;
}

export function ThemeEditor({
    onBack,
    editingTheme,
    activeThemeId,
    activeCustomTheme,
}: ThemeEditorProps) {
    const router = useRouter();
    const [themeName, setThemeName] = useState(editingTheme?.name || "My Custom Theme");

    // Colors State
    const [colors, setColors] = useState<typeof DEFAULT_CUSTOM_COLORS>(() => {
        if (editingTheme?.colors) return editingTheme.colors;
        if (activeCustomTheme?.colors) return activeCustomTheme.colors;
        if (activeThemeId && activeThemeId in PRESET_COLORS) {
            return {
                ...DEFAULT_CUSTOM_COLORS,
                ...PRESET_COLORS[activeThemeId as ThemePreset],
            };
        }
        return { ...DEFAULT_CUSTOM_COLORS };
    });

    // System Feel State
    const [radius, setRadius] = useState<string>(editingTheme?.radius || DEFAULT_RADIUS);
    const [motion, setMotion] = useState<"fast" | "fluid">(editingTheme?.motion || "fluid");

    // Apply preview styles to document
    useEffect(() => {
        const style = document.createElement("style");
        style.id = "theme-editor-preview";

        // Convert motion choice to CSS logic (approximate for preview)
        // Note: Real reduced motion usually uses media query. Here we simulate via transition duration override?
        // Actually the global css uses :root.reduced-motion. We can toggle a class on body or just specific vars.
        // For now, let's just handle colors and radius. Motion visualization in preview might be subtle.

        style.textContent = `
      :root {
        --background: ${colors.background} !important;
        --foreground: ${colors.foreground} !important;
        --muted: ${colors.surface} !important;
        --muted-foreground: ${colors.mutedForeground} !important;
        --card: ${colors.surface} !important;
        --card-foreground: ${colors.foreground} !important;
        --popover: ${colors.background} !important;
        --popover-foreground: ${colors.foreground} !important;
        --primary: ${colors.primary} !important;
        --primary-foreground: ${colors.primaryForeground} !important;
        --secondary: ${colors.surface} !important;
        --secondary-foreground: ${colors.foreground} !important;
        --accent: ${colors.accent} !important;
        --accent-foreground: ${colors.foreground} !important;
        --border: ${colors.primary} / 0.2 !important;
        --input: ${colors.elevated} !important;
        --ring: ${colors.primary} !important;
        --radius: ${radius} !important;
      }
    `;

        // Remove existing preview style
        document.getElementById("theme-editor-preview")?.remove();
        document.head.appendChild(style);

        // Motion handling (toggle class on body for preview purposes)
        if (motion === "fast") {
            document.documentElement.classList.add("reduced-motion"); // Using existing class from globals.css
        } else {
            document.documentElement.classList.remove("reduced-motion");
        }

        return () => {
            document.getElementById("theme-editor-preview")?.remove();
            document.documentElement.classList.remove("reduced-motion");
        };
    }, [colors, radius, motion]);

    const updateColor = (key: keyof typeof colors, value: string) => {
        setColors((prev) => ({ ...prev, [key]: value }));
    };

    const loadPreset = (preset: ThemePreset) => {
        const presetColors = PRESET_COLORS[preset];
        setColors((prev) => ({ ...prev, ...presetColors }));
    };

    const resetToDefault = () => {
        setColors({ ...DEFAULT_CUSTOM_COLORS });
        setRadius(DEFAULT_RADIUS);
        setMotion("fluid");
        setThemeName("My Custom Theme");
    };

    const saveTheme = () => {
        const savedThemes: CustomTheme[] = JSON.parse(
            localStorage.getItem("custom-themes") || "[]"
        );

        const newTheme: CustomTheme = {
            id: editingTheme?.id || `custom-${Date.now()}`,
            name: themeName,
            colors,
            radius,
            motion,
            createdAt: editingTheme?.createdAt || Date.now(),
        };

        // Check limit (max 6)
        if (!editingTheme && savedThemes.length >= 6) {
            alert("Maximum of 6 custom themes allowed. Please delete one first.");
            return;
        }

        // Update or add
        const existingIndex = savedThemes.findIndex((t) => t.id === newTheme.id);
        if (existingIndex >= 0) {
            savedThemes[existingIndex] = newTheme;
        } else {
            savedThemes.push(newTheme);
        }

        localStorage.setItem("custom-themes", JSON.stringify(savedThemes));

        // Clear preview and go back
        document.getElementById("theme-editor-preview")?.remove();
        onBack();
    };

    const handleCancel = () => {
        document.getElementById("theme-editor-preview")?.remove();
        onBack();
    };

    const exportTheme = () => {
        const exportData = {
            name: themeName,
            colors,
            radius,
            motion,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${themeName.toLowerCase().replace(/\s+/g, "-")}-theme.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importTheme = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    if (data.colors) {
                        setColors({ ...DEFAULT_CUSTOM_COLORS, ...data.colors });
                        if (data.name) setThemeName(data.name);
                        if (data.radius) setRadius(data.radius);
                        if (data.motion) setMotion(data.motion);
                    }
                } catch {
                    alert("Invalid theme file");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Simple contrast check
    const checkContrast = (): { passed: boolean; issues: string[] } => {
        const issues: string[] = [];
        // Basic lightness check for primary vs primaryForeground
        const primaryL = parseFloat(colors.primary.split(" ")[2] || "50");
        const fgL = parseFloat(colors.primaryForeground.split(" ")[2] || "50");
        const diff = Math.abs(primaryL - fgL);

        if (diff < 40) {
            issues.push("Primary button text may be hard to read");
        }

        return { passed: issues.length === 0, issues };
    };

    const contrastResult = checkContrast();

    return (
        <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="px-6 py-6 md:px-8 lg:px-10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => router.push("/profile")}
                    >
                        Profile
                    </span>
                    <span>/</span>
                    <span
                        className="text-primary cursor-pointer hover:underline"
                        onClick={handleCancel}
                    >
                        Theme Studio
                    </span>
                    <span>/</span>
                    <span>Create Theme</span>
                </div>

                <div className="flex items-center gap-3 mb-1">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Theme Studio</span>
                </div>

                <h1 className="text-3xl font-bold text-foreground mb-2">
                    Create Your Theme
                </h1>
                <p className="text-muted-foreground">
                    Define your brand's look and feel, from colors to motion.
                </p>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-6 md:px-8 lg:px-10 pb-32">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left & Middle Column - 2x2 Grid Controls */}
                    <div className="xl:col-span-2 space-y-8">

                        {/* Global Settings */}
                        <div className="flex gap-6 items-end">
                            <div className="flex-1">
                                <Label htmlFor="theme-name" className="text-sm font-medium">
                                    Theme Name
                                </Label>
                                <Input
                                    id="theme-name"
                                    value={themeName}
                                    onChange={(e) => setThemeName(e.target.value)}
                                    className="mt-2"
                                    placeholder="My Custom Theme"
                                />
                            </div>

                            {/* Preset Quick Loader */}
                            <div className="flex-1">
                                <Label className="text-sm font-medium mb-2 block">Quick Start Presets</Label>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {THEME_PRESETS.map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => loadPreset(preset)}
                                            className="w-8 h-8 rounded-full border border-border/50 hover:scale-110 transition-transform flex-shrink-0"
                                            style={{ backgroundColor: `hsl(${PRESET_COLORS[preset].primary})` }}
                                            title={preset}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* 4-Quadrant Visual Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">

                            {/* Q1: Backgrounds */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    Background & Surface
                                </h3>
                                <div className="space-y-3">
                                    <ColorPicker
                                        label="App Background"
                                        description="Main application canvas (bg0)"
                                        value={colors.background}
                                        onChange={(v) => updateColor("background", v)}
                                    />
                                    <ColorPicker
                                        label="Surface Cards"
                                        description="Panels and containers (bg1)"
                                        value={colors.surface}
                                        onChange={(v) => updateColor("surface", v)}
                                    />
                                    <ColorPicker
                                        label="Elevated Elements"
                                        description="Modals and sticky headers (bg2)"
                                        value={colors.elevated}
                                        onChange={(v) => updateColor("elevated", v)}
                                    />
                                </div>
                            </div>

                            {/* Q2: Typography */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Type className="w-4 h-4" />
                                    Typography
                                </h3>
                                <div className="space-y-3">
                                    <ColorPicker
                                        label="Primary Text"
                                        description="Headings and main content"
                                        value={colors.foreground}
                                        onChange={(v) => updateColor("foreground", v)}
                                    />
                                    <ColorPicker
                                        label="Muted Text"
                                        description="Subtitles and metadata"
                                        value={colors.mutedForeground}
                                        onChange={(v) => updateColor("mutedForeground", v)}
                                    />
                                </div>
                            </div>

                            {/* Q3: Brand Core */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    Brand Core
                                </h3>
                                <div className="space-y-3">
                                    <ColorPicker
                                        label="Primary Color"
                                        description="Main buttons and active states"
                                        value={colors.primary}
                                        onChange={(v) => updateColor("primary", v)}
                                    />
                                    <ColorPicker
                                        label="Primary Foreground"
                                        description="Text on primary buttons"
                                        value={colors.primaryForeground}
                                        onChange={(v) => updateColor("primaryForeground", v)}
                                    />
                                    <ColorPicker
                                        label="Accent"
                                        description="Secondary highlights and details"
                                        value={colors.accent}
                                        onChange={(v) => updateColor("accent", v)}
                                    />
                                    <ColorPicker
                                        label="Glow"
                                        description="Focus rings and subtle glows"
                                        value={colors.accentGlow}
                                        onChange={(v) => updateColor("accentGlow", v)}
                                    />
                                </div>
                            </div>

                            {/* Q4: System Feel */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <MousePointer2 className="w-4 h-4" />
                                    System Feel
                                </h3>
                                <div className="space-y-6 p-4 rounded-xl border border-border/40 bg-card/20">
                                    {/* Radius Control */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-medium">Corner Radius</Label>
                                            <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                                {radius}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1.5"
                                            step="0.1"
                                            value={parseFloat(radius)}
                                            onChange={(e) => setRadius(`${e.target.value}rem`)}
                                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                                            <span>Square</span>
                                            <span>Round</span>
                                        </div>
                                    </div>

                                    <Separator className="opacity-50" />

                                    {/* Motion Control */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-xs font-medium">Motion Speed</Label>
                                            <Move className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setMotion("fast")}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${motion === "fast"
                                                    ? "bg-primary/20 border-primary text-primary"
                                                    : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                Fast (Reduced)
                                            </button>
                                            <button
                                                onClick={() => setMotion("fluid")}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${motion === "fluid"
                                                    ? "bg-primary/20 border-primary text-primary"
                                                    : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                Fluid (Standard)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Right Column - Preview & Actions */}
                    <div className="space-y-6">
                        {/* Live Preview */}
                        <div className="sticky top-6">
                            <LivePreview
                                themeName={themeName}
                                colors={{
                                    background: colors.background,
                                    surface: colors.surface,
                                    foreground: colors.foreground,
                                    mutedForeground: colors.mutedForeground,
                                    primary: colors.primary,
                                    primaryForeground: colors.primaryForeground,
                                    accent: colors.accent,
                                    // Pass mock status colors if needed by older preview, 
                                    // but we will update LivePreview next
                                    success: "142 71% 45%",
                                    warning: "38 92% 50%",
                                    error: "0 84% 60%",
                                }}
                                radius={radius}
                            />

                            {/* Readability Check */}
                            <div
                                className={`mt-4 p-4 rounded-lg border ${contrastResult.passed
                                    ? "border-green-500/30 bg-green-500/10"
                                    : "border-yellow-500/30 bg-yellow-500/10"
                                    }`}
                            >
                                <p className="text-sm font-medium mb-2">Readability</p>
                                {contrastResult.passed ? (
                                    <div className="flex items-center gap-2 text-green-500 text-sm">
                                        <Check className="w-4 h-4" />
                                        All contrast checks passed
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {contrastResult.issues.map((issue, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 text-yellow-500 text-sm"
                                            >
                                                <AlertTriangle className="w-4 h-4" />
                                                {issue}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-2">
                                <Button variant="outline" className="w-full" onClick={exportTheme}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Theme
                                </Button>
                                <Button variant="outline" className="w-full" onClick={importTheme}>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import Theme
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full hover:bg-destructive/10 hover:text-destructive"
                                    onClick={resetToDefault}
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reset to Default
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border">
                <div className="flex items-center justify-end gap-3 px-6 py-4 md:px-8 lg:px-10">
                    <Button variant="ghost" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button onClick={saveTheme}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Theme
                    </Button>
                </div>
            </div>
        </div>
    );
}
