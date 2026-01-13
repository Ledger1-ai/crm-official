import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface ChatScoreData {
    score: number;
    sentiment: "positive" | "neutral" | "negative";
    topics: string[];
    reasoning: string;
}

export function useChatScore(sessionId: string | null) {
    const [data, setData] = useState<ChatScoreData | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const analyzeChat = useCallback(async () => {
        if (!sessionId) return;
        try {
            setAnalyzing(true);
            const res = await fetch("/api/chat/analyze", {
                method: "POST",
                body: JSON.stringify({ sessionId }),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Analysis failed");

            const json = await res.json();
            setData(json);
            return json;
        } catch (e) {
            console.error(e);
            toast.error("Failed to analyze chat");
        } finally {
            setAnalyzing(false);
        }
    }, [sessionId]);

    return { data, analyzing, analyzeChat };
}
