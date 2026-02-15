
// ==========================================
// PROJECT WORKFLOW DIAGRAMS
// ==========================================

// Shared styles for prominent nodes
const NODE_STYLES = `
    classDef default fill:#1e293b,stroke:#94a3b8,stroke-width:1px,color:#e2e8f0,rx:5,ry:5;
    
    classDef startNode fill:#020617,stroke:#22c55e,stroke-width:2px,color:#4ade80;
    classDef projectNode fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px,color:#bfdbfe;
    classDef poolNode fill:#0c4a6e,stroke:#0ea5e9,stroke-width:2px,color:#bae6fd;
    classDef assignNode fill:#312e81,stroke:#6366f1,stroke-width:2px,color:#c7d2fe;
    classDef outreachNode fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#e9d5ff;
    classDef approvalNode fill:#7c2d12,stroke:#f97316,stroke-width:2px,color:#fed7aa,rx:20,ry:20;
    classDef reviewNode fill:#831843,stroke:#ec4899,stroke-width:2px,color:#fbcfe8;
    classDef activeNode fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#bbf7d0;
    classDef draftNode fill:#27272a,stroke:#71717a,stroke-width:1px,color:#a1a1aa,stroke-dasharray: 5 5;
`;

// Desktop: Horizontal Flow
export const PROJECT_WORKFLOW_DESKTOP = `
%%{
  init: {
    'theme': 'dark',
    'themeVariables': {
      'fontSize': '16px',
      'fontFamily': 'ui-sans-serif, system-ui, sans-serif',
      'edgeLabelBackground': '#0f172a',
      'lineColor': '#64748b'
    },
    'flowchart': {
      'curve': 'basis',
      'nodeSpacing': 50,
      'rankSpacing': 60
    }
  }
}%%
graph LR
    Start((Start)):::startNode --> Campaign[Create Campaign<br/>Define Context]:::projectNode
    Campaign --> Pool[Create Lead Pool<br/>Target Audience]:::poolNode
    Pool --> Assign[Assign Members<br/>Team Allocation]:::assignNode
    Assign --> Outreach[Launch Outreach<br/>Auto-Populated]:::outreachNode
    
    Outreach --> Approval{Approval<br/>Required?}:::approvalNode
    
    Approval -->|Yes| Review[Admin Review]:::reviewNode
    Approval -->|No| Active[Active Outreach]:::activeNode
    
    Review -->|Approved| Active
    Review -->|Rejected| Draft[Back to Draft]:::draftNode
    
    ${NODE_STYLES}
`;

// Mobile: Vertical Flow
export const PROJECT_WORKFLOW_MOBILE = `
%%{
  init: {
    'theme': 'dark',
    'themeVariables': {
      'fontSize': '14px',
      'edgeLabelBackground': '#0f172a',
      'lineColor': '#64748b'
    }
  }
}%%
graph TB
    Start((Start)):::startNode --> Campaign[Create Campaign]:::projectNode
    Campaign --> Pool[Create Lead Pool]:::poolNode
    Pool --> Assign[Assign Members]:::assignNode
    Assign --> Outreach[Launch Outreach]:::outreachNode
    
    Outreach --> Approval{Requires<br/>Approval?}:::approvalNode
    
    Approval -->|Yes| Review[Admin Review]:::reviewNode
    Approval -->|No| Active[Active]:::activeNode
    
    Review -->|Approve| Active
    Review -->|Reject| Draft[Draft]:::draftNode
    
    ${NODE_STYLES}
`;

export const PROJECT_WORKFLOW_LEGEND = [
  { label: "Admin Action", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { label: "Member Action", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { label: "Logic Gate", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { label: "Success", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { label: "Draft/Review", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
];
