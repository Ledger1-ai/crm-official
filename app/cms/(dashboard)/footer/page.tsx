"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash, Save, GripVertical, Lock } from "lucide-react";

interface FooterLink {
    id?: string;
    text: string;
    url: string;
}

interface FooterSection {
    id?: string;
    title: string;
    order: number;
    isBase?: boolean;
    links: FooterLink[];
}

interface FooterSettings {
    tagline: string;
    copyrightText: string;
    socialXUrl: string;
    socialDiscordUrl: string;
}

export default function FooterAdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<FooterSettings>({
        tagline: "",
        copyrightText: "",
        socialXUrl: "",
        socialDiscordUrl: "",
    });
    const [sections, setSections] = useState<FooterSection[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/footer");
            if (!res.ok) throw new Error("Failed to fetch data");
            const data = await res.json();
            setSettings(data.settings || {
                tagline: "",
                copyrightText: "",
                socialXUrl: "",
                socialDiscordUrl: "",
            });
            setSections(data.sections || []);
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const onSave = async () => {
        try {
            setSaving(true);
            const res = await fetch("/api/footer", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings, sections }),
            });

            if (!res.ok) throw new Error("Failed to save");
            toast.success("Footer updated successfully");
            fetchData();
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const updateSection = (index: number, field: keyof FooterSection, value: any) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setSections(newSections);
    };

    const updateLink = (sectionIndex: number, linkIndex: number, field: keyof FooterLink, value: string) => {
        const newSections = [...sections];
        newSections[sectionIndex].links[linkIndex] = {
            ...newSections[sectionIndex].links[linkIndex],
            [field]: value,
        };
        setSections(newSections);
    };

    const addLink = (sectionIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].links.push({ text: "New Link", url: "/" });
        setSections(newSections);
    };

    const removeLink = (sectionIndex: number, linkIndex: number) => {
        const newSections = [...sections];
        newSections[sectionIndex].links.splice(linkIndex, 1);
        setSections(newSections);
    };

    const addSection = () => {
        setSections([...sections, {
            title: "New Section",
            order: sections.length,
            isBase: false,
            links: []
        }]);
    };

    const removeSection = (index: number) => {
        if (sections[index].isBase) {
            toast.error("Cannot delete base sections");
            return;
        }
        const newSections = [...sections];
        newSections.splice(index, 1);
        setSections(newSections);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Footer Management</h1>
                    <p className="text-slate-400 mt-1">Manage footer sections, links, and settings.</p>
                </div>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </button>
            </div>

            {/* Global Settings */}
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold">Global Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tagline</label>
                        <input
                            className="w-full p-2 border rounded-md bg-slate-900 border-white/10 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            value={settings.tagline}
                            onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Copyright Text</label>
                        <input
                            className="w-full p-2 border rounded-md bg-slate-900 border-white/10 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            value={settings.copyrightText}
                            onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">X (Twitter) URL</label>
                        <input
                            className="w-full p-2 border rounded-md bg-slate-900 border-white/10 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            value={settings.socialXUrl}
                            onChange={(e) => setSettings({ ...settings, socialXUrl: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Discord URL</label>
                        <input
                            className="w-full p-2 border rounded-md bg-slate-900 border-white/10 text-white placeholder:text-slate-500 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            value={settings.socialDiscordUrl}
                            onChange={(e) => setSettings({ ...settings, socialDiscordUrl: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Sections Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Footer Sections</h2>
                <button
                    onClick={addSection}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                >
                    <Plus className="h-4 w-4" /> Add Section
                </button>
            </div>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sections.map((section, sIndex) => (
                    <div key={section.id || sIndex} className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-lg p-5 space-y-4 shadow-lg">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                                {section.isBase && <Lock className="h-4 w-4 text-gray-400" />}
                                <input
                                    className="font-semibold text-lg bg-transparent border-none focus:ring-0 p-0 w-full focus:outline-none text-white placeholder:text-slate-500"
                                    value={section.title}
                                    onChange={(e) => updateSection(sIndex, "title", e.target.value)}
                                    placeholder="Section Title"
                                />
                            </div>
                            {!section.isBase && (
                                <button
                                    onClick={() => removeSection(sIndex)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                    title="Delete Section"
                                >
                                    <Trash className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {section.links.map((link, lIndex) => (
                                <div key={lIndex} className="flex gap-2 items-start group">
                                    <div className="flex-1 space-y-1">
                                        <input
                                            className="w-full text-sm p-1.5 border rounded bg-slate-900 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500 transition-colors"
                                            placeholder="Link Text"
                                            value={link.text}
                                            onChange={(e) => updateLink(sIndex, lIndex, "text", e.target.value)}
                                        />
                                        <input
                                            className="w-full text-xs p-1.5 border rounded bg-slate-900 border-white/10 text-slate-400 placeholder:text-slate-600 focus:border-blue-500 transition-colors"
                                            placeholder="URL"
                                            value={link.url}
                                            onChange={(e) => updateLink(sIndex, lIndex, "url", e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeLink(sIndex, lIndex)}
                                        className="p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => addLink(sIndex)}
                                className="w-full py-2 border border-dashed border-white/20 rounded-md text-sm text-slate-400 hover:bg-white/5 hover:text-white flex items-center justify-center gap-2 transition-all"
                            >
                                <Plus className="h-3 w-3" /> Add Link
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
