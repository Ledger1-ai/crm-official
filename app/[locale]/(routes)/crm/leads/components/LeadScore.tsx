import React, { useEffect } from "react";
import { Activity, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw } from "lucide-react";
import { useAiScore } from "@/app/hooks/use-ai-score";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface LeadScoreProps {
    leadData: any; // Ideally typed with your Lead schema
}

export function LeadScore({ leadData }: LeadScoreProps) {
    const { data, analyzing, analyze } = useAiScore("LEAD_QUALIFICATION");

    const handleAnalyze = () => {
        // Prepare relevant data for the AI
        const analysisData = {
            id: leadData.id,
            name: `${leadData.firstName} ${leadData.lastName}`,
            company: leadData.company,
            title: leadData.jobTitle,
            email: leadData.email,
            description: leadData.description,
            source: leadData.lead_source,
            industry: leadData.industry, // if available
        };
        analyze(analysisData);
    };

    // Auto-analyze if no data? Maybe better to user-trigger to save tokens initially.

    if (analyzing) {
        return (
            <Button variant="outline" size="sm" disabled className="gap-2 bg-background/50 backdrop-blur-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-xs">Scoring Lead...</span>
            </Button>
        );
    }

    if (!data) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                className="gap-2 bg-background/50 backdrop-blur-sm border-dashed"
            >
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">Qualify Lead</span>
            </Button>
        );
    }

    const getScoreColor = (c: "red" | "yellow" | "green") => {
        if (c === "green") return "text-green-500 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900";
        if (c === "yellow") return "text-yellow-500 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900";
        return "text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900";
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`gap-2 h-9 border ${getScoreColor(data.color)}`}
                >
                    <span className="font-bold">{data.score}</span>
                    <span className="text-xs opacity-80 font-normal">| {data.label}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Lead Qualification Analysis</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-3 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Quality Score</span>
                        <div className={`p-1 px-2 rounded-md border text-sm font-bold ${getScoreColor(data.color)}`}>
                            {data.score}/100
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Key Factors</span>
                        <div className="flex flex-col gap-1">
                            {data.key_factors.map((f, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                    <div className={`w-1 h-1 mt-1.5 rounded-full bg-primary/50 shrink-0`} />
                                    <span>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Reasoning</span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {data.reasoning}
                        </p>
                    </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAnalyze} className="cursor-pointer">
                    <RefreshCw className="w-3.5 h-3.5 mr-2" />
                    Re-Analyze Lead
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
