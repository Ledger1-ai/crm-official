"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
    Loader2,
    MessageSquare,
    Palette,
    Link as LinkIcon,
    Copy,
    RefreshCw,
    ExternalLink,
    Settings,
    Smartphone,
    Eye,
    Clock,
    User,
    Sun,
    Moon,
    Monitor,
    Upload,
    FolderKanban,
    Sparkles,
    Check,
    Plus,
    ChevronDown,
    CheckCircle2,
    XCircle,
    Globe,
} from "lucide-react";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PortalConfig {
    id?: string;
    slug: string;
    name: string;
    welcome_message?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    logo_url?: string;
    logo_type?: string;
    project_id?: string;
    project?: string;
    theme_mode?: "LIGHT" | "DARK" | "AUTO";
    dark_primary_color?: string;
    dark_secondary_color?: string;
    dark_accent_color?: string;
    enable_glass_effect?: boolean;
    background_blur?: number;
    team: string;
    projectInfo?: {
        id: string;
        name: string;
        logo_url?: string;
        primary_color?: string;
    };
    _count?: {
        recipients: number;
        messages: number;
    };
}

interface Project {
    id: string;
    name: string;
    logo_url?: string;
    primary_color?: string;
    icon?: string;
    description?: string;
}

interface SlugValidation {
    checking: boolean;
    available: boolean | null;
    reason: string | null;
    message: string | null;
    normalizedSlug: string | null;
}

export default function PortalSettingsPanel() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [portals, setPortals] = useState<PortalConfig[]>([]);
    const [selectedPortal, setSelectedPortal] = useState<PortalConfig | null>(null);
    const [teamId, setTeamId] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [previewDark, setPreviewDark] = useState(false);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [customSlug, setCustomSlug] = useState("");
    const [slugValidation, setSlugValidation] = useState<SlugValidation>({
        checking: false,
        available: null,
        reason: null,
        message: null,
        normalizedSlug: null,
    });

    const [formData, setFormData] = useState({
        name: "",
        welcome_message: "",
        primary_color: "#0f766e",
        secondary_color: "#f5f5f5",
        accent_color: "#10b981",
        logo_url: "",
        logo_type: "custom" as "custom" | "project",
        project_id: "",
        theme_mode: "AUTO" as "LIGHT" | "DARK" | "AUTO",
        dark_primary_color: "#0f766e",
        dark_secondary_color: "#1f2937",
        dark_accent_color: "#10b981",
        enable_glass_effect: true,
        background_blur: 20,
    });

    // Debounce hook for slug validation
    const useDebounce = (value: string, delay: number) => {
        const [debouncedValue, setDebouncedValue] = useState(value);
        useEffect(() => {
            const timer = setTimeout(() => setDebouncedValue(value), delay);
            return () => clearTimeout(timer);
        }, [value, delay]);
        return debouncedValue;
    };

    const debouncedSlug = useDebounce(customSlug, 500);

    // Check slug availability
    useEffect(() => {
        async function checkSlug() {
            if (!debouncedSlug || debouncedSlug.length < 3) {
                setSlugValidation({
                    checking: false,
                    available: debouncedSlug.length > 0 ? false : null,
                    reason: debouncedSlug.length > 0 ? "too_short" : null,
                    message: debouncedSlug.length > 0 ? "Slug must be at least 3 characters" : null,
                    normalizedSlug: null,
                });
                return;
            }

            setSlugValidation((prev) => ({ ...prev, checking: true }));

            try {
                const excludeId = !isCreateMode && selectedPortal?.id ? `&excludeId=${selectedPortal.id}` : "";
                const res = await fetch(`/api/portals/check-slug?slug=${encodeURIComponent(debouncedSlug)}${excludeId}`);
                const data = await res.json();

                setSlugValidation({
                    checking: false,
                    available: data.available,
                    reason: data.reason || null,
                    message: data.message || null,
                    normalizedSlug: data.normalizedSlug || null,
                });
            } catch (err) {
                setSlugValidation({
                    checking: false,
                    available: null,
                    reason: "error",
                    message: "Failed to check slug availability",
                    normalizedSlug: null,
                });
            }
        }

        checkSlug();
    }, [debouncedSlug, isCreateMode, selectedPortal?.id]);

    // Load team, portals, and projects
    useEffect(() => {
        async function loadData() {
            if (!session?.user?.email) {
                setLoading(false);
                return;
            }

            try {
                // Get user's team
                const teamRes = await fetch("/api/teams/my-team");
                if (teamRes.ok) {
                    const teamData = await teamRes.json();
                    const currentTeamId = teamData.teamId;
                    setTeamId(currentTeamId);

                    if (currentTeamId) {
                        // Load all portals for the team
                        const portalsRes = await fetch(`/api/teams/${currentTeamId}/portals`);
                        if (portalsRes.ok) {
                            const portalsData = await portalsRes.json();
                            const loadedPortals = portalsData.portals || [];
                            setPortals(loadedPortals);

                            // Select first portal by default if exists
                            if (loadedPortals.length > 0) {
                                selectPortal(loadedPortals[0]);
                            } else {
                                // No portals exist, start in create mode
                                setIsCreateMode(true);
                            }
                        }
                    }
                }

                // Load user's projects with logos
                const projectsRes = await fetch("/api/projects/with-logos");
                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json();
                    setProjects(projectsData.all || []);
                }
            } catch (err) {
                console.error("Failed to load portal config:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [session]);

    // Select a portal and load its settings into the form
    const selectPortal = (portal: PortalConfig) => {
        setSelectedPortal(portal);
        setIsCreateMode(false);
        setCustomSlug(portal.slug || "");
        setFormData({
            name: portal.name || "",
            welcome_message: portal.welcome_message || "",
            primary_color: portal.primary_color || "#0f766e",
            secondary_color: portal.secondary_color || "#f5f5f5",
            accent_color: portal.accent_color || "#10b981",
            logo_url: portal.logo_url || "",
            logo_type: (portal.logo_type as "custom" | "project") || "custom",
            project_id: portal.project || portal.project_id || "",
            theme_mode: portal.theme_mode || "AUTO",
            dark_primary_color: portal.dark_primary_color || "#0f766e",
            dark_secondary_color: portal.dark_secondary_color || "#1f2937",
            dark_accent_color: portal.dark_accent_color || "#10b981",
            enable_glass_effect: portal.enable_glass_effect !== false,
            background_blur: portal.background_blur || 20,
        });
    };

    // Start creating a new portal
    const startCreateMode = () => {
        setIsCreateMode(true);
        setSelectedPortal(null);
        setCustomSlug("");
        setFormData({
            name: "",
            welcome_message: "",
            primary_color: "#0f766e",
            secondary_color: "#f5f5f5",
            accent_color: "#10b981",
            logo_url: "",
            logo_type: "custom",
            project_id: "",
            theme_mode: "AUTO",
            dark_primary_color: "#0f766e",
            dark_secondary_color: "#1f2937",
            dark_accent_color: "#10b981",
            enable_glass_effect: true,
            background_blur: 20,
        });
    };

    // Get projects that don't have portals yet
    const getProjectsWithoutPortals = useCallback(() => {
        const portalProjectIds = new Set(portals.map((p) => p.project || p.project_id).filter(Boolean));
        return projects.filter((p) => !portalProjectIds.has(p.id));
    }, [portals, projects]);

    // When project is selected, auto-populate logo and colors from project
    useEffect(() => {
        if (formData.project_id && isCreateMode) {
            const selectedProject = projects.find((p) => p.id === formData.project_id);
            if (selectedProject) {
                // Auto-populate branding from project
                setFormData((prev) => ({
                    ...prev,
                    logo_url: selectedProject.logo_url || prev.logo_url,
                    logo_type: selectedProject.logo_url ? "project" : prev.logo_type,
                    primary_color: selectedProject.primary_color || prev.primary_color,
                    name: prev.name || `${selectedProject.name} Portal`,
                }));
            }
        } else if (formData.logo_type === "project" && formData.project_id) {
            const selectedProject = projects.find((p) => p.id === formData.project_id);
            if (selectedProject?.logo_url) {
                setFormData((prev) => ({
                    ...prev,
                    logo_url: selectedProject.logo_url || "",
                    primary_color: selectedProject.primary_color || prev.primary_color,
                }));
            }
        }
    }, [formData.project_id, formData.logo_type, projects, isCreateMode]);

    const handleSave = async () => {
        if (!teamId) return;

        // Validate slug for new portals
        if (isCreateMode && customSlug && !slugValidation.available && slugValidation.available !== null) {
            toast.error(slugValidation.message || "Please choose a valid slug");
            return;
        }

        setSaving(true);
        try {
            if (isCreateMode) {
                // Create new portal
                const res = await fetch(`/api/teams/${teamId}/portals`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...formData,
                        project_id: formData.project_id || undefined,
                        custom_slug: customSlug || undefined,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to create portal");
                }

                const data = await res.json();
                const newPortal = {
                    ...data.portal,
                    slug: data.portal.portal_slug || data.portal.slug,
                    name: data.portal.portal_name || data.portal.name || "",
                };

                setPortals((prev) => [newPortal, ...prev]);
                selectPortal(newPortal);
                toast.success("Portal created successfully");
            } else if (selectedPortal?.id) {
                // Update existing portal
                const res = await fetch(`/api/teams/${teamId}/portal`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...formData,
                        portal_id: selectedPortal.id,
                        project: formData.project_id || undefined,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to save");
                }

                const data = await res.json();
                const updatedPortal = {
                    ...data.portal,
                    slug: data.portal.portal_slug || data.portal.slug,
                    name: data.portal.portal_name || data.portal.name || "",
                };

                setPortals((prev) => prev.map((p) => (p.id === updatedPortal.id ? updatedPortal : p)));
                setSelectedPortal(updatedPortal);
                toast.success("Portal settings saved successfully");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save portal settings");
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerateSlug = async () => {
        if (!teamId || !selectedPortal) return;

        setRegenerating(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/portal/regenerate-slug`, {
                method: "POST",
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to regenerate");
            }

            const data = await res.json();
            const newSlug = data.portal?.portal_slug || data.slug;
            setSelectedPortal((prev) => (prev ? { ...prev, slug: newSlug } : null));
            setCustomSlug(newSlug);
            setPortals((prev) => prev.map((p) => (p.id === selectedPortal.id ? { ...p, slug: newSlug } : p)));
            toast.success("Portal URL regenerated");
        } catch (err: any) {
            toast.error(err.message || "Failed to regenerate URL");
        } finally {
            setRegenerating(false);
        }
    };

    const copyPortalUrl = () => {
        if (!selectedPortal) return;
        const baseUrl = window.location.origin.replace(/\/[a-z]{2}$/, "");
        const url = `${baseUrl}/portal/${selectedPortal.slug}`;
        navigator.clipboard.writeText(url);
        toast.success("Portal URL copied to clipboard");
    };

    // Get current theme colors for preview
    const currentPrimary = previewDark ? formData.dark_primary_color : formData.primary_color;
    const currentSecondary = previewDark ? formData.dark_secondary_color : formData.secondary_color;
    const currentAccent = previewDark ? formData.dark_accent_color : formData.accent_color;

    // Get slug validation icon
    const getSlugValidationIcon = () => {
        if (slugValidation.checking) {
            return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
        }
        if (slugValidation.available === true) {
            return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        }
        if (slugValidation.available === false) {
            return <XCircle className="w-4 h-4 text-red-500" />;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!teamId && !loading) {
        return (
            <Card className="border-muted">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        No Team Assigned
                    </CardTitle>
                    <CardDescription>You must be assigned to a team to configure the SMS portal.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Portal Selector Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            <CardTitle>SMS Portals</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="min-w-[200px] justify-between">
                                        {isCreateMode ? (
                                            <span className="flex items-center gap-2">
                                                <Plus className="w-4 h-4" />
                                                New Portal
                                            </span>
                                        ) : selectedPortal ? (
                                            <span className="flex items-center gap-2 truncate">
                                                {selectedPortal.projectInfo?.logo_url ? (
                                                    <img
                                                        src={selectedPortal.projectInfo.logo_url}
                                                        alt=""
                                                        className="w-4 h-4 rounded object-contain"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-4 h-4 rounded flex items-center justify-center text-white text-[8px] font-bold"
                                                        style={{ backgroundColor: selectedPortal.primary_color || "#6b7280" }}
                                                    >
                                                        {(selectedPortal.name || "P")[0]}
                                                    </div>
                                                )}
                                                <span className="truncate">{selectedPortal.name}</span>
                                            </span>
                                        ) : (
                                            <span>Select Portal</span>
                                        )}
                                        <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[280px]">
                                    {portals.map((portal) => (
                                        <DropdownMenuItem key={portal.id} onClick={() => selectPortal(portal)} className="flex items-start gap-3 p-3">
                                            {portal.projectInfo?.logo_url ? (
                                                <img src={portal.projectInfo.logo_url} alt="" className="w-8 h-8 rounded object-contain flex-shrink-0" />
                                            ) : (
                                                <div
                                                    className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                                    style={{ backgroundColor: portal.primary_color || "#6b7280" }}
                                                >
                                                    {(portal.name || "P")[0]}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{portal.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{portal.projectInfo?.name || "No project"}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <span>{portal._count?.messages || 0} messages</span>
                                                    <span>•</span>
                                                    <span>{portal._count?.recipients || 0} recipients</span>
                                                </div>
                                            </div>
                                            {selectedPortal?.id === portal.id && !isCreateMode && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                                        </DropdownMenuItem>
                                    ))}
                                    {portals.length > 0 && <DropdownMenuSeparator />}
                                    <DropdownMenuItem onClick={startCreateMode} className="flex items-center gap-2 p-3 text-primary">
                                        <Plus className="w-4 h-4" />
                                        <span className="font-medium">Create New Portal</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <CardDescription>
                        {isCreateMode
                            ? "Create a new SMS portal for a project."
                            : portals.length === 0
                                ? "You don't have any SMS portals yet. Create your first one below."
                                : `Manage your team's SMS portals. You have ${portals.length} portal${portals.length !== 1 ? "s" : ""}.`}
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Portal URL Section (only for existing portals) */}
            {!isCreateMode && selectedPortal && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-primary" />
                                <CardTitle>Portal URL</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-green-500 border-green-500/30">
                                Active
                            </Badge>
                        </div>
                        <CardDescription>The unique URL where your SMS recipients can view their messages securely.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={`${typeof window !== "undefined" ? window.location.origin : ""}/portal/${selectedPortal.slug}`}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button variant="outline" onClick={copyPortalUrl}>
                                <Copy className="w-4 h-4" />
                            </Button>
                            <a
                                href={`/portal/${selectedPortal.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                Slug: <code className="bg-muted px-1 rounded">{selectedPortal.slug}</code>
                            </span>
                            <Button variant="ghost" size="sm" onClick={handleRegenerateSlug} disabled={regenerating}>
                                {regenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                                Regenerate URL
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Custom Slug Input (for create mode) */}
            {isCreateMode && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-primary" />
                            <CardTitle>Portal URL</CardTitle>
                        </div>
                        <CardDescription>Choose a custom slug for your portal URL, or leave blank for auto-generated.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Custom Slug (optional)</Label>
                            <div className="flex gap-2 items-center">
                                <div className="flex-1 relative">
                                    <Input
                                        value={customSlug}
                                        onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                                        placeholder="my-portal-name"
                                        className={`font-mono pr-10 ${slugValidation.available === true
                                            ? "border-green-500 focus-visible:ring-green-500"
                                            : slugValidation.available === false
                                                ? "border-red-500 focus-visible:ring-red-500"
                                                : ""
                                            }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">{getSlugValidationIcon()}</div>
                                </div>
                            </div>
                            {customSlug && (
                                <div className="text-sm">
                                    {slugValidation.checking ? (
                                        <span className="text-muted-foreground">Checking availability...</span>
                                    ) : slugValidation.available === true ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            This slug is available!
                                        </span>
                                    ) : slugValidation.message ? (
                                        <span className="text-red-600 flex items-center gap-1">
                                            <XCircle className="w-3 h-3" />
                                            {slugValidation.message}
                                        </span>
                                    ) : null}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Your portal URL will be: {typeof window !== "undefined" ? window.location.origin : ""}/portal/
                                <span className="font-mono">{customSlug || "[auto-generated]"}</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Logo & Project Selection */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-primary" />
                        <CardTitle>Portal Logo & Project</CardTitle>
                    </div>
                    <CardDescription>
                        {isCreateMode ? "Select a project to link this portal to and auto-populate branding." : "Choose a logo from your projects or upload a custom one."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Project Selection for Create Mode */}
                    {isCreateMode && (
                        <div className="space-y-3 mb-4">
                            <Label>Link to Project (recommended)</Label>
                            {getProjectsWithoutPortals().length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {getProjectsWithoutPortals().map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => setFormData({ ...formData, project_id: project.id })}
                                            className={`relative p-3 rounded-xl border-2 transition-all ${formData.project_id === project.id ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                                                }`}
                                        >
                                            {formData.project_id === project.id && (
                                                <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                            <div className="flex flex-col items-center gap-2">
                                                {project.logo_url ? (
                                                    <img src={project.logo_url} alt={project.name} className="w-12 h-12 rounded-lg object-contain" />
                                                ) : (
                                                    <div
                                                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                                                        style={{ backgroundColor: project.primary_color || "#6b7280" }}
                                                    >
                                                        {project.name[0]}
                                                    </div>
                                                )}
                                                <span className="text-xs font-medium truncate w-full text-center">{project.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">All your projects already have portals, or no projects found.</p>
                            )}
                        </div>
                    )}

                    {/* Logo Type Selection */}
                    <div className="flex gap-4">
                        <Button variant={formData.logo_type === "project" ? "default" : "outline"} onClick={() => setFormData({ ...formData, logo_type: "project" })} className="flex-1">
                            <FolderKanban className="w-4 h-4 mr-2" />
                            From Project
                        </Button>
                        <Button variant={formData.logo_type === "custom" ? "default" : "outline"} onClick={() => setFormData({ ...formData, logo_type: "custom" })} className="flex-1">
                            <Upload className="w-4 h-4 mr-2" />
                            Custom URL
                        </Button>
                    </div>

                    {formData.logo_type === "project" ? (
                        <div className="space-y-3">
                            <Label>Select Project</Label>
                            {projects.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {projects.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => setFormData({ ...formData, project_id: project.id })}
                                            className={`relative p-3 rounded-xl border-2 transition-all ${formData.project_id === project.id ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}`}
                                        >
                                            {formData.project_id === project.id && (
                                                <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                            <div className="flex flex-col items-center gap-2">
                                                {project.logo_url ? (
                                                    <img src={project.logo_url} alt={project.name} className="w-12 h-12 rounded-lg object-contain" />
                                                ) : (
                                                    <div
                                                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                                                        style={{ backgroundColor: project.primary_color || "#6b7280" }}
                                                    >
                                                        {project.name[0]}
                                                    </div>
                                                )}
                                                <span className="text-xs font-medium truncate w-full text-center">{project.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No projects found. Create a project with a brand logo first.</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Logo URL</Label>
                            <Input
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                placeholder="https://yourcompany.com/logo.png"
                            />
                            <p className="text-xs text-muted-foreground">Recommended size: 200x50px</p>
                        </div>
                    )}

                    {formData.logo_url && (
                        <div className="p-4 bg-muted rounded-lg">
                            <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                            <img src={formData.logo_url} alt="Logo preview" className="h-10 w-auto object-contain" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <CardTitle>Theme & Appearance</CardTitle>
                    </div>
                    <CardDescription>Configure light/dark mode and visual effects.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Theme Mode Selector */}
                    <div className="space-y-2">
                        <Label>Theme Mode</Label>
                        <div className="flex gap-2">
                            {[
                                { value: "LIGHT", label: "Light", icon: Sun },
                                { value: "DARK", label: "Dark", icon: Moon },
                                { value: "AUTO", label: "Auto", icon: Monitor },
                            ].map(({ value, label, icon: Icon }) => (
                                <Button
                                    key={value}
                                    variant={formData.theme_mode === value ? "default" : "outline"}
                                    onClick={() => setFormData({ ...formData, theme_mode: value as "LIGHT" | "DARK" | "AUTO" })}
                                    className="flex-1"
                                >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {label}
                                </Button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Auto mode lets users toggle between light and dark themes.</p>
                    </div>

                    {/* Glass Effect Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Glass Morphism Effect</Label>
                            <p className="text-xs text-muted-foreground">Enable frosted glass effect on cards</p>
                        </div>
                        <Switch
                            checked={formData.enable_glass_effect}
                            onCheckedChange={(checked) => setFormData({ ...formData, enable_glass_effect: checked })}
                        />
                    </div>

                    {formData.enable_glass_effect && (
                        <div className="space-y-2">
                            <Label>Blur Intensity: {formData.background_blur}px</Label>
                            <input
                                type="range"
                                min="5"
                                max="40"
                                value={formData.background_blur}
                                onChange={(e) => setFormData({ ...formData, background_blur: parseInt(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Branding Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        <CardTitle>Portal Branding</CardTitle>
                    </div>
                    <CardDescription>Customize colors for light and dark modes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Portal Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your Company Message Portal"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Welcome Message</Label>
                        <Textarea
                            value={formData.welcome_message}
                            onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                            placeholder="Welcome to our secure message portal..."
                            rows={3}
                        />
                    </div>

                    <Separator />

                    {/* Light Mode Colors */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            <Label className="font-semibold">Light Mode Colors</Label>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Primary</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={formData.primary_color}
                                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                        className="w-10 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={formData.primary_color}
                                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Secondary</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={formData.secondary_color}
                                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                                        className="w-10 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={formData.secondary_color}
                                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Accent</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={formData.accent_color}
                                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                                        className="w-10 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={formData.accent_color}
                                        onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Dark Mode Colors */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            <Label className="font-semibold">Dark Mode Colors</Label>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Primary</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={formData.dark_primary_color}
                                        onChange={(e) => setFormData({ ...formData, dark_primary_color: e.target.value })}
                                        className="w-10 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={formData.dark_primary_color}
                                        onChange={(e) => setFormData({ ...formData, dark_primary_color: e.target.value })}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Secondary</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={formData.dark_secondary_color}
                                        onChange={(e) => setFormData({ ...formData, dark_secondary_color: e.target.value })}
                                        className="w-10 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={formData.dark_secondary_color}
                                        onChange={(e) => setFormData({ ...formData, dark_secondary_color: e.target.value })}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Accent</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={formData.dark_accent_color}
                                        onChange={(e) => setFormData({ ...formData, dark_accent_color: e.target.value })}
                                        className="w-10 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={formData.dark_accent_color}
                                        onChange={(e) => setFormData({ ...formData, dark_accent_color: e.target.value })}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Preview Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-primary" />
                            <CardTitle>Mobile Preview</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant={previewDark ? "outline" : "default"} size="sm" onClick={() => setPreviewDark(false)}>
                                <Sun className="w-3 h-3 mr-1" />
                                Light
                            </Button>
                            <Button variant={previewDark ? "default" : "outline"} size="sm" onClick={() => setPreviewDark(true)}>
                                <Moon className="w-3 h-3 mr-1" />
                                Dark
                            </Button>
                            <a
                                href={(() => {
                                    const params = new URLSearchParams({
                                        name: formData.name || "Demo Portal",
                                        welcome: formData.welcome_message || "",
                                        primary: formData.primary_color,
                                        secondary: formData.secondary_color,
                                        accent: formData.accent_color,
                                        dark_primary: formData.dark_primary_color,
                                        dark_secondary: formData.dark_secondary_color,
                                        dark_accent: formData.dark_accent_color,
                                        theme: formData.theme_mode,
                                        glass: formData.enable_glass_effect ? "1" : "0",
                                        blur: formData.background_blur.toString(),
                                        logo: formData.logo_url || "",
                                        demo: "1",
                                    });
                                    return selectedPortal ? `/portal/${selectedPortal.slug}/preview?${params.toString()}` : `/portal/demo/preview?${params.toString()}`;
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1 px-3 h-8 text-sm font-medium border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <Eye className="w-3 h-3" />
                                Full Preview
                            </a>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center">
                        {/* iPhone 16 Pro style frame - aspect ratio 393:852 ≈ 1:2.17 */}
                        <div className="relative" style={{ width: 280 }}>
                            <div
                                className="absolute inset-0 rounded-[52px]"
                                style={{
                                    background: "linear-gradient(145deg, #3a3a3c 0%, #1c1c1e 50%, #2c2c2e 100%)",
                                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.1)",
                                }}
                            />
                            <div className="relative bg-black rounded-[52px] p-[3px]">
                                <div
                                    className="relative overflow-hidden rounded-[49px]"
                                    style={{
                                        height: 607,
                                        background: previewDark ? "#000" : "#fff",
                                    }}
                                >
                                    {/* Dynamic Island */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
                                        <div className="w-[90px] h-[28px] bg-black rounded-full flex items-center justify-center gap-2">
                                            <div className="w-[10px] h-[10px] rounded-full bg-[#1a1a1c] border border-[#2a2a2c] flex items-center justify-center">
                                                <div className="w-[4px] h-[4px] rounded-full bg-[#0c3d6b]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Screen content */}
                                    <div
                                        className="absolute inset-0 overflow-y-auto transition-all duration-300 pt-12 px-4"
                                        style={{
                                            background: previewDark
                                                ? `radial-gradient(ellipse at top, ${currentPrimary}12 0%, transparent 50%), linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)`
                                                : `radial-gradient(ellipse at top, ${currentPrimary}06 0%, transparent 50%), linear-gradient(180deg, #ffffff 0%, #fafafa 50%, #ffffff 100%)`,
                                        }}
                                    >
                                        {/* Header */}
                                        <div className="flex items-center gap-2.5 mb-4">
                                            {formData.logo_url ? (
                                                <img src={formData.logo_url} alt="Logo" className="h-6 w-auto" />
                                            ) : (
                                                <div
                                                    className="h-6 w-6 rounded-md flex items-center justify-center text-white font-bold text-[11px]"
                                                    style={{ backgroundColor: currentPrimary }}
                                                >
                                                    {(formData.name || "P")[0]}
                                                </div>
                                            )}
                                            <span className="font-semibold text-[13px] truncate" style={{ color: previewDark ? "#fff" : "#000" }}>
                                                {formData.name || "Message Portal"}
                                            </span>
                                        </div>

                                        {/* Welcome Message */}
                                        {formData.welcome_message && (
                                            <div
                                                className="mb-4 p-3 rounded-xl text-[11px] leading-relaxed"
                                                style={{
                                                    backgroundColor: previewDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                                                    color: previewDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
                                                }}
                                            >
                                                {formData.welcome_message}
                                            </div>
                                        )}

                                        {/* Message Card */}
                                        <div
                                            className="rounded-2xl overflow-hidden p-3"
                                            style={{
                                                backgroundColor: previewDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.95)",
                                                boxShadow: previewDark ? "0 4px 24px rgba(0, 0, 0, 0.4)" : "0 4px 24px rgba(0, 0, 0, 0.08)",
                                            }}
                                        >
                                            <div className="flex items-start gap-2.5">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-[11px]"
                                                    style={{ backgroundColor: currentPrimary }}
                                                >
                                                    T
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-[12px]" style={{ color: previewDark ? "#fff" : "#000" }}>
                                                        Your Team
                                                    </p>
                                                    <p className="text-[10px]" style={{ color: previewDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }}>
                                                        {format(new Date(), "MMM d, yyyy")}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="mt-2 text-[11px]" style={{ color: previewDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }}>
                                                Sample message preview...
                                            </p>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-4 text-center">
                                            <div
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-medium"
                                                style={{
                                                    backgroundColor: `${currentPrimary}15`,
                                                    color: currentPrimary,
                                                }}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: currentAccent }} />
                                                Secure Message Portal
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Home Indicator */}
                            <div
                                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full"
                                style={{ backgroundColor: previewDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-4">This preview shows how SMS recipients will see messages in the secure portal.</p>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-2">
                {isCreateMode && portals.length > 0 && (
                    <Button variant="outline" onClick={() => selectPortal(portals[0])}>
                        Cancel
                    </Button>
                )}
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                    {isCreateMode ? "Create Portal" : "Save Portal Settings"}
                </Button>
            </div>
        </div>
    );
}
