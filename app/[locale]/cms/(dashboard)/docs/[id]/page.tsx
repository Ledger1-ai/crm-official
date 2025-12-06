"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { Loader2, Trash, Save, ExternalLink, Eye, Plus, X } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { generateDocPost } from "@/actions/cms/generate-doc-post";
import { enhanceContent } from "@/actions/cms/enhance-content";
import { deleteCategory } from "@/actions/cms/delete-category";
import { AiAssistantModal } from "@/components/cms/AiAssistantModal";
import { AiRevisionPreviewModal } from "@/components/cms/AiRevisionPreviewModal";
import { CustomMarkdownRenderer } from "@/components/ui/custom-markdown-renderer";

export default function DocEditorPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id } = use(params);

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [existingCategories, setExistingCategories] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        category: "",
        order: 0,
        videoUrl: "",
        content: "",
        resources: [] as { label: string, url: string }[],
    });

    // AI Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAiPrompt, setShowAiPrompt] = useState(false);
    const [aiMode, setAiMode] = useState<"create" | "revise">("create");
    const [pendingRevision, setPendingRevision] = useState<any>(null);

    const handleAiGenerate = async (topic: string) => {
        try {
            setIsGenerating(true);
            const generatedData = await generateDocPost(topic);

            setFormData(prev => ({
                ...prev,
                title: generatedData.title,
                slug: generatedData.slug,
                category: generatedData.category || prev.category,
                content: generatedData.content,
            }));

            toast.success("Documentation generated successfully!");
            setShowAiPrompt(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate documentation.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAiRevise = async (instruction: string) => {
        if (!formData.content) {
            toast.error("No content to revise");
            return;
        }

        try {
            setIsGenerating(true);
            const updates = await enhanceContent({
                title: formData.title,
                content: formData.content,
                category: formData.category,
                type: "docs"
            }, instruction);

            setPendingRevision(updates);
            setShowAiPrompt(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to revise content.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAcceptRevision = (finalData: any) => {
        setFormData(prev => ({
            ...prev,
            title: finalData.title || prev.title,
            content: finalData.content || prev.content,
            category: finalData.category || prev.category
        }));
        setPendingRevision(null);
        toast.success("Changes applied successfully!");
    };

    const openAiModal = (mode: "create" | "revise") => {
        setAiMode(mode);
        setShowAiPrompt(true);
    };

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch categories
                const response = await axios.get('/api/docs/categories');
                setExistingCategories(response.data);

                if (id !== "new") {
                    const docResponse = await axios.get(`/api/docs/${id}`);
                    const data = docResponse.data;

                    if (!data) {
                        toast.error("Article not found");
                        router.push("/cms/docs");
                        return;
                    }

                    // Ensure resources is initialized
                    if (!data.resources) data.resources = [];
                    setFormData(data);
                }
            } catch (error) {
                console.error(error);
                if (id !== "new") toast.error("Failed to fetch article");
            } finally {
                setFetching(false);
            }
        };

        init();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id === "new") {
                await axios.post("/api/docs", formData);
                toast.success("Created successfully");
            } else {
                await axios.patch(`/api/docs/${id}`, formData);
                toast.success("Saved changes");
            }
            router.refresh();
            if (id === "new") {
                const newPath = window.location.pathname.replace('/new', '');
                router.push(newPath);
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure?")) return;
        setLoading(true);
        try {
            await axios.delete(`/api/docs/${id}`);
            toast.success("Deleted");
            router.push("/cms/docs");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete");
            setLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!formData.category) return;
        if (!confirm(`DANGER: Are you sure you want to delete the ENTIRE category "${formData.category}" and ALL articles inside it? This cannot be undone.`)) return;

        setLoading(true);
        try {
            const result = await deleteCategory(formData.category);
            toast.success(`Category deleted. Removed ${result.count} articles.`);
            router.push("/cms/docs");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete category");
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background/50 backdrop-blur-sm relative">
            {/* AI Prompt Modal */}
            <AiAssistantModal
                isOpen={showAiPrompt}
                onClose={() => setShowAiPrompt(false)}
                mode={aiMode}
                type="docs"
                isGenerating={isGenerating}
                onGenerate={handleAiGenerate}
                onRevise={handleAiRevise}
            />

            {/* AI Revision Preview Modal */}
            <AiRevisionPreviewModal
                isOpen={!!pendingRevision}
                onClose={() => setPendingRevision(null)}
                onAccept={handleAcceptRevision}
                originalData={{
                    title: formData.title,
                    content: formData.content,
                    category: formData.category
                }}
                newData={pendingRevision || {}}
            />

            {/* Toolbar Header */}
            <div className="h-16 border-b px-6 flex items-center justify-between bg-card/50 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="text-lg font-bold bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-auto placeholder:text-muted-foreground/50 w-[400px]"
                        placeholder="Untitled Article"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {id !== "new" && (
                        <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash className="h-4 w-4" />
                        </Button>
                    )}
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <Button type="button" variant="outline" className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]" onClick={() => openAiModal("create")}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Create
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <Button type="button" variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]" onClick={() => openAiModal("revise")}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Revise
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border border-blue-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Article
                    </Button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_350px]">
                {/* Editor Column */}
                <div className="flex flex-col border-r h-full min-h-0 bg-background">
                    <Tabs defaultValue="editor" className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between px-4 border-b h-10 bg-muted/20">
                            <TabsList className="h-8 bg-transparent p-0">
                                <TabsTrigger value="editor" className="h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs">Write</TabsTrigger>
                                <TabsTrigger value="preview" className="h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-xs">Preview</TabsTrigger>
                            </TabsList>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Markdown Content</span>
                        </div>

                        <TabsContent value="editor" className="flex-1 min-h-0 mt-0 data-[state=active]:flex flex-col relative">
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                                className="flex-1 w-full resize-none border-0 focus-visible:ring-0 p-6 font-mono text-sm leading-relaxed bg-transparent"
                                placeholder="# Start writing..."
                            />
                        </TabsContent>
                        <TabsContent value="preview" className="flex-1 min-h-0 mt-0 overflow-y-auto p-8 prose prose-sm dark:prose-invert max-w-none">
                            {formData.content ? (
                                <CustomMarkdownRenderer content={formData.content} />
                            ) : (
                                <div className="text-muted-foreground text-center mt-20">
                                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    Preview content would render here.
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Settings Sidebar Column */}
                <div className="bg-muted/10 p-6 space-y-8 overflow-y-auto h-full border-l shadow-inner-lg">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Properties</h3>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold">Category</Label>
                            <Input
                                list="categories-list"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                                className="bg-background"
                                placeholder="Select or type new..."
                            />
                            <datalist id="categories-list">
                                {existingCategories.map((cat) => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] text-muted-foreground">Type to create a new category.</p>
                                {formData.category && existingCategories.includes(formData.category) && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteCategory}
                                        className="text-[10px] text-red-500 hover:text-red-400 hover:underline flex items-center gap-1"
                                    >
                                        <Trash className="h-3 w-3" />
                                        Delete Category
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold">URL Slug</Label>
                            <Input
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                required
                                className="font-mono text-xs bg-background"
                                placeholder="my-article-slug"
                            />
                            <p className="text-[10px] text-muted-foreground truncate">/docs/{formData.slug || '...'}</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold">Sort Order</Label>
                            <Input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                required
                                className="bg-background"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold">Video Embed</Label>
                            <Input
                                value={formData.videoUrl || ""}
                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                className="bg-background text-xs"
                                placeholder="Youtube URL"
                            />
                        </div>

                        <Separator />

                        {/* Resources Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linked Resources</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFormData({
                                        ...formData,
                                        resources: [...(formData.resources || []), { label: "", url: "" }]
                                    })}
                                    className="h-6 w-6 p-0 hover:bg-muted"
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {formData.resources && formData.resources.length > 0 ? (
                                    formData.resources.map((res, idx) => (
                                        <div key={idx} className="p-3 bg-background/50 rounded-md border space-y-2 group relative">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const newRes = formData.resources.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, resources: newRes });
                                                }}
                                                className="absolute top-1 right-1 h-5 w-5 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>

                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">Label</Label>
                                                <Input
                                                    placeholder="e.g. Documentation"
                                                    value={res.label}
                                                    onChange={(e) => {
                                                        const newRes = [...formData.resources];
                                                        newRes[idx].label = e.target.value;
                                                        setFormData({ ...formData, resources: newRes });
                                                    }}
                                                    className="h-7 text-xs bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-muted-foreground">URL</Label>
                                                <Input
                                                    placeholder="https://..."
                                                    value={res.url}
                                                    onChange={(e) => {
                                                        const newRes = [...formData.resources];
                                                        newRes[idx].url = e.target.value;
                                                        setFormData({ ...formData, resources: newRes });
                                                    }}
                                                    className="h-7 text-xs bg-background font-mono"
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-4 border border-dashed rounded-md bg-muted/20">
                                        <p className="text-[10px] text-muted-foreground">No resources linked.</p>
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="text-[10px] h-auto p-0 mt-1"
                                            onClick={() => setFormData({
                                                ...formData,
                                                resources: [...(formData.resources || []), { label: "", url: "" }]
                                            })}
                                        >
                                            Add one now
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="pt-2">
                        {formData.slug && (
                            <Link href={`/docs/${formData.slug}`} target="_blank" className="text-xs flex items-center gap-2 text-blue-500 hover:underline">
                                <ExternalLink className="h-3 w-3" />
                                View on live site
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}
