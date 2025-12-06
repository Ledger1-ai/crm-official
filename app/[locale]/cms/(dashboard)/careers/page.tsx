
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash, Edit, Save, Sparkles } from "lucide-react";
import { MarkdownEditor } from "../_components/MarkdownEditor";
import { generateCareerPost } from "@/actions/cms/generate-career-post";
import { reviseContent } from "@/actions/cms/revise-content";
import { AiAssistantModal } from "@/components/cms/AiAssistantModal";

interface JobPosting {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    summary: string; // Added for AI generation
    content: string; // Replaced 'description'
    requirements: string;
    applyLink: string;
    active: boolean;
}

export default function CareersAdminPage() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingJob, setEditingJob] = useState<Partial<JobPosting> | null>(null);
    const [saving, setSaving] = useState(false);

    // AI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAiPrompt, setShowAiPrompt] = useState(false);
    const [aiMode, setAiMode] = useState<"create" | "revise">("create");

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await fetch("/api/careers");
            const data = await res.json();
            setJobs(data);
        } catch (error) {
            toast.error("Failed to fetch jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingJob?.title) {
            toast.error("Title is required");
            return;
        }

        try {
            setSaving(true);
            const method = editingJob.id ? "PUT" : "POST";
            const res = await fetch("/api/careers", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingJob),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success("Job saved successfully");
            setEditingJob(null);
            fetchJobs();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this job?")) return;

        try {
            const res = await fetch(`/api/careers?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Job deleted");
            fetchJobs();
        } catch (error) {
            toast.error("Failed to delete job");
        }
    };

    const handleAiGenerate = async (topic: string) => {
        try {
            setIsGenerating(true);
            const generatedData = await generateCareerPost(topic);

            setEditingJob(prev => ({
                ...prev,
                title: generatedData.title,
                department: generatedData.department,
                location: generatedData.location,
                type: generatedData.type,
                summary: generatedData.summary,
                content: generatedData.content,
            }));

            toast.success("Job description generated successfully!");
            setShowAiPrompt(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate job description.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAiRevise = async (instruction: string) => {
        if (!editingJob?.content) {
            toast.error("No content to revise");
            return;
        }

        try {
            setIsGenerating(true);
            const revisedContent = await reviseContent(editingJob.content, instruction, "career");

            setEditingJob(prev => ({
                ...prev,
                content: revisedContent
            }));

            toast.success("Content revised successfully!");
            setShowAiPrompt(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to revise content.");
        } finally {
            setIsGenerating(false);
        }
    };

    const openAiModal = (mode: "create" | "revise") => {
        setAiMode(mode);
        setShowAiPrompt(true);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    if (editingJob) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
                <AiAssistantModal
                    isOpen={showAiPrompt}
                    onClose={() => setShowAiPrompt(false)}
                    mode={aiMode}
                    type="career"
                    isGenerating={isGenerating}
                    onGenerate={handleAiGenerate}
                    onRevise={handleAiRevise}
                />

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{editingJob.id ? "Edit Position" : "New Position"}</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => openAiModal("create")}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2 mr-2"
                        >
                            <Sparkles className="h-4 w-4" /> Create AI
                        </button>
                        <button
                            onClick={() => openAiModal("revise")}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2 mr-2"
                        >
                            <Sparkles className="h-4 w-4" /> Revise AI
                        </button>
                        <button onClick={() => setEditingJob(null)} className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-slate-800">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <input
                            className="w-full p-2 border rounded bg-background"
                            value={editingJob.title || ""}
                            onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Department</label>
                        <input
                            className="w-full p-2 border rounded bg-background"
                            value={editingJob.department || ""}
                            onChange={(e) => setEditingJob({ ...editingJob, department: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Location</label>
                        <input
                            className="w-full p-2 border rounded bg-background"
                            value={editingJob.location || ""}
                            onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <select
                            className="w-full p-2 border rounded bg-background"
                            value={editingJob.type || "Full-time"}
                            onChange={(e) => setEditingJob({ ...editingJob, type: e.target.value })}
                        >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Apply Link / Email</label>
                        <input
                            className="w-full p-2 border rounded bg-background"
                            value={editingJob.applyLink || ""}
                            onChange={(e) => setEditingJob({ ...editingJob, applyLink: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2 flex items-center gap-2 pt-6">
                        <input
                            type="checkbox"
                            id="active"
                            checked={editingJob.active ?? true}
                            onChange={(e) => setEditingJob({ ...editingJob, active: e.target.checked })}
                        />
                        <label htmlFor="active" className="text-sm font-medium">Active</label>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Summary</label>
                    <textarea
                        className="w-full p-2 border rounded bg-background h-24"
                        value={editingJob.summary || ""}
                        onChange={(e) => setEditingJob({ ...editingJob, summary: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Content (Markdown)</label>
                    <MarkdownEditor
                        value={editingJob.content || ""}
                        onChange={(val) => setEditingJob({ ...editingJob, content: val })}
                        className="min-h-[200px]"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Requirements (Markdown)</label>
                    <MarkdownEditor
                        value={editingJob.requirements || ""}
                        onChange={(val) => setEditingJob({ ...editingJob, requirements: val })}
                        className="min-h-[200px]"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Careers Management</h1>
                <button
                    onClick={() => setEditingJob({ active: true })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> New Job
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job) => (
                    <div key={job.id} className="bg-white dark:bg-slate-950 border rounded-lg p-6 space-y-4 hover:border-blue-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold">{job.title}</h3>
                                <p className="text-sm text-gray-500">{job.department} • {job.location}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingJob(job)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
                                    <Edit className="h-4 w-4 text-gray-500" />
                                </button>
                                <button onClick={() => handleDelete(job.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
                                    <Trash className="h-4 w-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text - xs px - 2 py - 1 rounded - full ${job.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"} `}>
                                {job.active ? "Active" : "Inactive"}
                            </span>
                            <span className="text-xs text-gray-400">{job.type}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
