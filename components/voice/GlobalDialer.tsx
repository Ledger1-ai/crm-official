"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { Phone, ChevronDown, ChevronUp, GripHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import DialerPanel from "@/app/[locale]/(routes)/crm/dialer/DialerPanel";

/**
 * GlobalDialer
 * A floating dialer button and keypad accessible across the CRM.
 * It provides a "Numpad" for quick dialing.
 */
export default function GlobalDialer() {
    const [showPad, setShowPad] = useState(false);
    const [padPos, setPadPos] = useState({ x: 0, y: 0 }); // Will be initialized on mount
    const [singlePhone, setSinglePhone] = useState("");
    const [isDialing, setIsDialing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Dragging state
    const dragState = useRef<{ dragging: boolean; sx: number; sy: number; px: number; py: number }>({
        dragging: false,
        sx: 0,
        sy: 0,
        px: 0,
        py: 0,
    });

    // Initialize position to bottom-rightish, clearing the sidebar
    useEffect(() => {
        // Default: undefined (use CSS positioning for bottom-right corner initially)
        // Only set if we have a saved position or want a specific start
        // Leaving padPos as {0,0} initially and handling in render to default to CSS right/bottom
    }, []);

    // Drag logic
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!dragState.current.dragging) return;
            const dx = e.clientX - dragState.current.sx;
            const dy = e.clientY - dragState.current.sy;

            // Bounds checking (approximate)
            const nx = dragState.current.px + dx;
            const ny = dragState.current.py + dy; // Allow moving freely

            setPadPos({ x: nx, y: ny });
        };
        const onUp = () => {
            if (dragState.current.dragging) {
                dragState.current.dragging = false;
                dragState.current.px = padPos.x;
                dragState.current.py = padPos.y;
            }
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [padPos]);

    const beginDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        dragState.current.dragging = true;
        dragState.current.sx = e.clientX;
        dragState.current.sy = e.clientY;
        dragState.current.px = padPos.x;
        dragState.current.py = padPos.y;
        e.preventDefault();
    };

    // Dialing Logic (Copy from DialerPanel/API)
    const runDial = useCallback(async () => {
        if (!singlePhone.trim()) return;
        try {
            setIsDialing(true);
            const phone = singlePhone.trim();

            // Simple E.164 check
            if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
                toast.error("Invalid phone format. Use E.164 (e.g. +15551234567)");
                return;
            }

            // Trigger standard engage start
            // Note: This API typically triggers the backend. 
            // Ideally, the global softphone should handle this via Streams if active.
            // For now, consistent with DialerPanel 'Single Dial' behavior.
            const res = await fetch("/api/voice/engage/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, includeAgent: true }),
            });

            const j = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(j?.error || "Dial failed");
            }
            toast.success(`Dialing ${phone}...`);
            // Optionally hide pad after dial?
            // setShowPad(false); 
        } catch (e: any) {
            toast.error(e?.message || "Failed to dial");
        } finally {
            setIsDialing(false);
        }
    }, [singlePhone]);

    // Numpad Helpers
    const appendDial = (char: string) => {
        setSinglePhone((prev) => {
            let base = (prev || "").replace(/[^\d+]/g, "");
            if (char === "+") return base.startsWith("+") ? base : "+" + base;
            if (!base.startsWith("+")) base = "+" + base.replace(/^\+*/, "");
            const digit = char.replace(/[^\d]/g, "");
            return base + digit;
        });
    };
    const backspaceDial = () => {
        setSinglePhone((prev) => {
            const base = prev || "";
            if (!base) return "";
            const next = base.slice(0, -1);
            return next === "+" ? "" : next;
        });
    };
    const clearDial = () => setSinglePhone("");

    return (
        <>
            {/* Floating Toggle Button (Always visible if pad is hidden) */}
            {!showPad && (
                <div className="fixed z-[100] bottom-16 right-6 flex items-center justify-end">
                    {/* Collapsed State: Icon Only */}
                    {isMinimized ? (
                        <button
                            onClick={() => setIsMinimized(false)}
                            className={cn(
                                "flex items-center justify-center p-3 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95",
                                "bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/20 backdrop-blur-md"
                            )} title="Expand Numpad"
                        >
                            <Phone className="w-5 h-5" />
                        </button>
                    ) : (
                        /* Expanded State: Pill with Text + Minimize Arrow */
                        <div className="group flex items-center p-1 pl-4 pr-1 gap-2 rounded-full shadow-xl bg-emerald-600/15 border border-emerald-500/20 backdrop-blur-md transition-all hover:bg-emerald-600/20">
                            <button
                                onClick={() => setShowPad(true)}
                                className="flex items-center gap-2 text-emerald-400 font-semibold"
                                title="Open Dialer"
                            >
                                <Phone className="w-4 h-4" />
                                <span>Numpad</span>
                            </button>
                            <div className="w-[1px] h-4 bg-emerald-500/20 mx-1" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMinimized(true);
                                }}
                                className="p-1 rounded-full text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                title="Minimize to icon"
                            >
                                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* The Pad */}
            {showPad && (
                <div
                    className="fixed z-[100] w-[400px] max-w-[95vw] flex flex-col rounded-xl border border-border/50 bg-background/95 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-hidden"
                    style={{
                        left: padPos.x || undefined,
                        top: padPos.y || undefined,
                        right: !padPos.x ? 24 : undefined,
                        bottom: !padPos.y ? 90 : undefined,
                    }}
                >
                    {/* Header / Drag Handle */}
                    <div
                        className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/20 cursor-move rounded-t-xl select-none shrink-0"
                        onMouseDown={beginDrag}
                    >
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <GripHorizontal className="w-4 h-4 opacity-50" />
                            <span>Dialer</span>
                        </div>

                        {/* Collapse Arrow */}
                        <button
                            onClick={() => setShowPad(false)}
                            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Minimize"
                        >
                            <ChevronDown className="w-4 h-4 relative top-[1px]" />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-0 scrollbar-thin h-full bg-background/50">
                        <DialerPanel isCompact={true} />
                    </div>
                </div>
            )}
        </>
    );
}
