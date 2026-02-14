"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type HubLabelProps = {
    label: string;
    isOpen: boolean;
    /** If true, renders a thicker gold divider (for Platform) */
    isDouble?: boolean;
};

const HubLabel = ({ label, isOpen, isDouble = false }: HubLabelProps) => {
    return (
        <div className="w-full">
            {/* Separator line */}
            <div
                className={cn(
                    "mx-2 bg-gradient-to-r from-transparent via-border to-transparent opacity-50",
                    isDouble ? "h-[2px] via-primary/30 my-3" : "h-[1px] my-2"
                )}
            />
            {/* Label text — hidden when collapsed */}
            <motion.div
                initial={false}
                animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 0.7 : 0,
                    marginBottom: isOpen ? 2 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden px-4"
            >
                <span className="text-[9px] font-bold tracking-[2px] uppercase text-primary select-none">
                    {label}
                </span>
            </motion.div>
        </div>
    );
};

export default HubLabel;
