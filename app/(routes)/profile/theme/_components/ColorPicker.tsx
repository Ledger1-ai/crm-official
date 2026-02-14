"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Copy, Check, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
    label: string;
    description?: string;
    value: string; // HSL string like "45 90% 50%" or "45 90% 50% / 0.5"
    onChange: (hsl: string) => void;
}

// Convert HSL string to hex (supports alpha)
function hslToHex(hsl: string): string {
    // Normalize spaces
    const normalized = hsl.replace(/\s+/g, " ").trim();

    let baseHsl = normalized;
    let a = 1;

    if (normalized.includes("/")) {
        const [colorPart, alphaPart] = normalized.split("/");
        baseHsl = colorPart.trim();
        const alphaParsed = parseFloat(alphaPart.trim());
        if (!isNaN(alphaParsed)) {
            a = alphaParsed <= 1 ? alphaParsed : alphaParsed / 100;
        }
    }

    const parts = baseHsl.split(" ");
    if (parts.length < 3) return "#000000";

    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }

    const toHex = (n: number) => {
        const hex = Math.round(Math.min(255, Math.max(0, (n + m) * 255))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    const toAlphaHex = (n: number) => {
        const hex = Math.round(Math.min(255, Math.max(0, n * 255))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    const baseHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    // Only append alpha if < 1
    if (a < 1) {
        return `${baseHex}${toAlphaHex(a)}`;
    }

    return baseHex;
}

// Convert hex to HSL string (supports alpha)
function hexToHsl(hex: string): string {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    // Also "03FA" to "0033FFAA"
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b, a) => {
        return r + r + g + g + b + b + (a ? a + a : "");
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    if (!result) return "0 0% 0%";

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    let a = result[4] ? parseInt(result[4], 16) / 255 : 1;

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
        }
        h *= 360;
    }

    const hRound = Math.round(h);
    const sRound = Math.round(s * 100);
    const lRound = Math.round(l * 100);

    if (a < 1) {
        // Return with slash syntax which is modern standard and supported by tailwind roughly if configured right
        // But existing app uses space separated no slash usually. Let's use ` / ` for alpha
        return `${hRound} ${sRound}% ${lRound}% / ${parseFloat(a.toFixed(2))}`;
    }

    return `${hRound} ${sRound}% ${lRound}%`;
}

// Generate tints and shades
function generateTintsAndShades(hex: string) {
    // Very simple implementation needed here to avoid huge deps
    // Parse hex to RGB
    // Tint = mix with white, Shade = mix with black

    // Expand shorthand
    const fullHex = (hex.length === 4 || hex.length === 5)
        ? "#" + hex.slice(1).split('').map(x => x + x).join('')
        : hex;

    const r = parseInt(fullHex.slice(1, 3), 16);
    const g = parseInt(fullHex.slice(3, 5), 16);
    const b = parseInt(fullHex.slice(5, 7), 16);
    // ignore alpha for tints/shades generation usually? keep it? Let's keep it if present
    const hasAlpha = fullHex.length > 7;
    const a = hasAlpha ? fullHex.slice(7, 9) : "";

    const tint = (start: number, factor: number) => Math.round(start + (255 - start) * factor);
    const shade = (start: number, factor: number) => Math.round(start * (1 - factor));

    const toHex = (n: number) => {
        const s = n.toString(16);
        return s.length === 1 ? "0" + s : s;
    };

    const tints = [];
    const shades = [];
    const steps = 5;

    for (let i = 1; i <= steps; i++) {
        const factor = i / (steps + 1);

        // Shade
        const sr = shade(r, factor);
        const sg = shade(g, factor);
        const sb = shade(b, factor);
        shades.push(`#${toHex(sr)}${toHex(sg)}${toHex(sb)}${a}`);

        // Tint
        const tr = tint(r, factor);
        const tg = tint(g, factor);
        const tb = tint(b, factor);
        tints.push(`#${toHex(tr)}${toHex(tg)}${toHex(tb)}${a}`);
    }

    return { tints: tints.reverse(), shades };
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

    const { tints, shades } = generateTintsAndShades(hex);

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
                            <Presentation className="w-2.5 h-2.5 rotate-180" />
                        </button>
                    )}
                </div>

                {/* Popover Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className="w-9 h-9 rounded-md border border-border/50 shadow-sm transition-transform active:scale-95 hover:scale-105 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 overflow-hidden relative"
                            title="Pick color"
                        >
                            {/* Checkerboard background for transparency indication */}
                            <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINHoiIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iLjQiLz48L3N2Zz4=')] opacity-50" />
                            <div className="absolute inset-0 z-10" style={{ backgroundColor: hex }} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-[280px] p-3 z-[60] bg-neutral-950 border-neutral-800 text-neutral-50 shadow-xl"
                        align="end"
                        side="top"
                        sideOffset={8}
                        collisionPadding={20}
                    >
                        <div className="space-y-4">
                            {/* Main Color Picker with Alpha support */}
                            <div className="custom-color-picker [&_.react-colorful__saturation]:!rounded-md [&_.react-colorful__hue]:!rounded-md [&_.react-colorful__alpha]:!rounded-md [&_.react-colorful__hue]:!my-2 [&_.react-colorful__alpha]:!my-2 [&_.react-colorful__hue]:!h-3 [&_.react-colorful__alpha]:!h-3">
                                <HexAlphaColorPicker color={hex} onChange={handleColorChange} />
                            </div>

                            <div className="flex gap-2">
                                <div className="flex items-center flex-1 border border-neutral-800 rounded-md px-2 bg-neutral-900 h-8">
                                    <span className="text-neutral-400 text-xs mr-2">#</span>
                                    <HexColorInput
                                        color={hex}
                                        onChange={handleColorChange}
                                        className="w-full bg-transparent text-xs font-mono focus:outline-none uppercase text-neutral-50 placeholder-neutral-500"
                                        prefixed={false}
                                        alpha={true}
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

                            <div className="h-px bg-neutral-800" />

                            {/* Tints & Shades */}
                            <div>
                                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-2">Tints & Shades</div>
                                <div className="grid grid-cols-10 gap-1 mb-1">
                                    {tints.map((color, i) => (
                                        <button
                                            key={`tint-${i}`}
                                            className="w-full aspect-square rounded-sm border border-white/5 hover:scale-110 hover:z-10 transition-transform relative overflow-hidden"
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleColorChange(color)}
                                            title={color}
                                        >
                                            {/* Texture for alpha */}
                                            <div className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINHoiIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iLjQiLz48L3N2Zz4=')] opacity-50" />
                                        </button>
                                    ))}
                                    {shades.map((color, i) => (
                                        <button
                                            key={`shade-${i}`}
                                            className="w-full aspect-square rounded-sm border border-white/5 hover:scale-110 hover:z-10 transition-transform relative overflow-hidden"
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleColorChange(color)}
                                            title={color}
                                        >
                                            {/* Texture for alpha */}
                                            <div className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINHoiIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iLjQiLz48L3N2Zz4=')] opacity-50" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Swatches */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Saved</div>
                                    <button
                                        onClick={() => saveToCustomSwatch(hex)}
                                        className="text-[10px] text-primary hover:underline"
                                    >
                                        + Save
                                    </button>
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {customSwatches.map((color, i) => (
                                        <button
                                            key={`${color}-${i}`}
                                            className={cn(
                                                "w-full aspect-square rounded-sm border border-white/10 shadow-sm transition-all hover:scale-110 relative overflow-hidden",
                                                hex.toLowerCase() === color.toLowerCase() && "ring-2 ring-white ring-offset-1 ring-offset-black"
                                            )}
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleColorChange(color)}
                                            title={color}
                                        >
                                            {/* Texture for alpha */}
                                            <div className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINHoiIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iLjQiLz48L3N2Zz4=')] opacity-50" />
                                        </button>
                                    ))}
                                    {Array.from({ length: Math.max(0, 14 - customSwatches.length) }).map((_, i) => (
                                        <div
                                            key={`empty-${i}`}
                                            className="w-full aspect-square rounded-sm border border-neutral-800 bg-neutral-900"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Preset Colors */}
                            <div>
                                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1.5">Presets</div>
                                <div className="grid grid-cols-8 gap-1">
                                    {PRESETS.map((color) => (
                                        <button
                                            key={color}
                                            className={cn(
                                                "w-full aspect-square rounded-sm border border-white/10 shadow-sm transition-all hover:scale-110 relative overflow-hidden",
                                                hex.toLowerCase() === color.toLowerCase() && "ring-2 ring-white ring-offset-1 ring-offset-black"
                                            )}
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleColorChange(color)}
                                            title={color}
                                        >
                                            {/* Texture for alpha */}
                                            <div className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6bTQgNGg0djRINHoiIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iLjQiLz48L3N2Zz4=')] opacity-50" />
                                        </button>
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
