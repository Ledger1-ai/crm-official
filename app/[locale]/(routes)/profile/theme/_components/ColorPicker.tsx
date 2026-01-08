"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ColorPicker({ label, description, value, onChange }: ColorPickerProps) {
    const [hexValue, setHexValue] = useState(() => hslToHex(value));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setHexValue(hslToHex(value));
    }, [value]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        setHexValue(hex);
        onChange(hexToHsl(hex));
    };

    const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        setHexValue(hex);
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            onChange(hexToHsl(hex));
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(hexValue.toUpperCase());
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30 hover:border-border transition-colors">
            <div className="flex items-center gap-3">
                {/* Color preview swatch */}
                <button
                    onClick={() => inputRef.current?.click()}
                    className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer overflow-hidden"
                    style={{ backgroundColor: hexValue }}
                >
                    <input
                        ref={inputRef}
                        type="color"
                        value={hexValue}
                        onChange={handleColorChange}
                        className="opacity-0 absolute w-0 h-0"
                    />
                </button>

                <div>
                    <p className="font-medium text-foreground text-sm">{label}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>

            {/* Hex input with copy */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={hexValue.toUpperCase()}
                    onChange={handleHexInputChange}
                    className="w-24 px-3 py-1.5 text-sm font-mono bg-muted/50 border border-border/50 rounded-md text-foreground"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyToClipboard}
                >
                    <Copy className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

export { hslToHex, hexToHsl };
