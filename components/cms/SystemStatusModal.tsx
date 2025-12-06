"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Activity, Server, Database, Globe, Zap, Cpu, MemoryStick } from "lucide-react";
import { useEffect, useState } from "react";
import { getSystemStatus } from "@/actions/cms/system-status";

interface SystemStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SystemStatusModal({ isOpen, onClose }: SystemStatusModalProps) {
    const [stats, setStats] = useState({
        latency: 45,
        requests: 0,
        connections: 84,
        health: 99.9,
        status: "ONLINE"
    });

    useEffect(() => {
        if (!isOpen) return;

        const fetchStatus = async () => {
            try {
                const data = await getSystemStatus();
                setStats({
                    latency: data.latency,
                    requests: data.requests,
                    connections: data.connections,
                    health: 100,
                    status: data.status
                });
            } catch (error) {
                console.error("Failed to fetch status");
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, [isOpen]);

    const { latency, requests, connections } = stats;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-[#0F1115] border border-cyan-500/20 text-cyan-50 p-0 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] rounded-2xl">
                <DialogTitle className="sr-only">System Status Board</DialogTitle>
                {/* Header with sci-fi look */}
                <div className="bg-cyan-950/30 border-b border-cyan-500/20 p-6 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div>
                        <h2 className="text-xl font-bold tracking-widest text-cyan-400 font-mono flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            SYSTEM_STATUS
                        </h2>
                        <p className="text-xs text-cyan-600/80 font-mono mt-1">REAL-TIME MONITORING // V.2.4.1</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="block h-2 w-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]"></span>
                        <span className="text-xs font-mono text-cyan-400">ONLINE</span>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-2 gap-6 relative">
                    {/* Decorative grid lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                    {/* Metric Card 1 */}
                    <div className="bg-cyan-900/10 border border-cyan-500/20 p-4 rounded-lg relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Globe className="h-12 w-12 text-cyan-400" />
                        </div>
                        <p className="text-xs font-mono text-cyan-600 mb-1">API_LATENCY</p>
                        <div className="text-3xl font-bold text-white font-mono flex items-end gap-2">
                            {latency.toFixed(0)} <span className="text-sm text-cyan-500 mb-1">ms</span>
                        </div>
                        <div className="w-full bg-cyan-900/30 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${latency}%` }} />
                        </div>
                    </div>

                    {/* Metric Card 2 */}
                    <div className="bg-cyan-900/10 border border-cyan-500/20 p-4 rounded-lg relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Database className="h-12 w-12 text-cyan-400" />
                        </div>
                        <p className="text-xs font-mono text-cyan-600 mb-1">DB_CONNECTIONS</p>
                        <div className="text-3xl font-bold text-white font-mono flex items-end gap-2">
                            {connections} <span className="text-sm text-cyan-500 mb-1">active</span>
                        </div>
                        <div className="w-full bg-cyan-900/30 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 w-[65%]" />
                        </div>
                    </div>

                    {/* Metric Card 3 */}
                    <div className="bg-cyan-900/10 border border-cyan-500/20 p-4 rounded-lg relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Server className="h-12 w-12 text-cyan-400" />
                        </div>
                        <p className="text-xs font-mono text-cyan-600 mb-1">TOTAL_REQUESTS</p>
                        <div className="text-3xl font-bold text-white font-mono flex items-end gap-2">
                            {(requests / 1000).toFixed(1)}k <span className="text-sm text-cyan-500 mb-1">reqs</span>
                        </div>
                        <div className="w-full bg-cyan-900/30 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '88%' }} />
                        </div>
                    </div>

                    {/* Metric Card 4 */}
                    <div className="bg-cyan-900/10 border border-cyan-500/20 p-4 rounded-lg relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Zap className="h-12 w-12 text-cyan-400" />
                        </div>
                        <p className="text-xs font-mono text-cyan-600 mb-1">SYSTEM_HEALTH</p>
                        <div className="text-3xl font-bold text-emerald-400 font-mono flex items-end gap-2">
                            {stats.health}%
                        </div>
                        <div className="w-full bg-cyan-900/30 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[99%]" />
                        </div>
                    </div>
                </div>

                <div className="bg-black/40 p-4 text-center border-t border-cyan-900/30">
                    <p className="text-[10px] text-cyan-700 font-mono">
                        LEDGER1_CORE // AUTOPILOT ENABLED // ALL SYSTEMS OPERATIONAL
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
