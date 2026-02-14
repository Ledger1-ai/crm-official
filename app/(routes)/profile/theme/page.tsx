"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Palette,
    Sparkles,
    Save,
    X,
    Plus,
    Trash2,
    Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeCard } from "./_components/ThemeCard";
import { ThemeEditor, type CustomTheme } from "./_components/ThemeEditor";
import { THEME_PRESETS, type ThemePreset } from "@/app/providers/ThemeProvider";

// Theme metadata with colors for the card dots
const THEME_METADATA: Record<
    ThemePreset,
    { name: string; description: string; colors: string[] }
> = {
    "obsidian-gold": {
        name: "Obsidian Gold",
        description: "Luxury without noise.",
        colors: ["bg-neutral-900", "bg-yellow-500", "bg-amber-400"],
    },
    "midnight-protocol": {
        name: "Midnight Protocol",
        description: "Quiet power. Maximum clarity.",
        colors: ["bg-slate-900", "bg-cyan-500", "bg-teal-400"],
    },
    "neon-circuit": {
        name: "Neon Circuit",
        description: "Fast edges, bright intent.",
        colors: ["bg-purple-900", "bg-fuchsia-500", "bg-pink-400"],
    },
    "prismatic-aurora": {
        name: "Prismatic Aurora",
        description: "Color that breathes.",
        colors: ["bg-indigo-900", "bg-violet-500", "bg-purple-400"],
    },
    "deep-ocean": {
        name: "Deep Ocean",
        description: "Calm depths, clear focus.",
        colors: ["bg-slate-900", "bg-blue-500", "bg-sky-400"],
    },
    "crimson-night": {
        name: "Crimson Night",
        description: "Edge with warmth.",
        colors: ["bg-neutral-900", "bg-red-500", "bg-rose-400"],
    },
    "monochrome-studio": {
        name: "Monochrome Studio",
        description: "Focus mode for serious work.",
        colors: ["bg-neutral-900", "bg-neutral-500", "bg-white"],
    },
    "forest-spectrum": {
        name: "Forest Spectrum",
        description: "Natural energy, grounded calm.",
        colors: ["bg-emerald-900", "bg-green-500", "bg-lime-400"],
    },
};

export default function ThemeStudioPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, setTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [originalTheme, setOriginalTheme] = useState<string | undefined>();
    const [previewTheme, setPreviewTheme] = useState<string | undefined>();
    const [reducedMotion, setReducedMotion] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
    const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);

    // Check if we're in editor mode
    const isEditorMode = searchParams.get("tab") === "create" || editingTheme !== null;

    const [initialReducedMotion, setInitialReducedMotion] = useState(false);
    const [initialHighContrast, setInitialHighContrast] = useState(false);

    // 1. Mount Initialization
    useEffect(() => {
        setMounted(true);

        // Sync accessibility from storage on mount
        const storedReducedMotion = localStorage.getItem("reduced-motion") === "true";
        const storedHighContrast = localStorage.getItem("high-contrast") === "true";

        setReducedMotion(storedReducedMotion);
        setInitialReducedMotion(storedReducedMotion);
        setHighContrast(storedHighContrast);
        setInitialHighContrast(storedHighContrast);

        // Load custom themes
        const saved = localStorage.getItem("custom-themes");
        if (saved) {
            setCustomThemes(JSON.parse(saved));
        }
    }, []);

    // 2. Theme Capture (Runs when theme is first resolved)
    useEffect(() => {
        if (theme && !originalTheme) {
            setOriginalTheme(theme);
            setPreviewTheme(theme);
        }
    }, [theme, originalTheme]);

    const handleThemePreview = (themeId: string) => {
        setPreviewTheme(themeId);
        setTheme(themeId);
    };

    const handleSave = () => {
        setOriginalTheme(previewTheme);
        setInitialReducedMotion(reducedMotion);
        setInitialHighContrast(highContrast);
        router.refresh();
    };

    const handleCancel = () => {
        if (originalTheme) {
            setTheme(originalTheme);
            setPreviewTheme(originalTheme);
        }

        // Restore accessibility
        toggleReducedMotion(initialReducedMotion);
        toggleHighContrast(initialHighContrast);

        // We stay on page but reset changes
    };

    const toggleReducedMotion = (enabled: boolean) => {
        setReducedMotion(enabled);
        const html = document.documentElement;
        if (enabled) {
            html.classList.add("reduced-motion");
        } else {
            html.classList.remove("reduced-motion");
        }
        localStorage.setItem("reduced-motion", String(enabled));
    };

    const toggleHighContrast = (enabled: boolean) => {
        setHighContrast(enabled);
        const html = document.documentElement;
        if (enabled) {
            html.classList.add("high-contrast");
        } else {
            html.classList.remove("high-contrast");
        }
        localStorage.setItem("high-contrast", String(enabled));
    };

    // Check if anything has changed
    const hasChanges = (previewTheme !== originalTheme && previewTheme !== undefined) ||
        reducedMotion !== initialReducedMotion ||
        highContrast !== initialHighContrast;

    const openEditor = (customTheme?: CustomTheme) => {
        setEditingTheme(customTheme || null);
        router.push("/profile/theme?tab=create", { scroll: false });
    };

    const closeEditor = () => {
        setEditingTheme(null);
        router.push("/profile/theme", { scroll: false });
        // Reload custom themes
        const saved = localStorage.getItem("custom-themes");
        if (saved) {
            setCustomThemes(JSON.parse(saved));
        }
    };

    const deleteCustomTheme = (id: string) => {
        const updated = customThemes.filter((t) => t.id !== id);
        localStorage.setItem("custom-themes", JSON.stringify(updated));
        setCustomThemes(updated);
    };

    const applyCustomTheme = (customTheme: CustomTheme) => {
        // Apply custom theme colors via inline style
        const style = document.createElement("style");
        style.id = "custom-theme-active";
        style.textContent = `
      :root {
        --background: ${customTheme.colors.background} !important;
        --foreground: ${customTheme.colors.foreground} !important;
        --muted: ${customTheme.colors.surface} !important;
        --muted-foreground: ${customTheme.colors.mutedForeground} !important;
        --card: ${customTheme.colors.surface} !important;
        --card-foreground: ${customTheme.colors.foreground} !important;
        --popover: ${customTheme.colors.background} !important;
        --popover-foreground: ${customTheme.colors.foreground} !important;
        --primary: ${customTheme.colors.primary} !important;
        --primary-foreground: ${customTheme.colors.primaryForeground} !important;
        --secondary: ${customTheme.colors.surface} !important;
        --secondary-foreground: ${customTheme.colors.foreground} !important;
        --accent: ${customTheme.colors.accent} !important;
        --accent-foreground: ${customTheme.colors.foreground} !important;
        --border: ${customTheme.colors.primary} / 0.2 !important;
        --input: ${customTheme.colors.elevated} !important;
        --ring: ${customTheme.colors.primary} !important;
      }
    `;
        document.getElementById("custom-theme-active")?.remove();
        document.head.appendChild(style);
        setPreviewTheme(customTheme.id);
    };

    if (!mounted) {
        return null;
    }

    // Show editor if in create mode
    if (isEditorMode) {
        // Find current custom theme if applicable
        const currentCustomForEdit = customThemes.find((t) => t.id === (previewTheme || theme));

        return (
            <ThemeEditor
                onBack={closeEditor}
                editingTheme={editingTheme}
                activeThemeId={previewTheme || theme}
                activeCustomTheme={currentCustomForEdit}
            />
        );
    }

    const currentTheme = previewTheme || theme || "obsidian-gold";
    const isPresetTheme = THEME_PRESETS.includes(currentTheme as ThemePreset);
    const currentMeta = isPresetTheme
        ? THEME_METADATA[currentTheme as ThemePreset]
        : null;
    const currentCustom = customThemes.find((t) => t.id === currentTheme);

    return (
        <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="px-6 py-6 md:px-8 lg:px-10">
                <div className="flex items-center gap-3 mb-1">
                    <Palette className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Appearance</span>
                </div>

                <h1 className="text-3xl font-bold text-foreground mb-2">
                    Customize Your Experience
                </h1>
                <p className="text-muted-foreground">
                    Choose a theme that matches your mood.
                </p>
            </div>

            {/* Main Content */}
            <div className="flex-1 px-6 md:px-8 lg:px-10 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* Current Theme - Reduced */}
                    <div className="lg:col-span-1">
                        <h2 className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-[0.2em]">
                            Active Theme
                        </h2>
                        <div className="h-[92px] flex items-center gap-4 p-4 rounded-xl border border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.05)]">
                            {currentMeta && (
                                <>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {currentMeta.colors.map((color, idx) => (
                                            <span key={idx} className={`w-3.5 h-3.5 rounded-full ${color} shadow-sm`} />
                                        ))}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-foreground truncate">
                                            {currentMeta.name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground italic truncate">
                                            {currentMeta.description}
                                        </p>
                                    </div>
                                </>
                            )}
                            {currentCustom && (
                                <>
                                    <div
                                        className="w-10 h-10 rounded-lg shrink-0 border border-white/10 shadow-inner"
                                        style={{ backgroundColor: `hsl(${currentCustom.colors.primary})` }}
                                    />
                                    <div className="min-w-0">
                                        <p className="font-bold text-foreground truncate">
                                            {currentCustom.name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground italic truncate">
                                            Custom Theme
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Accessibility - At Top */}
                    <div className="lg:col-span-2">
                        <h2 className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-[0.2em]">
                            Accessibility Settings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center justify-between h-[92px] p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 transition-colors">
                                <div className="min-w-0">
                                    <Label htmlFor="reduced-motion" className="text-sm font-semibold cursor-pointer">
                                        Reduced Motion
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground mb-1">
                                        Simplify animations
                                    </p>
                                </div>
                                <Switch
                                    id="reduced-motion"
                                    checked={reducedMotion}
                                    onCheckedChange={toggleReducedMotion}
                                    className="scale-90"
                                />
                            </div>

                            <div className="flex items-center justify-between h-[92px] p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 transition-colors">
                                <div className="min-w-0">
                                    <Label htmlFor="high-contrast" className="text-sm font-semibold cursor-pointer">
                                        High Contrast
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground mb-1">
                                        Increase visibility
                                    </p>
                                </div>
                                <Switch
                                    id="high-contrast"
                                    checked={highContrast}
                                    onCheckedChange={toggleHighContrast}
                                    className="scale-90"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Theme Gallery */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
                            Theme Gallery
                        </h2>
                        <button
                            onClick={() => openEditor()}
                            className="flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Theme Studio →
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {THEME_PRESETS.map((themeId) => {
                            const meta = THEME_METADATA[themeId];
                            return (
                                <ThemeCard
                                    key={themeId}
                                    id={themeId}
                                    name={meta.name}
                                    description={meta.description}
                                    colors={meta.colors}
                                    isActive={currentTheme === themeId}
                                    onClick={() => {
                                        document.getElementById("custom-theme-active")?.remove();
                                        handleThemePreview(themeId);
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Custom Themes */}
                {customThemes.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                My Custom Themes
                            </h2>
                            <span className="text-[11px] text-muted-foreground font-mono">
                                {customThemes.length} / 6
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {customThemes.map((customTheme) => (
                                <div
                                    key={customTheme.id}
                                    className={`relative flex flex-col gap-3 p-4 rounded-xl border transition-all cursor-pointer ${currentTheme === customTheme.id
                                        ? "border-primary ring-2 ring-primary/30"
                                        : "border-border/50 hover:border-border"
                                        } bg-card/50 hover:bg-card/80`}
                                    onClick={() => applyCustomTheme(customTheme)}
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg"
                                        style={{
                                            backgroundColor: `hsl(${customTheme.colors.primary})`,
                                        }}
                                    />
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {customTheme.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Custom Theme</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditor(customTheme);
                                            }}
                                            className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                            title="Edit"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteCustomTheme(customTheme.id);
                                            }}
                                            className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add New Button */}
                            {customThemes.length < 6 && (
                                <button
                                    onClick={() => openEditor()}
                                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-border/50 hover:border-primary/50 bg-card/30 hover:bg-card/50 transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <Plus className="w-6 h-6" />
                                    <span className="text-sm font-medium">Create Theme</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Create Custom Theme CTA */}
                {customThemes.length === 0 && (
                    <div className="mb-10">
                        <button
                            onClick={() => openEditor()}
                            className="w-full flex flex-col items-center justify-center gap-2 p-8 rounded-xl border border-dashed border-border/50 hover:border-primary/50 bg-card/30 hover:bg-card/50 transition-colors group"
                        >
                            <Sparkles className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-lg font-bold text-foreground">
                                Create My Own Theme
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Enter the Studio for total visual control
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Sticky Footer with Save/Cancel - Animated */}
            {hasChanges && (
                <div
                    className="sticky bottom-0 z-20 bg-background/95 backdrop-blur-sm border-t border-border mt-auto shadow-[0_-10px_20px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-5 duration-300"
                >
                    <div className="flex items-center justify-end gap-3 px-6 py-4 md:px-8 lg:px-10">
                        <Button variant="ghost" onClick={handleCancel}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
