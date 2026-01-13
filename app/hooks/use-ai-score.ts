import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface AiScoreData {
    score: number;
    label: string;
    color: "red" | "yellow" | "green";
    reasoning: string;
    key_factors: string[];
}

export type ScoreType = "LEAD_QUALIFICATION" | "OPPORTUNITY_WIN_PROB" | "EMAIL_URGENCY";

export function useAiScore(type: ScoreType) {
    const [data, setData] = useState<AiScoreData | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const analyze = useCallback(async (scoreData: any, context?: string) => {
        try {
            setAnalyzing(true);
            const res = await fetch("/api/ai/score", {
                method: "POST",
                body: JSON.stringify({ type, data: scoreData, context }),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Analysis failed");

            const json = await res.json();
            setData(json);
            return json;
        } catch (e) {
            console.error(e);
            toast.error("Failed to analyze data");
        } finally {
            setAnalyzing(false);
        }
    }, [type]);

    return { data, analyzing, analyze };
}
