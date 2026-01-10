"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
    label: string;
    description?: string;
    value: string; // HSL string like "45 90% 50%"
    onChange: (hsl: string) => void;
}

// Convert HSL string to hex for the color input
function hslToHex(hsl: string): string {
    const parts = hsl.split(" ");
    if (parts.length < 3) return "#000000";

    const h = parseFloat(parts[0]) / 360;
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2].replace("%", "")) / 100;

    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert hex to HSL string
function hexToHsl(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "0 0% 0%";

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Preset colors for quick selection
const PRESETS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#0ea5e9", "#3b82f6", "#8b5cf6",
    "#d946ef", "#ec4899", "#64748b", "#000000",
    "#ffffff", "#f4f4f5", "#e4e4e7", "#d4d4d8",
];

export function ColorPicker({ label, description, value, onChange }: ColorPickerProps) {
    const [hex, setHex] = useState(() => hslToHex(value));
    const [justCopied, setJustCopied] = useState(false);
    // Custom swatches state (14 slots)
    const [customSwatches, setCustomSwatches] = useState<string[]>([]);
    const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);

    // Sync if external value changes (e.g. preset loaded)
    useEffect(() => {
        setHex(hslToHex(value));
    }, [value]);

    // Load custom swatches from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem("theme-custom-swatches");
        if (saved) {
            try {
                setCustomSwatches(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse custom swatches", e);
            }
        } else {
            // Initialize with empty strings or default placeholders if needed
            // For now, we'll just allow adding new ones up to 14
        }

        // Check for EyeDropper support
        if (typeof window !== "undefined" && "EyeDropper" in window) {
            setIsEyeDropperSupported(true);
        }
    }, []);

    const handleColorChange = (newHex: string) => {
        setHex(newHex);
        onChange(hexToHsl(newHex));
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(hex.toUpperCase());
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 2000);
    };

    const handleEyeDropper = async () => {
        if (!isEyeDropperSupported) return;
        try {
            // @ts-ignore - EyeDropper is new
            const eyeDropper = new window.EyeDropper();
            // @ts-ignore
            const result = await eyeDropper.open();
            handleColorChange(result.sRGBHex);
        } catch (e) {
            console.log("EyeDropper canceled or failed", e);
        }
    };

    const saveToCustomSwatch = (colorToSave: string) => {
        let newSwatches = [...customSwatches];
        // If already exists, move to front
        if (newSwatches.includes(colorToSave)) {
            newSwatches = newSwatches.filter(c => c !== colorToSave);
        }
        newSwatches.unshift(colorToSave);
        // Limit to 14
        if (newSwatches.length > 14) {
            newSwatches = newSwatches.slice(0, 14);
        }
        setCustomSwatches(newSwatches);
        localStorage.setItem("theme-custom-swatches", JSON.stringify(newSwatches));
    };

    return (
        <div className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-card/30 hover:border-border/80 hover:bg-card/50 transition-all duration-200 group">
            <div className="flex-1 mr-4">
                <Label className="text-xs font-medium text-foreground cursor-pointer group-hover:text-primary transition-colors">
                    {label}
                </Label>
                {description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-1">
                        {description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {/* Check / Copy Badge */}
                {justCopied && (
                    <span className="text-[10px] text-green-500 font-medium animate-in fade-in zoom-in">Copied!</span>
                )}

                {/* Hex Display (hidden on very small screens) */}
                <div className="hidden sm:flex items-center bg-background/50 border border-border/50 rounded px-1.5 py-0.5 gap-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground">#</span>
                    <span className="text-[10px] font-mono font-medium text-foreground/80">
                        {hex.replace("#", "").toUpperCase()}
                    </span>
                    <button
                        onClick={copyToClipboard}
                        className="ml-0.5 p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy Hex"
                    >
                        <Copy className="w-2.5 h-2.5" />
                    </button>
                    {isEyeDropperSupported && (
                        <button
                            onClick={handleEyeDropper}
                            className="ml-0.5 p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Pick Color from Screen"
                        >
                            <Presentation className="w-2.5 h-2.5 rotate-180" /> {/* Using Presentation as Pipette-like icon implies picking */}
                        </button>
                    )}
                </div>

                {/* Popover Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className="w-9 h-9 rounded-md border border-border/50 shadow-sm transition-transform active:scale-95 hover:scale-105 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 overflow-hidden"
                            title="Pick color"
                            style={{ backgroundColor: hex }}
                        >
                            {/* Solid Color Block - No Icon */}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto p-3 z-[60] bg-neutral-950 border-neutral-800 text-neutral-50 shadow-xl"
                        align="end"
                        side="top"
                        sideOffset={8}
                        collisionPadding={20}
                    >
                        <div className="space-y-3">
                            <HexColorPicker color={hex} onChange={handleColorChange} />

                            <div className="flex gap-2">
                                <div className="flex items-center flex-1 border border-neutral-800 rounded-md px-2 bg-neutral-900 h-8">
                                    <span className="text-neutral-400 text-xs mr-2">#</span>
                                    <HexColorInput
                                        color={hex}
                                        onChange={handleColorChange}
                                        className="w-full bg-transparent text-xs font-mono focus:outline-none uppercase text-neutral-50 placeholder-neutral-500"
                                        prefixed={false}
                                    />
                                </div>
                                {isEyeDropperSupported && (
                                    <button
                                        onClick={handleEyeDropper}
                                        className="h-8 w-8 flex items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                                        title="Pick from Screen"
                                    >
                                        <Presentation className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Preset Colors */}
                            <div>
                                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1.5">Presets</div>
                                <div className="grid grid-cols-8 gap-1">
                                    {PRESETS.map((color) => (
                                        <button
                                            key={color}
                                            className={cn(
                                                "w-5 h-5 rounded-sm border border-white/10 shadow-sm transition-all hover:scale-110",
                                                hex.toLowerCase() === color.toLowerCase() && "ring-2 ring-white ring-offset-1 ring-offset-black"
                                            )}
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleColorChange(color)}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Custom Swatches */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Custom</div>
                                    <button
                                        onClick={() => saveToCustomSwatch(hex)}
                                        className="text-[10px] text-primary hover:underline"
                                    >
                                        + Save Current
                                    </button>
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {/* Render saved swatches */}
                                    {customSwatches.map((color, i) => (
                                        <button
                                            key={`${color}-${i}`}
                                            className={cn(
                                                "w-6 h-6 rounded-sm border border-white/10 shadow-sm transition-all hover:scale-110",
                                                hex.toLowerCase() === color.toLowerCase() && "ring-2 ring-white ring-offset-1 ring-offset-black"
                                            )}
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleColorChange(color)}
                                            title={color}
                                        />
                                    ))}
                                    {/* Fill remaining slots up to 14 with empty placeholders */}
                                    {Array.from({ length: Math.max(0, 14 - customSwatches.length) }).map((_, i) => (
                                        <div
                                            key={`empty-${i}`}
                                            className="w-6 h-6 rounded-sm border border-neutral-800 bg-neutral-900"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}

export { hslToHex, hexToHsl };
