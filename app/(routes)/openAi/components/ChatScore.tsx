import React from "react";
import { Activity, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { useVaruniLink } from "@/app/hooks/use-varuni-link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ChatScore({ sessionId }: { sessionId: string }) {
    const { insight: data, analyzing, analyzeChat } = useVaruniLink(sessionId);

    // Initial state: Show "Analyze" button
    if (!data && !analyzing) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={analyzeChat}
                className="h-8 gap-2 bg-background/50 backdrop-blur-sm border-dashed"
            >
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">Analyze</span>
            </Button>
        );
    }

    // Loading state
    if (analyzing) {
        return (
            <Button
                variant="outline"
                size="sm"
                disabled
                className="h-8 gap-2 bg-background/50 backdrop-blur-sm"
            >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-xs">Analyzing...</span>
            </Button>
        );
    }

    // Display state
    const getSentimentIcon = (s: string) => {
        if (s === "positive") return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (s === "negative") return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-yellow-500" />;
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 50) return "text-yellow-500";
        return "text-red-500";
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 bg-background/80 backdrop-blur-sm border-primary/20"
                >
                    <div className={`font-bold ${getScoreColor(data!.score)}`}>
                        {data!.score}
                    </div>
                    {getSentimentIcon(data!.sentiment)}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Conversation Analytics</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-2 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Lead Score</span>
                        <span className={`text-lg font-bold ${getScoreColor(data!.score)}`}>
                            {data!.score}/100
                        </span>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Sentiment</span>
                        <div className="flex items-center gap-2 text-sm capitalize">
                            {getSentimentIcon(data!.sentiment)}
                            {data!.sentiment}
                        </div>
                    </div>

                    {data!.topics.length > 0 && (
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-bold">Key Topics</span>
                            <div className="flex flex-wrap gap-1">
                                {data!.topics.map((t, i) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-muted rounded-md">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Reasoning</span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {data!.reasoning}
                        </p>
                    </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={analyzeChat} className="cursor-pointer">
                    <Activity className="w-3.5 h-3.5 mr-2" />
                    Re-Analyze
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
