"use client";

import { useCallback, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Node,
    Edge,
    BackgroundVariant,
    Panel,
    useReactFlow,
    ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Save,
    Play,
    Pause,
    Loader2,
    Bug,
    Zap,
} from "lucide-react";
import { activateWorkflow, pauseWorkflow, updateWorkflow } from "@/actions/crm/workflows";
import { toast } from "sonner";

// Custom node components
import { TriggerNode } from "./nodes/TriggerNode";
import { DelayNode } from "./nodes/DelayNode";
import { ActionNode } from "./nodes/ActionNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { ScreenNode } from "./nodes/ScreenNode";
import { UpdateRecordNode } from "./nodes/UpdateRecordNode";
import { LoopNode } from "./nodes/LoopNode";
import { ApprovalNode } from "./nodes/ApprovalNode";
import { NodePalette } from "./NodePalette";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { DebugPanel, ExecutionLog, ExecutionStep } from "./DebugPanel";

interface Workflow {
    id: string;
    name: string;
    description: string | null;
    status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
    trigger_type: string;
    flow_type?: string;
    nodes: unknown;
    edges: unknown;
}

interface WorkflowEditorProps {
    workflow: Workflow;
}

// Use Record<string, any> to satisfy React Flow's flexible node type requirements
const nodeTypes: Record<string, any> = {
    trigger: TriggerNode,
    delay: DelayNode,
    action: ActionNode,
    condition: ConditionNode,
    screen: ScreenNode,
    updateRecord: UpdateRecordNode,
    loop: LoopNode,
    approval: ApprovalNode,
};

function WorkflowEditorInner({ workflow }: WorkflowEditorProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [activating, setActivating] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [debugOpen, setDebugOpen] = useState(false);
    const [execution, setExecution] = useState<ExecutionLog | null>(null);
    const [running, setRunning] = useState(false);

    // Parse nodes and edges from workflow
    const initialNodes = useMemo(() => {
        try {
            return (workflow.nodes as Node[]) || [];
        } catch {
            return [];
        }
    }, [workflow.nodes]);

    const initialEdges = useMemo(() => {
        try {
            return (workflow.edges as Edge[]) || [];
        } catch {
            return [];
        }
    }, [workflow.edges]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId) || null,
        [nodes, selectedNodeId]
    );

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    // Node click → open config panel
    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    // Close config panel
    const closeConfigPanel = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    // Update node data from the config panel
    const handleUpdateNode = useCallback(
        (nodeId: string, newData: Record<string, unknown>) => {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === nodeId) {
                        return { ...n, data: newData };
                    }
                    return n;
                })
            );
        },
        [setNodes]
    );

    // Canvas click → deselect
    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const result = await updateWorkflow(workflow.id, {
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges)),
        });

        if (result.success) {
            toast.success("FlowState saved");
        } else {
            toast.error(result.error || "Failed to save");
        }
        setSaving(false);
    };

    const handleToggleStatus = async () => {
        setActivating(true);

        await updateWorkflow(workflow.id, {
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges))
        });

        const result = workflow.status === "ACTIVE"
            ? await pauseWorkflow(workflow.id)
            : await activateWorkflow(workflow.id);

        if (result.success) {
            toast.success(workflow.status === "ACTIVE" ? "FlowState paused" : "FlowState activated");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to update status");
        }
        setActivating(false);
    };

    const addNode = (type: string, label: string) => {
        const newNode: Node = {
            id: `${type}-${Date.now()}`,
            type,
            position: {
                x: 250 + Math.random() * 100,
                y: 150 + nodes.length * 100
            },
            data: { label },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    // ============ RUN / DEBUG ============

    const simulateExecution = useCallback(async () => {
        setRunning(true);
        setDebugOpen(true);

        const now = Date.now();
        const log: ExecutionLog = {
            id: `exec-${now}`,
            flowId: workflow.id,
            flowName: workflow.name,
            status: "running",
            startTime: now,
            steps: [],
            triggerData: { trigger_type: workflow.trigger_type, flow_type: workflow.flow_type || "AUTO_FLOW" },
        };
        setExecution({ ...log });

        // Walk nodes in topological-ish order (simplified: just follow edges from trigger)
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const visited = new Set<string>();
        const queue: string[] = [];

        // Find the trigger node
        const trigger = nodes.find((n) => n.type === "trigger");
        if (trigger) queue.push(trigger.id);

        const getOutgoingNodeIds = (nodeId: string): string[] => {
            return edges
                .filter((e) => e.source === nodeId)
                .map((e) => e.target)
                .filter((id) => !visited.has(id));
        };

        let hasError = false;

        while (queue.length > 0 && !hasError) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const currentNode = nodeMap.get(currentId);
            if (!currentNode) continue;

            const stepStart = Date.now();
            const step: ExecutionStep = {
                nodeId: currentId,
                nodeType: currentNode.type || "unknown",
                label: (currentNode.data as Record<string, string>)?.label || currentId,
                status: "running",
                startTime: stepStart,
                inputData: currentNode.data as Record<string, unknown>,
            };

            log.steps.push(step);
            setExecution({ ...log });

            // Simulate processing time
            await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

            // Check for missing config → simulate error
            const data = currentNode.data as Record<string, unknown>;
            if (currentNode.type === "action") {
                const actionType = data.actionType as string;
                if (actionType === "send_email" && !data.emailTo) {
                    step.status = "failed";
                    step.error = "Email recipient (To) is not configured";
                    step.endTime = Date.now();
                    log.status = "failed";
                    log.endTime = Date.now();
                    hasError = true;
                    setExecution({ ...log });
                    continue;
                }
            }

            if (currentNode.type === "condition") {
                const conditions = data.conditions as Array<{ field: string }>;
                if (!conditions || conditions.length === 0) {
                    step.status = "failed";
                    step.error = "No conditions defined for decision node";
                    step.endTime = Date.now();
                    log.status = "failed";
                    log.endTime = Date.now();
                    hasError = true;
                    setExecution({ ...log });
                    continue;
                }

                // Simulate: take the "true" branch
                step.branch = "true";
                step.outputData = { evaluatedTo: true };
            }

            if (currentNode.type === "approval") {
                step.branch = "approved";
                step.outputData = { decision: "approved", approver: "manager@team.com" };
            }

            if (currentNode.type === "loop") {
                step.branch = "body";
                step.outputData = { iterationCount: 3 };
            }

            if (currentNode.type === "delay") {
                step.outputData = {
                    duration: data.duration || 1,
                    unit: data.unit || "minutes",
                    note: "Simulated (skipped wait)"
                };
            }

            if (currentNode.type === "updateRecord") {
                step.outputData = {
                    operation: data.operation || "UPDATE",
                    objectType: data.objectType || "Unknown",
                    recordsAffected: Math.floor(Math.random() * 5) + 1,
                };
            }

            if (currentNode.type === "screen") {
                step.outputData = { userInput: { status: "(simulated input)" } };
            }

            step.status = "completed";
            step.endTime = Date.now();
            setExecution({ ...log });

            // Queue outgoing nodes
            const outgoing = getOutgoingNodeIds(currentId);
            for (const nextId of outgoing) {
                queue.push(nextId);
            }
        }

        if (!hasError) {
            log.status = "completed";
            log.endTime = Date.now();
        }
        setExecution({ ...log });
        setRunning(false);

        if (log.status === "completed") {
            toast.success(`FlowState executed — ${log.steps.length} steps completed`);
        } else {
            toast.error("FlowState execution failed. Check debug console.");
        }
    }, [nodes, edges, workflow]);

    const handleHighlightNode = useCallback(
        (nodeId: string) => {
            setSelectedNodeId(nodeId);
            // Center on node
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
                setNodes((nds) =>
                    nds.map((n) => ({
                        ...n,
                        selected: n.id === nodeId,
                    }))
                );
            }
        },
        [nodes, setNodes]
    );

    const statusBadge: Record<string, { label: string; variant: "secondary" | "default" | "outline" | "destructive" }> = {
        DRAFT: { label: "Draft", variant: "secondary" },
        ACTIVE: { label: "Active", variant: "default" },
        PAUSED: { label: "Paused", variant: "outline" },
        ARCHIVED: { label: "Archived", variant: "destructive" },
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/crm/workflows")}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold">{workflow.name}</h1>
                            <Badge variant={statusBadge[workflow.status]?.variant || "secondary"}>
                                {statusBadge[workflow.status]?.label || workflow.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {workflow.description || "No description"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Run Button */}
                    <Button
                        variant="outline"
                        onClick={simulateExecution}
                        disabled={running || nodes.length === 0}
                        className="gap-2"
                    >
                        {running ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Zap className="h-4 w-4 text-orange-500" />
                        )}
                        {running ? "Running..." : "Run"}
                    </Button>

                    {/* Debug Toggle */}
                    <Button
                        variant={debugOpen ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setDebugOpen(!debugOpen)}
                        className="relative"
                    >
                        <Bug className="h-4 w-4" />
                        {execution && (
                            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${execution.status === "completed" ? "bg-green-500" :
                                    execution.status === "failed" ? "bg-red-500" : "bg-blue-500"
                                }`} />
                        )}
                    </Button>

                    <Separator orientation="vertical" className="h-6" />

                    <Button variant="outline" onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save
                    </Button>
                    <Button
                        onClick={handleToggleStatus}
                        disabled={activating}
                        variant={workflow.status === "ACTIVE" ? "outline" : "default"}
                    >
                        {activating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : workflow.status === "ACTIVE" ? (
                            <Pause className="mr-2 h-4 w-4" />
                        ) : (
                            <Play className="mr-2 h-4 w-4" />
                        )}
                        {workflow.status === "ACTIVE" ? "Pause" : "Activate"}
                    </Button>
                </div>
            </div>

            {/* Main area: Canvas + Config Panel */}
            <div className="flex-1 flex min-h-0">
                {/* Canvas */}
                <div className="flex-1 relative flex flex-col min-w-0">
                    <div className="flex-1 relative">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            fitView
                            snapToGrid
                            snapGrid={[15, 15]}
                            defaultEdgeOptions={{
                                animated: true,
                                style: { stroke: "#f97316", strokeWidth: 2 },
                            }}
                        >
                            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                            <Controls />

                            {/* Node Palette */}
                            <Panel position="top-left" className="m-4">
                                <NodePalette onAddNode={addNode} />
                            </Panel>
                        </ReactFlow>
                    </div>

                    {/* Debug Panel (bottom of canvas) */}
                    <DebugPanel
                        execution={execution}
                        isOpen={debugOpen}
                        onClose={() => setDebugOpen(false)}
                        onHighlightNode={handleHighlightNode}
                        onClear={() => setExecution(null)}
                    />
                </div>

                {/* Node Config Side Panel */}
                {selectedNode && (
                    <NodeConfigPanel
                        node={selectedNode}
                        onClose={closeConfigPanel}
                        onUpdateNode={handleUpdateNode}
                        allNodes={nodes}
                    />
                )}
            </div>
        </div>
    );
}

export function WorkflowEditor({ workflow }: WorkflowEditorProps) {
    return (
        <ReactFlowProvider>
            <WorkflowEditorInner workflow={workflow} />
        </ReactFlowProvider>
    );
}
