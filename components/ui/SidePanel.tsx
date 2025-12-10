"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export default function SidePanel({ isOpen, onClose, children, className }: SidePanelProps) {
    const [isVisible, setIsVisible] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-50 w-full md:w-[600px] lg:w-[800px] bg-background border-l shadow-2xl transform transition-transform duration-300 ease-in-out sm:max-w-full",
                    isOpen ? "translate-x-0" : "translate-x-full",
                    className
                )}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                        {/* Header actions can go here */}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <div className="h-[calc(100%-60px)] overflow-y-auto">
                    {children}
                </div>
            </div>
        </>
    );
}
