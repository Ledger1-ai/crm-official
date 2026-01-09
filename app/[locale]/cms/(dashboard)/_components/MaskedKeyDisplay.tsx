"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MaskedKeyDisplayProps {
    keyValue: string;
}

export default function MaskedKeyDisplay({ keyValue }: MaskedKeyDisplayProps) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [copied, setCopied] = useState(false);

    // Mask key - show only last 4 characters
    const maskedKey = keyValue
        ? `${"•".repeat(Math.max(0, keyValue.length - 4))}${keyValue.slice(-4)}`
        : "";

    const handleCopy = async () => {
        await navigator.clipboard.writeText(keyValue);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2">
            <code className={cn(
                "text-xs font-mono px-2 py-1 bg-muted/50 rounded border border-border/50",
                "max-w-[120px] truncate"
            )}>
                {isRevealed ? keyValue : maskedKey}
            </code>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsRevealed(!isRevealed)}
                title={isRevealed ? "Hide key" : "Reveal key"}
            >
                {isRevealed ? (
                    <EyeOff className="w-3.5 h-3.5" />
                ) : (
                    <Eye className="w-3.5 h-3.5" />
                )}
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
                title="Copy key"
            >
                {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                    <Copy className="w-3.5 h-3.5" />
                )}
            </Button>
        </div>
    );
}
