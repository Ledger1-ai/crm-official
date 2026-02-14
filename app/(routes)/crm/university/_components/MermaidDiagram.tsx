"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
    chart: string;
    mobileChart?: string;
    compact?: boolean;
    className?: string;
}

export function MermaidDiagram({ chart, mobileChart, compact, className }: MermaidDiagramProps) {
    const [desktopSvg, setDesktopSvg] = useState<string>("");
    const [mobileSvg, setMobileSvg] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const renderCharts = async () => {
            if (typeof window === "undefined") return;

            try {
                const mermaid = (await import("mermaid")).default;

                // Dark theme compatible
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "dark",
                    themeVariables: {
                        primaryColor: "#3b82f6",
                        primaryTextColor: "#e2e8f0",
                        primaryBorderColor: "#60a5fa",
                        lineColor: "#64748b",
                        secondaryColor: "#1e3a5f",
                        tertiaryColor: "#1a2e3b",
                        background: "transparent",
                        mainBkg: "transparent",
                        nodeBorder: "#475569",
                        clusterBkg: "rgba(15, 23, 42, 0.4)", // Slightly darker and more transparent for elegance
                        clusterBorder: "rgba(71, 85, 105, 0.4)",
                        titleColor: "#94a3b8", // Subdued title color
                        edgeLabelBackground: "transparent",
                        fontSize: "12px", // Slightly smaller font
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                    },
                    flowchart: {
                        htmlLabels: true,
                        curve: "basis", // Smoother curves for a "sexier" look
                        padding: compact ? 12 : 20,
                        nodeSpacing: compact ? 30 : 60,
                        rankSpacing: compact ? 220 : 100, // Significantly stretched in compact mode
                        useMaxWidth: true,
                    },
                    securityLevel: 'loose',
                });

                // Render desktop version
                const desktopId = `mermaid-desktop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const { svg: dSvg } = await mermaid.render(desktopId, chart.trim());
                setDesktopSvg(dSvg);

                // Render mobile version if provided
                if (mobileChart) {
                    const mobileId = `mermaid-mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                    const { svg: mSvg } = await mermaid.render(mobileId, mobileChart.trim());
                    setMobileSvg(mSvg);
                }

                setError(null);
            } catch (err: any) {
                console.error("Mermaid render error:", err);
                setError(err?.message || "Failed to render diagram");
            } finally {
                setIsLoading(false);
            }
        };

        renderCharts();
    }, [chart, mobileChart, compact]);

    if (isLoading) {
        return (
            <div className="w-full h-20 rounded-lg bg-muted/50 animate-pulse flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                <p className="font-semibold">Diagram Error</p>
                <p className="text-xs mt-1">{error}</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "w-full",
                className
            )}
        >
            {/* Desktop: horizontal chart */}
            <div
                className="hidden md:flex md:justify-center md:items-center [&_svg]:w-full [&_svg]:max-w-full [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: desktopSvg }}
            />
            {/* Mobile: vertical chart or scrollable horizontal */}
            {mobileSvg ? (
                <div
                    className="block md:hidden flex justify-center items-center [&_svg]:w-full [&_svg]:max-w-full [&_svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: mobileSvg }}
                />
            ) : (
                <div
                    className="block md:hidden overflow-x-auto [&_svg]:min-w-[600px] [&_svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: desktopSvg }}
                />
            )}
        </motion.div>
    );
}

// ==========================================
// DESKTOP CHARTS - HORIZONTAL (LR)
// ==========================================

export const CRM_FLOW_DIAGRAM = `
%%{init: {'theme': 'dark', 'themeVariables': { 'fontSize': '13px', 'clusterBkg': 'transparent', 'clusterBorder': '#334155' }}}%%
graph LR
    A["Web Form"] --> LEAD
    B["CSV Import"] --> LEAD
    C["AI Generated"] --> LEAD
    D["Manual Entry"] --> LEAD
    
    LEAD["NEW LEAD"] --> S1["1. Identify"]
    S1 --> S2["2. AI Outreach"]
    S2 --> S3["3. Your Turn"]
    S3 --> S4["4. Offering"]
    S4 --> S5["5. Finalizing"]
    S5 --> S6["6. Closed"]
    
    S2 -.->|"Auto"| CONTACT["Contact"]
    S6 -.->|"Auto"| ACCOUNT["Account"]
    
    ACCOUNT --> OPP["Opportunity"]
    ACCOUNT --> CONTRACT["Contract"]

    style A fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0
    style B fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0
    style C fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0
    style D fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0
    style LEAD fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fef3c7
    style S1 fill:#0c4a6e,stroke:#0ea5e9,stroke-width:2px,color:#e0f2fe
    style S2 fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#dbeafe
    style S3 fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#c7d2fe
    style S4 fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#e9d5ff
    style S5 fill:#831843,stroke:#ec4899,stroke-width:2px,color:#fce7f3
    style S6 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#dcfce7
    style CONTACT fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#dbeafe
    style ACCOUNT fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#c7d2fe
    style OPP fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#dcfce7
    style CONTRACT fill:#831843,stroke:#ec4899,stroke-width:2px,color:#fce7f3
`;

// Desktop: Two HORIZONTAL rows stacked vertically
export const CONVERSION_FLOW_DIAGRAM = `
%%{init: {'theme': 'dark', 'themeVariables': { 'fontSize': '13px', 'clusterBkg': 'rgba(30, 41, 59, 0.5)', 'clusterBorder': '#334155' }}}%%
graph TB
    subgraph First[" First Message "]
        direction LR
        L1["Lead"] --> MSG["Send Message"] --> C1["Contact"] --> E1["Engage"]
    end
    
    subgraph Second[" Deal Closed "]
        direction LR
        L2["Lead"] --> WIN["Close Deal"] --> A1["Account"] --> O1["Create Opps"]
    end

    style L1 fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fef3c7
    style L2 fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fef3c7
    style MSG fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#dbeafe
    style WIN fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#dcfce7
    style C1 fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#c7d2fe
    style A1 fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#e9d5ff
    style E1 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#dcfce7
    style O1 fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#dbeafe
`;

// ==========================================
// MOBILE CHARTS - VERTICAL (TB)
// ==========================================

export const CRM_FLOW_DIAGRAM_MOBILE = `
%%{init: {'theme': 'dark', 'themeVariables': { 'fontSize': '12px' }}}%%
graph TB
    A["Web Form"] --> LEAD
    B["CSV Import"] --> LEAD
    C["AI Generated"] --> LEAD
    D["Manual"] --> LEAD
    
    LEAD["NEW LEAD"] --> S1["1. Identify"]
    S1 --> S2["2. AI Outreach"]
    S2 --> S3["3. Your Turn"]
    S3 --> S4["4. Offering"]
    S4 --> S5["5. Finalizing"]
    S5 --> S6["6. Closed"]
    
    S2 -.-> CONTACT["Contact"]
    S6 -.-> ACCOUNT["Account"]
    
    ACCOUNT --> OPP["Opportunity"]

    style A fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    style B fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    style C fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    style D fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    style LEAD fill:#78350f,stroke:#f59e0b,color:#fef3c7
    style S1 fill:#0c4a6e,stroke:#0ea5e9,color:#e0f2fe
    style S2 fill:#1e3a5f,stroke:#3b82f6,color:#dbeafe
    style S3 fill:#312e81,stroke:#6366f1,color:#c7d2fe
    style S4 fill:#4c1d95,stroke:#8b5cf6,color:#e9d5ff
    style S5 fill:#831843,stroke:#ec4899,color:#fce7f3
    style S6 fill:#064e3b,stroke:#10b981,color:#dcfce7
    style CONTACT fill:#1e3a5f,stroke:#3b82f6,color:#dbeafe
    style ACCOUNT fill:#312e81,stroke:#6366f1,color:#c7d2fe
    style OPP fill:#064e3b,stroke:#10b981,color:#dcfce7
`;

export const CONVERSION_FLOW_DIAGRAM_MOBILE = `
%%{init: {'theme': 'dark', 'themeVariables': { 'fontSize': '12px' }}}%%
graph TB
    L1["Lead"] --> MSG["Send Message"]
    MSG --> C1["Contact"]
    C1 --> E1["Keep Engaging"]
    
    L2["Lead"] --> WIN["Close Deal"]
    WIN --> A1["Account"]
    A1 --> O1["Create Opps"]

    style L1 fill:#78350f,stroke:#f59e0b,color:#fef3c7
    style L2 fill:#78350f,stroke:#f59e0b,color:#fef3c7
    style MSG fill:#1e3a5f,stroke:#3b82f6,color:#dbeafe
    style WIN fill:#064e3b,stroke:#10b981,color:#dcfce7
    style C1 fill:#312e81,stroke:#6366f1,color:#c7d2fe
    style A1 fill:#4c1d95,stroke:#8b5cf6,color:#e9d5ff
    style E1 fill:#064e3b,stroke:#10b981,color:#dcfce7
    style O1 fill:#1e3a5f,stroke:#3b82f6,color:#dbeafe
`;

export default MermaidDiagram;
