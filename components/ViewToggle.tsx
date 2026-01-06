'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'compact' | 'card';

interface ViewToggleProps {
    value: ViewMode;
    onChange: (value: ViewMode) => void;
    className?: string;
}

/**
 * View toggle component with three view modes:
 * - table: List/table view with rows
 * - compact: Compact grid (2x2 squares)
 * - card: Larger card grid with details
 */
export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            {/* View Label with Icon */}


            {/* Toggle Buttons Container */}
            <div className="flex items-center bg-muted/50 border border-border/50 rounded-md p-1 gap-0.5">
                {/* Table/List View */}
                <button
                    type="button"
                    onClick={() => onChange('table')}
                    className={cn(
                        "p-1.5 rounded transition-all",
                        value === 'table'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                    title="Table View"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="8" x2="21" y1="6" y2="6" />
                        <line x1="8" x2="21" y1="12" y2="12" />
                        <line x1="8" x2="21" y1="18" y2="18" />
                        <line x1="3" x2="3.01" y1="6" y2="6" />
                        <line x1="3" x2="3.01" y1="12" y2="12" />
                        <line x1="3" x2="3.01" y1="18" y2="18" />
                    </svg>
                </button>

                {/* Compact Grid View */}
                <button
                    type="button"
                    onClick={() => onChange('compact')}
                    className={cn(
                        "p-1.5 rounded transition-all",
                        value === 'compact'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                    title="Compact Grid"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect width="7" height="7" x="3" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="14" rx="1" />
                        <rect width="7" height="7" x="3" y="14" rx="1" />
                    </svg>
                </button>

                {/* Card Grid View */}
                <button
                    type="button"
                    onClick={() => onChange('card')}
                    className={cn(
                        "p-1.5 rounded transition-all",
                        value === 'card'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                    title="Card View"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect width="18" height="7" x="3" y="3" rx="1" />
                        <rect width="18" height="7" x="3" y="14" rx="1" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default ViewToggle;
