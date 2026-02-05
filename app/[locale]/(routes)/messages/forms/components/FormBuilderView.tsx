"use client";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
    Plus, Copy, Code, Eye, Trash2, Settings, ChevronDown, ChevronRight,
    GripVertical, FileText, Lock, Globe, Users, Sparkles, Braces, Loader2,
    Palette, RefreshCw, Search, BarChart3, ExternalLink, MoreHorizontal, Shield,
    LineChart, PenLine
} from "lucide-react";
import AnalyticsCharts from "@/app/[locale]/cms/(dashboard)/components/AnalyticsCharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";

interface FormField {
    id: string;
    name: string;
    label: string;
    placeholder?: string;
    help_text?: string;
    field_type: string;
    options?: string[];
    is_required: boolean;
    lead_field_mapping?: string;
    position: number;
}

interface FormTheme {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderRadius: string;
    fontFamily: string;
    buttonTextColor: string;
    labelColor: string;
    inputBgColor: string;
}

const DEFAULT_THEME: FormTheme = {
    primaryColor: "#F54029",
    backgroundColor: "#ffffff",
    textColor: "#333333",
    borderColor: "#cccccc",
    borderRadius: "4px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    buttonTextColor: "#ffffff",
    labelColor: "#374151",
    inputBgColor: "#ffffff",
};

interface Form {
    id: string;
    name: string;
    description?: string;
    slug: string;
    status: string;
    visibility: "PUBLIC" | "PRIVATE";
    project_id?: string;
    created_by?: string;
    primary_color?: string;
    custom_css?: string;
    require_captcha: boolean;
    captcha_site_key?: string;
    captcha_secret_key?: string;
    webhook_url?: string;
    submission_behavior: "MESSAGE" | "REDIRECT";
    redirect_url?: string;
    success_message?: string;
    notify_emails?: string[];
    auto_respond: boolean;
    auto_respond_subject?: string;
    auto_respond_body?: string;
    fields: FormField[];
    _count: {
        submissions: number;
    };
    createdAt: Date;
}

interface Project {
    id: string;
    title: string;
}

interface FormBuilderViewProps {
    forms: Form[];
    projects: Project[];
    baseUrl: string;
    currentUserId: string;
    teamCaptchaConfig?: {
        site_key: string;
        secret_key: string;
    } | null;
}

// Field types must match Prisma FormFieldType enum exactly
const FIELD_TYPES = [
    { value: "TEXT", label: "Text" },
    { value: "TEXTAREA", label: "Text Area" },
    { value: "EMAIL", label: "Email" },
    { value: "PHONE", label: "Phone" },
    { value: "NUMBER", label: "Number" },
    { value: "SELECT", label: "Dropdown" },
    { value: "MULTI_SELECT", label: "Multi-Select" },
    { value: "CHECKBOX", label: "Checkbox" },
    { value: "RADIO", label: "Radio Buttons" },
    { value: "DATE", label: "Date" },
    { value: "TIME", label: "Time" },
    { value: "DATETIME", label: "Date & Time" },
    { value: "FILE", label: "File Upload" },
    { value: "HIDDEN", label: "Hidden" },
    { value: "CONSENT", label: "Consent / Terms" },
];

const LEAD_FIELD_MAPPINGS = [
    { value: "__none__", label: "No mapping" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "firstName", label: "First Name" },
    { value: "lastName", label: "Last Name" },
    { value: "name", label: "Full Name" },
    { value: "company", label: "Company" },
    { value: "jobTitle", label: "Job Title" },
    { value: "website", label: "Website" },
    { value: "address", label: "Address" },
    { value: "city", label: "City" },
    { value: "state", label: "State" },
    { value: "zip", label: "ZIP Code" },
    { value: "country", label: "Country" },
];

const FORM_TEMPLATES = {
    blank: {
        id: "blank",
        name: "Blank Form",
        description: "Start from scratch with a clean slate.",
        fields: [
            { name: "email", label: "Email", field_type: "EMAIL", is_required: true, lead_field_mapping: "email" }
        ]
    },
    contact: {
        id: "contact",
        name: "Contact Us",
        description: "Standard contact form with Name, Email, and Message.",
        fields: [
            { name: "name", label: "Name", field_type: "TEXT", is_required: true, lead_field_mapping: "name", placeholder: "John Doe" },
            { name: "email", label: "Email", field_type: "EMAIL", is_required: true, lead_field_mapping: "email", placeholder: "john@example.com" },
            { name: "message", label: "Message", field_type: "TEXTAREA", is_required: true, lead_field_mapping: "__none__", placeholder: "How can we help you?" }
        ]
    },
    quote: {
        id: "quote",
        name: "Quote Request",
        description: "Collect detailed requirements, budget, and file attachments.",
        fields: [
            { name: "name", label: "Name", field_type: "TEXT", is_required: true, lead_field_mapping: "name", placeholder: "Your Name" },
            { name: "email", label: "Email", field_type: "EMAIL", is_required: true, lead_field_mapping: "email", placeholder: "your@email.com" },
            { name: "company", label: "Company", field_type: "TEXT", is_required: false, lead_field_mapping: "company", placeholder: "Company Name" },
            { name: "details", label: "Project Details", field_type: "TEXTAREA", is_required: true, lead_field_mapping: "__none__", placeholder: "Describe your project..." },
            { name: "budget", label: "Estimated Budget", field_type: "SELECT", options: ["< $1k", "$1k - $5k", "$5k - $10k", "$10k+"], is_required: false, lead_field_mapping: "__none__" },
            { name: "rfp", label: "Attach RFP / Specs", field_type: "FILE", is_required: false, lead_field_mapping: "__none__" }
        ]
    },
    newsletter: {
        id: "newsletter",
        name: "Newsletter Signup",
        description: "Simple email capture for list building.",
        fields: [
            { name: "email", label: "Email Address", field_type: "EMAIL", is_required: true, lead_field_mapping: "email", placeholder: "Enter your email" }
        ]
    },
    job_application: {
        id: "job_application",
        name: "Job Application",
        description: "Collect applications with resume upload.",
        fields: [
            { name: "name", label: "Full Name", field_type: "TEXT", is_required: true, lead_field_mapping: "name", placeholder: "Candidate Name" },
            { name: "email", label: "Email", field_type: "EMAIL", is_required: true, lead_field_mapping: "email", placeholder: "email@example.com" },
            { name: "phone", label: "Phone", field_type: "PHONE", is_required: true, lead_field_mapping: "phone", placeholder: "+1 (555) 000-0000" },
            { name: "resume", label: "Resume / CV", field_type: "FILE", is_required: true, lead_field_mapping: "__none__" },
            { name: "portfolio", label: "Portfolio URL", field_type: "TEXT", is_required: false, lead_field_mapping: "__none__", placeholder: "https://portfolio.com" }
        ]
    },
    support_ticket: {
        id: "support_ticket",
        name: "Support Ticket",
        description: "Support request with priority level.",
        fields: [
            { name: "name", label: "Name", field_type: "TEXT", is_required: true, lead_field_mapping: "name", placeholder: "Your Name" },
            { name: "email", label: "Email", field_type: "EMAIL", is_required: true, lead_field_mapping: "email", placeholder: "your@email.com" },
            { name: "priority", label: "Priority", field_type: "SELECT", options: ["Low", "Medium", "High", "Urgent"], is_required: true, lead_field_mapping: "__none__" },
            { name: "category", label: "Category", field_type: "SELECT", options: ["General", "Technical", "Billing", "Feature Request"], is_required: true, lead_field_mapping: "__none__" },
            { name: "issue", label: "Issue Description", field_type: "TEXTAREA", is_required: true, lead_field_mapping: "__none__", placeholder: "Please describe your issue..." }
        ]
    }
};

export function FormBuilderView({ forms: initialForms, projects, baseUrl, currentUserId, teamCaptchaConfig }: FormBuilderViewProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [forms, setForms] = useState<Form[]>(initialForms);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEmbedDialog, setShowEmbedDialog] = useState(false);
    const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
    const [selectedForm, setSelectedForm] = useState<Form | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingTheme, setIsSavingTheme] = useState(false);
    const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set());
    const [selectedTemplate, setSelectedTemplate] = useState("blank");

    // NEW: View toggle, search, and delete state
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteConfirmForm, setDeleteConfirmForm] = useState<Form | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Theme customization state
    const [formTheme, setFormTheme] = useState<FormTheme>(DEFAULT_THEME);

    // Settings state
    const [formSettings, setFormSettings] = useState<Partial<Form>>({});
    const [activeSettingsTab, setActiveSettingsTab] = useState("general");
    const [analyticsData, setAnalyticsData] = useState<{ kpi: any[], chartData: any[] } | null>(null);

    useEffect(() => {
        setAnalyticsData(null);
    }, [selectedForm]);

    useEffect(() => {
        if (activeSettingsTab === 'analytics' && selectedForm && !analyticsData) {
            fetch(`/api/forms/${selectedForm.id}/analytics`)
                .then(res => res.json())
                .then(data => setAnalyticsData(data))
                .catch(err => console.error("Failed to load analytics", err));
        }
    }, [activeSettingsTab, selectedForm, analyticsData]);

    const [newForm, setNewForm] = useState({
        name: "",
        description: "",
        project_id: "",
        visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
        require_captcha: false,
        webhook_url: "",
        submission_behavior: "MESSAGE" as "MESSAGE" | "REDIRECT",
        redirect_url: "",
        success_message: "",
        notify_emails: [] as string[],
        auto_respond: false,
        auto_respond_subject: "",
        auto_respond_body: "",
        fields: [
            { name: "email", label: "Email", field_type: "EMAIL", is_required: true, lead_field_mapping: "email" },
        ] as Partial<FormField>[],
    });

    // Advanced mode state
    const [editorMode, setEditorMode] = useState<"basic" | "advanced">("basic");
    const [jsonValue, setJsonValue] = useState("");
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");

    // Filter forms based on search query
    const filteredForms = useMemo(() => {
        if (!searchQuery.trim()) return forms;
        const query = searchQuery.toLowerCase();
        return forms.filter(form =>
            form.name.toLowerCase().includes(query) ||
            (form.description?.toLowerCase().includes(query))
        );
    }, [forms, searchQuery]);

    // Calculate stats
    const stats = useMemo(() => ({
        total: forms.length,
        totalSubmissions: forms.reduce((sum, f) => sum + (f._count?.submissions || 0), 0),
        active: forms.filter(f => f.status === "ACTIVE").length,
    }), [forms]);

    // Delete form function
    const handleDeleteForm = async () => {
        if (!deleteConfirmForm) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/forms/${deleteConfirmForm.id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete form");
            }
            setForms(prev => prev.filter(f => f.id !== deleteConfirmForm.id));
            toast({ title: "Success", description: "Form deleted successfully" });
            setDeleteConfirmForm(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete form", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleFormExpanded = (id: string) => {
        setExpandedForms((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const addField = () => {
        setNewForm((prev) => ({
            ...prev,
            fields: [
                ...prev.fields,
                {
                    name: `field_${Date.now()}`,
                    label: "New Field",
                    field_type: "TEXT",
                    is_required: false,
                },
            ],
        }));
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        setNewForm((prev) => ({
            ...prev,
            fields: prev.fields.map((f, i) => (i === index ? { ...f, ...updates } : f)),
        }));
    };

    const removeField = (index: number) => {
        setNewForm((prev) => ({
            ...prev,
            fields: prev.fields.filter((_, i) => i !== index),
        }));
    };

    // Generate JSON from form state
    const generateFormJson = () => {
        const formConfig = {
            name: newForm.name,
            description: newForm.description,
            visibility: newForm.visibility,
            require_captcha: newForm.require_captcha,
            webhook_url: newForm.webhook_url,
            notify_emails: newForm.notify_emails,
            auto_respond: newForm.auto_respond,
            auto_respond_subject: newForm.auto_respond_subject,
            auto_respond_body: newForm.auto_respond_body,
            fields: newForm.fields.map((f, i) => ({
                name: f.name,
                label: f.label,
                field_type: f.field_type,
                placeholder: f.placeholder || null,
                help_text: f.help_text || null,
                is_required: f.is_required || false,
                lead_field_mapping: f.lead_field_mapping && f.lead_field_mapping !== "__none__" ? f.lead_field_mapping : null,
                options: f.options || null,
                position: i,
            })),
        };
        return JSON.stringify(formConfig, null, 2);
    };

    // Parse JSON to form state
    const parseJsonToForm = (json: string) => {
        try {
            const parsed = JSON.parse(json);
            setNewForm({
                name: parsed.name || "",
                description: parsed.description || "",
                project_id: newForm.project_id,
                visibility: parsed.visibility || "PUBLIC",
                require_captcha: parsed.require_captcha || false,
                webhook_url: parsed.webhook_url || "",
                submission_behavior: parsed.submission_behavior || "MESSAGE",
                redirect_url: parsed.redirect_url || "",
                success_message: parsed.success_message || "Thank you for your submission!",
                notify_emails: parsed.notify_emails || [],
                auto_respond: parsed.auto_respond || false,
                auto_respond_subject: parsed.auto_respond_subject || "",
                auto_respond_body: parsed.auto_respond_body || "",
                fields: (parsed.fields || []).map((f: any) => ({
                    name: f.name || "",
                    label: f.label || "",
                    field_type: f.field_type || "TEXT",
                    placeholder: f.placeholder || "",
                    help_text: f.help_text || "",
                    is_required: f.is_required || false,
                    lead_field_mapping: f.lead_field_mapping || "__none__",
                    options: f.options,
                })),
            });
            setJsonError(null);
            return true;
        } catch (e: any) {
            setJsonError(e.message);
            return false;
        }
    };

    // Switch to advanced mode
    const switchToAdvanced = () => {
        setJsonValue(generateFormJson());
        setJsonError(null);
        setEditorMode("advanced");
    };

    // Switch to basic mode
    const switchToBasic = () => {
        if (parseJsonToForm(jsonValue)) {
            setEditorMode("basic");
        }
    };

    // Handle JSON changes - auto-sync to basic view
    const handleJsonChange = (value: string) => {
        setJsonValue(value);
        try {
            const parsed = JSON.parse(value);
            setJsonError(null);
            // Auto-sync to basic view state
            setNewForm({
                name: parsed.name || "",
                description: parsed.description || "",
                project_id: newForm.project_id,
                visibility: parsed.visibility || "PUBLIC",
                require_captcha: parsed.require_captcha || false,
                webhook_url: parsed.webhook_url || "",
                submission_behavior: parsed.submission_behavior || "MESSAGE",
                redirect_url: parsed.redirect_url || "",
                success_message: parsed.success_message || "Thank you for your submission!",
                notify_emails: parsed.notify_emails || [],
                auto_respond: parsed.auto_respond || false,
                auto_respond_subject: parsed.auto_respond_subject || "",
                auto_respond_body: parsed.auto_respond_body || "",
                fields: (parsed.fields || []).map((f: any) => ({
                    name: f.name || "",
                    label: f.label || "",
                    field_type: f.field_type || "TEXT",
                    placeholder: f.placeholder || "",
                    help_text: f.help_text || "",
                    is_required: f.is_required || false,
                    lead_field_mapping: f.lead_field_mapping || "__none__",
                    options: f.options,
                })),
            });
        } catch (e: any) {
            setJsonError(e.message);
        }
    };

    // AI Enhancement / Generation
    const enhanceWithAI = async () => {
        setIsEnhancing(true);
        try {
            const currentJson = editorMode === "advanced" ? jsonValue : generateFormJson();
            const currentConfig = currentJson ? JSON.parse(currentJson) : null;

            const response = await fetch("/api/forms/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    formConfig: currentConfig,
                    prompt: aiPrompt,
                }),
            });

            if (!response.ok) throw new Error("Enhancement failed");

            const result = await response.json();

            if (result.enhanced) {
                const enhancedJson = JSON.stringify(result.enhanced, null, 2);
                setJsonValue(enhancedJson);
                parseJsonToForm(enhancedJson);
                if (editorMode === "basic") {
                    // Stay in basic mode
                } else {
                    // Update JSON view
                }
                toast({
                    title: aiPrompt && !currentConfig?.fields?.length ? "Generated!" : "Enhanced!",
                    description: aiPrompt && !currentConfig?.fields?.length
                        ? "Form has been generated from your description"
                        : "Form has been enhanced with AI suggestions"
                });
                setAiPrompt(""); // Clear the prompt
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to process with AI", variant: "destructive" });
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleCreateForm = async () => {
        // If in advanced mode, parse JSON first
        if (editorMode === "advanced") {
            if (!parseJsonToForm(jsonValue)) {
                toast({ title: "Error", description: "Invalid JSON configuration", variant: "destructive" });
                return;
            }
        }

        if (!newForm.name) {
            toast({ title: "Error", description: "Form name is required", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/forms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newForm.name,
                    description: newForm.description,
                    project_id: newForm.project_id && newForm.project_id !== "__none__" ? newForm.project_id : undefined,
                    visibility: newForm.visibility,
                    fields: newForm.fields.map((f, i) => ({
                        ...f,
                        lead_field_mapping: f.lead_field_mapping === "__none__" ? undefined : f.lead_field_mapping,
                        position: i,
                        is_visible: true,
                    })),
                    require_captcha: newForm.require_captcha,
                    webhook_url: newForm.webhook_url,
                    submission_behavior: newForm.submission_behavior,
                    redirect_url: newForm.redirect_url,
                    success_message: newForm.success_message,
                    notify_emails: newForm.notify_emails,
                    auto_respond: newForm.auto_respond,
                    auto_respond_subject: newForm.auto_respond_subject,
                    auto_respond_body: newForm.auto_respond_body,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.hint || "Failed to create form");
            }

            toast({ title: "Success", description: "Form created successfully" });
            setShowCreateDialog(false);
            setNewForm({
                name: "",
                description: "",
                project_id: "",
                visibility: "PUBLIC",
                require_captcha: false,
                webhook_url: "",
                submission_behavior: "MESSAGE",
                redirect_url: "",
                success_message: "",
                notify_emails: [],
                auto_respond: false,
                auto_respond_subject: "",
                auto_respond_body: "",
                fields: [{ name: "email", label: "Email", field_type: "EMAIL", is_required: true, lead_field_mapping: "email" }],
            });
            setSelectedTemplate("blank");
            setEditorMode("basic");
            setJsonValue("");
            window.location.reload();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to create form", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const showEmbed = (form: Form) => {
        setSelectedForm(form);
        // Load theme from form's custom_css if available
        if (form.custom_css) {
            try {
                const savedTheme = JSON.parse(form.custom_css);
                setFormTheme({ ...DEFAULT_THEME, ...savedTheme });
            } catch {
                setFormTheme({ ...DEFAULT_THEME, primaryColor: form.primary_color || DEFAULT_THEME.primaryColor });
            }
        } else {
            setFormTheme({ ...DEFAULT_THEME, primaryColor: form.primary_color || DEFAULT_THEME.primaryColor });
        }
        setShowEmbedDialog(true);
    };

    const showCustomize = (form: Form) => {
        setSelectedForm(form);

        // Load settings state
        setFormSettings({
            name: form.name,
            description: form.description || "",
            visibility: form.visibility,
            status: form.status,
            submission_behavior: form.submission_behavior || "MESSAGE",
            redirect_url: form.redirect_url || "",
            success_message: form.success_message || "Thank you for your submission!",
            require_captcha: form.require_captcha,
            captcha_site_key: form.captcha_site_key || "",
            captcha_secret_key: form.captcha_secret_key || "",
            notify_emails: form.notify_emails || [],
            webhook_url: form.webhook_url || "",
            auto_respond: form.auto_respond,
            auto_respond_subject: form.auto_respond_subject || "",
            auto_respond_body: form.auto_respond_body || "",
        });

        // Load existing theme
        if (form.custom_css) {
            try {
                const savedTheme = JSON.parse(form.custom_css);
                setFormTheme({ ...DEFAULT_THEME, ...savedTheme });
            } catch {
                setFormTheme({ ...DEFAULT_THEME, primaryColor: form.primary_color || DEFAULT_THEME.primaryColor });
            }
        } else {
            setFormTheme({ ...DEFAULT_THEME, primaryColor: form.primary_color || DEFAULT_THEME.primaryColor });
        }
        setShowCustomizeDialog(true);
    };

    const saveSettings = async () => {
        if (!selectedForm) return;
        setIsSavingTheme(true);
        try {
            const response = await fetch(`/api/forms/${selectedForm.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formSettings,
                    primary_color: formTheme.primaryColor,
                    custom_css: JSON.stringify(formTheme),
                }),
            });
            if (!response.ok) throw new Error("Failed to save settings");

            toast({ title: "Success", description: "Form settings saved successfully" });
            setShowCustomizeDialog(false);

            // Optimistic update or reload
            // window.location.reload(); // Reloading is safest for now
            // But let's try to update local state to avoid full reload flicker if possible
            setForms(prev => prev.map(f => f.id === selectedForm.id ? { ...f, ...formSettings, primary_color: formTheme.primaryColor, custom_css: JSON.stringify(formTheme) } as Form : f));

        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
        } finally {
            setIsSavingTheme(false);
        }
    };

    const resetTheme = () => {
        setFormTheme(DEFAULT_THEME);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Code copied to clipboard" });
    };

    const generateEmbedCode = (form: Form) => {
        return `<!-- ${form.name} Form Embed -->
<iframe 
  src="${baseUrl}/forms/embed/${form.slug}" 
  width="100%" 
  height="500" 
  frameborder="0"
  style="border: none; max-width: 600px;">
</iframe>`;
    };

    const generateJsSnippet = (form: Form, theme: FormTheme = formTheme) => {
        // STRICT: Only use team key
        const siteKey = teamCaptchaConfig?.site_key || "";
        const hasCaptcha = form.require_captcha && siteKey;

        return `<!-- ${form.name} Form Script -->
${hasCaptcha ? `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` : ""}
<div id="form-${form.slug}"></div>
<script>
(function() {
  const formSlug = "${form.slug}";
  const apiEndpoint = "${baseUrl}/api/forms/submit";
  const captchaRequired = ${form.require_captcha ? "true" : "false"};
  
  // Theme configuration
  const theme = {
    primaryColor: "${theme.primaryColor}",
    backgroundColor: "${theme.backgroundColor}",
    textColor: "${theme.textColor}",
    borderColor: "${theme.borderColor}",
    borderRadius: "${theme.borderRadius}",
    fontFamily: "${theme.fontFamily}",
    buttonTextColor: "${theme.buttonTextColor}",
    labelColor: "${theme.labelColor}",
    inputBgColor: "${theme.inputBgColor}"
  };
  
  const container = document.getElementById("form-" + formSlug);
  if (!container) return;
  
  const form = document.createElement("form");
  form.id = "crm-form-" + formSlug;
  form.enctype = "multipart/form-data"; // Enable file uploads
  form.style.cssText = "max-width:500px;font-family:" + theme.fontFamily + ";background:" + theme.backgroundColor + ";padding:24px;border-radius:" + theme.borderRadius + ";";
  
  const fields = ${JSON.stringify(form.fields.filter(f => f.field_type !== "HIDDEN").map(f => ({
            name: f.name,
            label: f.label,
            type: f.field_type.toLowerCase(),
            required: f.is_required,
            placeholder: f.placeholder,
        })))};
  
  fields.forEach(function(field) {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "16px";
    
    // Label
    if (field.type !== "hidden") {
        const label = document.createElement("label");
        label.textContent = field.label + (field.required ? " *" : "");
        label.style.cssText = "display:block;margin-bottom:6px;font-weight:500;color:" + theme.labelColor + ";font-size:14px;";
        wrapper.appendChild(label);
    }
    
    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
    } else if (field.type === "select") {
       input = document.createElement("select");
       // Add options if available (logic omitted for brevity in snippets unless passed)
    } else {
      input = document.createElement("input");
      // Map 'file' type correctly
      input.type = field.type === "file" ? "file" : 
                   field.type === "email" ? "email" : 
                   field.type === "phone" ? "tel" : "text";
    }
    
    input.name = field.name;
    input.required = field.required;
    if (field.placeholder && field.type !== "file") input.placeholder = field.placeholder;
    
    // Styling
    input.style.cssText = "width:100%;padding:10px 12px;border:1px solid " + theme.borderColor + ";border-radius:" + theme.borderRadius + ";font-size:14px;background:" + theme.inputBgColor + ";color:" + theme.textColor + ";box-sizing:border-box;";
    
    // Wrapper append
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });
  
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Submit";
  submit.style.cssText = "background:" + theme.primaryColor + ";color:" + theme.buttonTextColor + ";border:none;padding:12px 28px;border-radius:" + theme.borderRadius + ";cursor:pointer;font-size:14px;font-weight:500;width:100%;margin-top:8px;";
  
  if (captchaRequired) {
    const turnstileWrapper = document.createElement("div");
    turnstileWrapper.className = "cf-turnstile";
    turnstileWrapper.dataset.sitekey = "${siteKey}";
    turnstileWrapper.style.marginBottom = "16px";
    form.appendChild(turnstileWrapper);
  }

  form.appendChild(submit);
  
  // Hover effect
  submit.onmouseover = function() { this.style.opacity = "0.9"; };
  submit.onmouseout = function() { this.style.opacity = "1"; };
  
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    submit.disabled = true;
    submit.textContent = "Submitting...";
    submit.style.opacity = "0.7";
    
    // Use FormData for File Upload Support
    const formData = new FormData(form);
    
    // Append System Fields
    formData.append("form_slug", formSlug);
    formData.append("source_url", window.location.href);
    if (document.referrer) formData.append("referrer", document.referrer);
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("utm_source")) formData.append("utm_source", urlParams.get("utm_source"));
    if (urlParams.has("utm_medium")) formData.append("utm_medium", urlParams.get("utm_medium"));
    if (urlParams.has("utm_campaign")) formData.append("utm_campaign", urlParams.get("utm_campaign"));

    if (captchaRequired) {
        const token = form.querySelector('[name="cf-turnstile-response"]')?.value;
        if (token) formData.append("captcha_token", token);
    }
    
    fetch(apiEndpoint, {
      method: "POST",
      body: formData // Browser sets Content-Type: multipart/form-data with boundary
    })
    .then(function(r) { return r.json(); })
    .then(function(result) {
      if (result.success) {
        form.innerHTML = "<p style='color:" + theme.primaryColor + ";font-weight:500;text-align:center;padding:20px;'>" + (result.message || "Thank you for your submission!") + "</p>";
        if (result.redirect_url) window.location.href = result.redirect_url;
      } else {
        alert(result.error || "Submission failed");
        submit.disabled = false;
        submit.textContent = "Submit";
        submit.style.opacity = "1";
      }
    })
    .catch(function() {
      alert("Submission failed");
      submit.disabled = false;
      submit.textContent = "Submit";
      submit.style.opacity = "1";
    });
  });
  
  container.appendChild(form);
})();
</script>`;
    };

    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-muted-foreground">Total Forms</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                            <p className="text-xs text-muted-foreground">Total Submissions</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <Globe className="h-5 w-5 text-cyan-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.active}</p>
                            <p className="text-xs text-muted-foreground">Active Forms</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar: Search + ViewToggle + Create */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-1 gap-3 items-center w-full sm:w-auto">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search forms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Form
                    </Button>
                </div>
            </div>

            {/* Forms List */}
            {filteredForms.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">
                            {searchQuery ? "No forms match your search" : "No forms yet"}
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            {searchQuery
                                ? "Try adjusting your search terms"
                                : "Create your first form to start capturing leads from your website."
                            }
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Form
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : viewMode === "table" ? (
                /* List / Table View */
                <div className="space-y-3">
                    {filteredForms.map((form) => (
                        <Card
                            key={form.id}
                            className="group hover:shadow-md hover:border-primary/30 transition-all duration-200"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                        onClick={() => toggleFormExpanded(form.id)}
                                    >
                                        {expandedForms.has(form.id) ? (
                                            <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                        )}
                                        <div className="min-w-0">
                                            <CardTitle className="text-base truncate">{form.name}</CardTitle>
                                            {form.description && (
                                                <CardDescription className="truncate">{form.description}</CardDescription>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pl-8 lg:pl-0">
                                        <Badge variant={form.visibility === "PUBLIC" ? "default" : "secondary"} className="text-xs">
                                            {form.visibility === "PUBLIC" ? (
                                                <><Globe className="h-3 w-3 mr-1" /> Public</>
                                            ) : (
                                                <><Lock className="h-3 w-3 mr-1" /> Private</>
                                            )}
                                        </Badge>
                                        <Badge variant={form.status === "ACTIVE" ? "outline" : "secondary"} className="text-xs">
                                            {form.status}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            <BarChart3 className="h-3 w-3 mr-1" />
                                            {form._count.submissions} submissions
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); router.push(`/messages/forms/${form.id}/submissions`); }}
                                                className="h-8 px-2"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                <span className="hidden sm:inline">Submissions</span>
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); showCustomize(form); }} className="h-8 px-2">
                                                <Palette className="h-4 w-4 mr-1" />
                                                <span className="hidden sm:inline">Customize</span>
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); showEmbed(form); }} className="h-8 px-2">
                                                <Code className="h-4 w-4 mr-1" />
                                                <span className="hidden sm:inline">Embed</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmForm(form); }}
                                                className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            {expandedForms.has(form.id) && (
                                <CardContent className="border-t pt-4 bg-muted/30">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Slug:</span>{" "}
                                                <code className="bg-muted px-2 py-0.5 rounded text-xs">{form.slug}</code>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Created: {format(new Date(form.createdAt), "PPpp")}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium mb-2">Fields ({form.fields.length})</p>
                                            <div className="flex flex-wrap gap-1">
                                                {form.fields.slice(0, 5).map((field) => (
                                                    <Badge key={field.id} variant="outline" className="text-xs">
                                                        {field.label}
                                                        {field.is_required && <span className="text-destructive ml-1">*</span>}
                                                    </Badge>
                                                ))}
                                                {form.fields.length > 5 && (
                                                    <Badge variant="outline" className="text-xs">+{form.fields.length - 5} more</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            ) : viewMode === "compact" ? (
                /* Compact Grid View */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredForms.map((form) => (
                        <Card
                            key={form.id}
                            className="group cursor-pointer hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
                            onClick={() => toggleFormExpanded(form.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <Badge
                                        variant={form.visibility === "PUBLIC" ? "default" : "secondary"}
                                        className="text-[10px] px-1.5"
                                    >
                                        {form.visibility === "PUBLIC" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/messages/forms/${form.id}/submissions`)}>
                                                <ExternalLink className="h-4 w-4 mr-2" /> View Submissions
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => showCustomize(form)}>
                                                <Palette className="h-4 w-4 mr-2" /> Customize
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => showEmbed(form)}>
                                                <Code className="h-4 w-4 mr-2" /> Get Code
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setDeleteConfirmForm(form)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <h3 className="font-semibold text-sm truncate mb-1">{form.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <BarChart3 className="h-3 w-3" />
                                        {form._count.submissions}
                                    </span>
                                    <span>•</span>
                                    <span>{form.fields.length} fields</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                /* Card Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredForms.map((form) => (
                        <Card
                            key={form.id}
                            className="group hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg truncate">{form.name}</CardTitle>
                                        {form.description && (
                                            <CardDescription className="line-clamp-2 mt-1">{form.description}</CardDescription>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/messages/forms/${form.id}/submissions`)}>
                                                <ExternalLink className="h-4 w-4 mr-2" /> View Submissions
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => showCustomize(form)}>
                                                <Palette className="h-4 w-4 mr-2" /> Customize
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => showEmbed(form)}>
                                                <Code className="h-4 w-4 mr-2" /> Get Code
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setDeleteConfirmForm(form)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant={form.visibility === "PUBLIC" ? "default" : "secondary"}>
                                        {form.visibility === "PUBLIC" ? (
                                            <><Globe className="h-3 w-3 mr-1" /> Public</>
                                        ) : (
                                            <><Lock className="h-3 w-3 mr-1" /> Private</>
                                        )}
                                    </Badge>
                                    <Badge variant={form.status === "ACTIVE" ? "outline" : "secondary"}>
                                        {form.status}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold">{form._count.submissions}</p>
                                        <p className="text-xs text-muted-foreground">Submissions</p>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold">{form.fields.length}</p>
                                        <p className="text-xs text-muted-foreground">Fields</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => router.push(`/messages/forms/${form.id}/submissions`)}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Submissions
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => showEmbed(form)}
                                    >
                                        <Code className="h-4 w-4 mr-1" />
                                        Embed
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteConfirmForm} onOpenChange={(open) => !open && setDeleteConfirmForm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Form</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deleteConfirmForm?.name}&quot;? This action cannot be undone.
                            All {deleteConfirmForm?._count?.submissions || 0} submissions will also be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteForm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
                            ) : (
                                <><Trash2 className="h-4 w-4 mr-2" /> Delete</>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Create Form Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Create New Form</DialogTitle>
                        <DialogDescription>
                            Build a lead capture form for your website
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                        {/* Template Selection */}
                        <div className="space-y-3">
                            <Label>Choose a Template</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(FORM_TEMPLATES).map(([key, template]) => (
                                    <div
                                        key={key}
                                        className={`
                                            cursor-pointer rounded-lg border p-4 hover:bg-muted/50 transition-all
                                            ${selectedTemplate === key ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border'}
                                        `}
                                        onClick={() => {
                                            setSelectedTemplate(key);
                                            // Auto-fill description if empty or default
                                            if (!newForm.description || Object.values(FORM_TEMPLATES).some(t => t.description === newForm.description)) {
                                                setNewForm(prev => ({ ...prev, description: template.description }));
                                            }
                                            // Update fields based on template
                                            setNewForm(prev => ({
                                                ...prev,
                                                fields: template.fields.map(f => ({ ...f, position: 0 })) // Position will be fixed on submit
                                            }));
                                        }}
                                    >
                                        <div className="font-medium text-sm mb-1">{template.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-2">{template.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={editorMode === "basic" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => editorMode === "advanced" ? switchToBasic() : null}
                                >
                                    <Settings className="h-4 w-4 mr-1" />
                                    Basic
                                </Button>
                                <Button
                                    variant={editorMode === "advanced" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => editorMode === "basic" ? switchToAdvanced() : null}
                                >
                                    <Braces className="h-4 w-4 mr-1" />
                                    Advanced (JSON)
                                </Button>
                            </div>
                        </div>

                        {/* AI Prompt Input */}
                        <div className="p-4 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium">Generate or Enhance with AI</Label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Describe the form you want to create, or leave empty to enhance the current form
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            placeholder="e.g., Contact form for a dental clinic, Real estate inquiry form, Newsletter signup..."
                                            className="flex-1"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !isEnhancing) {
                                                    enhanceWithAI();
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={enhanceWithAI}
                                            disabled={isEnhancing}
                                            className="gap-2"
                                        >
                                            {isEnhancing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Sparkles className="h-4 w-4" />
                                            )}
                                            {aiPrompt && newForm.fields.length <= 1 ? "Generate" : "Enhance"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        {editorMode === "advanced" ? (
                            /* Advanced JSON Editor */
                            <div className="space-y-4">
                                <div className="p-3 bg-muted/50 rounded-lg border">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Edit the form configuration directly as JSON. Changes will be validated in real-time.
                                    </p>
                                    {jsonError && (
                                        <p className="text-sm text-destructive">
                                            JSON Error: {jsonError}
                                        </p>
                                    )}
                                </div>
                                <Textarea
                                    value={jsonValue}
                                    onChange={(e) => handleJsonChange(e.target.value)}
                                    className="font-mono text-sm min-h-[400px]"
                                    placeholder="Form JSON configuration..."
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            try {
                                                setJsonValue(JSON.stringify(JSON.parse(jsonValue), null, 2));
                                            } catch (e) { }
                                        }}
                                    >
                                        Format JSON
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(jsonValue)}
                                    >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* Basic Editor */
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Form Name *</Label>
                                        <Input
                                            value={newForm.name}
                                            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                                            placeholder="Contact Form"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Project (Optional)</Label>
                                        <Select
                                            value={newForm.project_id}
                                            onValueChange={(v) => setNewForm({ ...newForm, project_id: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">No project</SelectItem>
                                                {projects.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={newForm.description}
                                        onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                                        placeholder="Optional description"
                                    />
                                </div>



                                {/* Notifications & Auto-Reply Settings */}
                                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Users className="h-5 w-5 text-blue-500" />
                                        <Label className="text-base">Notifications & Auto-Reply</Label>
                                    </div>

                                    <div className="grid gap-4 pl-8">
                                        <div className="grid gap-2">
                                            <Label className="text-sm">Team Notification Emails</Label>
                                            <p className="text-xs text-muted-foreground">Comma-separated list of emails to notify when a submission is received (in addition to you).</p>
                                            <Input
                                                value={newForm.notify_emails ? newForm.notify_emails.join(", ") : ""}
                                                onChange={(e) => setNewForm({ ...newForm, notify_emails: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                                                placeholder="colleague@example.com, sales@example.com"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm">Send Auto-Reply to Lead</Label>
                                                <p className="text-xs text-muted-foreground">Send a confirmation email to the person who submitted the form.</p>
                                            </div>
                                            <Switch
                                                checked={newForm.auto_respond}
                                                onCheckedChange={(v) => setNewForm({ ...newForm, auto_respond: v })}
                                            />
                                        </div>

                                        {newForm.auto_respond && (
                                            <div className="space-y-3 pt-2 border-l-2 pl-3 ml-1 border-blue-500/20">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Email Subject</Label>
                                                    <Input
                                                        value={newForm.auto_respond_subject || ""}
                                                        onChange={(e) => setNewForm({ ...newForm, auto_respond_subject: e.target.value })}
                                                        placeholder="We received your message"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <Label className="text-xs">Email Body</Label>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    toast({ title: "AI Feature", description: "Enhance email capability coming soon." });
                                                                }}
                                                            >
                                                                <Sparkles className="h-3 w-3 mr-1" />
                                                                AI Enhance
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    toast({ title: "AI Feature", description: "Write with AI capability coming soon." });
                                                                }}
                                                            >
                                                                <PenLine className="h-3 w-3 mr-1" />
                                                                Write with AI
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <Textarea
                                                        value={newForm.auto_respond_body || ""}
                                                        onChange={(e) => setNewForm({ ...newForm, auto_respond_body: e.target.value })}
                                                        placeholder="Thank you for contacting us..."
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Visibility Toggle */}
                                <div className="p-4 border rounded-lg bg-muted/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {newForm.visibility === "PUBLIC" ? (
                                                <Globe className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <Lock className="h-5 w-5 text-orange-500" />
                                            )}
                                            <div>
                                                <Label className="text-base">Form Visibility</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    {newForm.visibility === "PUBLIC"
                                                        ? "All team members can see submissions from this form"
                                                        : "Only you can see submissions from this form"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant={newForm.visibility === "PUBLIC" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setNewForm({ ...newForm, visibility: "PUBLIC" })}
                                            >
                                                <Globe className="h-4 w-4 mr-1" />
                                                Public
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={newForm.visibility === "PRIVATE" ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setNewForm({ ...newForm, visibility: "PRIVATE" })}
                                            >
                                                <Lock className="h-4 w-4 mr-1" />
                                                Private
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Turnstile Captcha Settings */}
                                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Shield className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <Label className="text-base">Spam Protection (Turnstile)</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Protect your form from bots using Cloudflare Turnstile
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={newForm.require_captcha}
                                            onCheckedChange={(v) => setNewForm({ ...newForm, require_captcha: v })}
                                        />
                                    </div>

                                    {/* Team Keys Info / Config Link */}
                                    {newForm.require_captcha && (
                                        <div className={`flex items-center gap-2 text-xs p-3 rounded mb-2 border ${teamCaptchaConfig ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                            }`}>
                                            <Shield className="h-4 w-4 shrink-0" />
                                            <span>
                                                {teamCaptchaConfig
                                                    ? "Active: Using centralized team keys."
                                                    : "Warning: No team keys configured. Captcha will not work."}
                                            </span>
                                            <a href="/admin/captcha-config" target="_blank" className="underline hover:opacity-80 ml-auto font-medium">
                                                {teamCaptchaConfig ? "Manage Keys" : "Configure Now"}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Integrations / Webhook */}
                                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-purple-500/10 p-1 rounded">
                                            <ExternalLink className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <Label className="text-base">Integrations (Webhook)</Label>
                                    </div>
                                    <div className="grid gap-2 pl-8">
                                        <Label className="text-sm">Webhook URL</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Send submission data to an external URL (e.g., Zapier, Make, Slack).
                                        </p>
                                        <Input
                                            value={newForm.webhook_url || ""}
                                            onChange={(e) => setNewForm({ ...newForm, webhook_url: e.target.value })}
                                            placeholder="https://hooks.zapier.com/..."
                                        />
                                    </div>
                                </div>

                                {/* Submission Behavior */}
                                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ChevronRight className="h-5 w-5 text-gray-500" />
                                        <Label className="text-base">Submission Behavior</Label>
                                    </div>
                                    <div className="grid gap-4 pl-8">
                                        <div className="space-y-2">
                                            <Label className="text-sm">After Submission</Label>
                                            <div className="flex gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        id="behavior-message"
                                                        name="submission_behavior"
                                                        className="h-4 w-4 text-primary"
                                                        checked={newForm.submission_behavior === "MESSAGE"}
                                                        onChange={() => setNewForm({ ...newForm, submission_behavior: "MESSAGE" })}
                                                    />
                                                    <Label htmlFor="behavior-message" className="font-normal cursor-pointer">Show Message</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="radio"
                                                        id="behavior-redirect"
                                                        name="submission_behavior"
                                                        className="h-4 w-4 text-primary"
                                                        checked={newForm.submission_behavior === "REDIRECT"}
                                                        onChange={() => setNewForm({ ...newForm, submission_behavior: "REDIRECT" })}
                                                    />
                                                    <Label htmlFor="behavior-redirect" className="font-normal cursor-pointer">Redirect to URL</Label>
                                                </div>
                                            </div>
                                        </div>

                                        {newForm.submission_behavior === "REDIRECT" && (
                                            <div className="space-y-2">
                                                <Label className="text-sm">Redirect URL</Label>
                                                <Input
                                                    value={newForm.redirect_url || ""}
                                                    onChange={(e) => setNewForm({ ...newForm, redirect_url: e.target.value })}
                                                    placeholder="https://example.com/thank-you"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base">Form Fields</Label>
                                        <Button variant="outline" size="sm" onClick={addField}>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Field
                                        </Button>
                                    </div>

                                    {newForm.fields.map((field, index) => (
                                        <Card key={index} className="p-4">
                                            <div className="flex items-start gap-3">
                                                <GripVertical className="h-5 w-5 mt-2 text-muted-foreground" />
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-xs">Label</Label>
                                                        <Input
                                                            value={field.label || ""}
                                                            onChange={(e) => updateField(index, {
                                                                label: e.target.value,
                                                                name: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                                                            })}
                                                            placeholder="Field label"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Type</Label>
                                                        <Select
                                                            value={field.field_type}
                                                            onValueChange={(v) => updateField(index, { field_type: v })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {FIELD_TYPES.map((t) => (
                                                                    <SelectItem key={t.value} value={t.value}>
                                                                        {t.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Placeholder</Label>
                                                        <Input
                                                            value={field.placeholder || ""}
                                                            onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                                            placeholder="Placeholder text"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Lead Field Mapping</Label>
                                                        <Select
                                                            value={field.lead_field_mapping || "__none__"}
                                                            onValueChange={(v) => updateField(index, { lead_field_mapping: v })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {LEAD_FIELD_MAPPINGS.map((m) => (
                                                                    <SelectItem key={m.value} value={m.value}>
                                                                        {m.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="col-span-2 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={field.is_required || false}
                                                                onCheckedChange={(v) => updateField(index, { is_required: v })}
                                                            />
                                                            <Label className="text-xs">Required</Label>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeField(index)}
                                                            disabled={newForm.fields.length === 1}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateForm} disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Form"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Form Settings Dialog */}
            <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Form Settings: {selectedForm?.name}</DialogTitle>
                        <DialogDescription>
                            Configure behavior, appearance, and integrations
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex">
                        <Tabs defaultValue="general" orientation="vertical" className="flex w-full h-full" value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
                            <div className="w-48 border-r bg-muted/20 py-4 flex-shrink-0">
                                <TabsList className="flex flex-col h-auto bg-transparent space-y-1 px-2 mb-4">
                                    <TabsTrigger value="general" className="w-full justify-start px-3 py-2">General</TabsTrigger>
                                    <TabsTrigger value="theme" className="w-full justify-start px-3 py-2">Theme</TabsTrigger>
                                    <TabsTrigger value="submission" className="w-full justify-start px-3 py-2">Submission</TabsTrigger>
                                    <TabsTrigger value="notifications" className="w-full justify-start px-3 py-2">Notifications</TabsTrigger>
                                    <TabsTrigger value="integrations" className="w-full justify-start px-3 py-2">Integrations</TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <TabsContent value="general" className="space-y-6 mt-0">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Form Name</Label>
                                            <Input
                                                value={formSettings.name || ""}
                                                onChange={e => setFormSettings({ ...formSettings, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={formSettings.description || ""}
                                                onChange={e => setFormSettings({ ...formSettings, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Visibility</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={formSettings.visibility === "PUBLIC" ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setFormSettings({ ...formSettings, visibility: "PUBLIC" })}
                                                >
                                                    <Globe className="h-4 w-4 mr-1" /> Public
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={formSettings.visibility === "PRIVATE" ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setFormSettings({ ...formSettings, visibility: "PRIVATE" })}
                                                >
                                                    <Lock className="h-4 w-4 mr-1" /> Private
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="theme" className="space-y-6 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            {/* Existing Theme Controls */}
                                            <div className="space-y-4">
                                                <h3 className="font-medium text-sm">Colors</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Primary Color</Label>
                                                        <div className="flex gap-2">
                                                            <Input type="color" value={formTheme.primaryColor} onChange={(e) => setFormTheme({ ...formTheme, primaryColor: e.target.value })} className="w-12 h-9 p-1 cursor-pointer" />
                                                            <Input value={formTheme.primaryColor} onChange={(e) => setFormTheme({ ...formTheme, primaryColor: e.target.value })} className="flex-1" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Background</Label>
                                                        <div className="flex gap-2">
                                                            <Input type="color" value={formTheme.backgroundColor} onChange={(e) => setFormTheme({ ...formTheme, backgroundColor: e.target.value })} className="w-12 h-9 p-1 cursor-pointer" />
                                                            <Input value={formTheme.backgroundColor} onChange={(e) => setFormTheme({ ...formTheme, backgroundColor: e.target.value })} className="flex-1" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Text</Label>
                                                        <div className="flex gap-2">
                                                            <Input type="color" value={formTheme.textColor} onChange={(e) => setFormTheme({ ...formTheme, textColor: e.target.value })} className="w-12 h-9 p-1 cursor-pointer" />
                                                            <Input value={formTheme.textColor} onChange={(e) => setFormTheme({ ...formTheme, textColor: e.target.value })} className="flex-1" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Inputs</Label>
                                                        <div className="flex gap-2">
                                                            <Input type="color" value={formTheme.inputBgColor} onChange={(e) => setFormTheme({ ...formTheme, inputBgColor: e.target.value })} className="w-12 h-9 p-1 cursor-pointer" />
                                                            <Input value={formTheme.inputBgColor} onChange={(e) => setFormTheme({ ...formTheme, inputBgColor: e.target.value })} className="flex-1" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="font-medium text-sm">Typography & Style</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Font Family</Label>
                                                        <Select value={formTheme.fontFamily} onValueChange={(v) => setFormTheme({ ...formTheme, fontFamily: v })}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="system-ui, -apple-system, sans-serif">System Default</SelectItem>
                                                                <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                                                                <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                                                                <SelectItem value="monospace">Monospace</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Radius</Label>
                                                        <Select value={formTheme.borderRadius} onValueChange={(v) => setFormTheme({ ...formTheme, borderRadius: v })}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="0px">None</SelectItem>
                                                                <SelectItem value="4px">Small</SelectItem>
                                                                <SelectItem value="8px">Medium</SelectItem>
                                                                <SelectItem value="12px">Large</SelectItem>
                                                                <SelectItem value="999px">Pill</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button variant="outline" size="sm" onClick={resetTheme}>
                                                <RefreshCw className="h-4 w-4 mr-1" /> Reset Theme
                                            </Button>
                                        </div>

                                        {/* Preview Panel */}
                                        <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-900 overflow-hidden">
                                            <div style={{
                                                fontFamily: formTheme.fontFamily,
                                                backgroundColor: formTheme.backgroundColor,
                                                padding: "24px",
                                                borderRadius: formTheme.borderRadius,
                                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                                            }}>
                                                <h4 style={{ color: formTheme.textColor, marginBottom: "16px", fontWeight: "bold" }}>Preview</h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", color: formTheme.labelColor }}>Email *</label>
                                                        <input style={{
                                                            width: "100%", padding: "8px 12px",
                                                            borderRadius: formTheme.borderRadius,
                                                            border: `1px solid ${formTheme.borderColor}`,
                                                            backgroundColor: formTheme.inputBgColor,
                                                            color: formTheme.textColor
                                                        }} placeholder="example@email.com" disabled />
                                                    </div>
                                                    <button style={{
                                                        width: "100%", padding: "10px",
                                                        borderRadius: formTheme.borderRadius,
                                                        backgroundColor: formTheme.primaryColor,
                                                        color: formTheme.buttonTextColor,
                                                        border: "none", fontWeight: 500
                                                    }}>Submit</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="submission" className="space-y-6 mt-0">
                                    <div className="space-y-6">
                                        <div className="border p-4 rounded-lg space-y-4">
                                            <Label className="text-base">What happens after submission?</Label>
                                            <div className="grid gap-4 mt-2">
                                                <div className="flex items-start space-x-3 p-3 bg-muted/40 rounded-lg cursor-pointer hover:bg-muted/60" onClick={() => setFormSettings({ ...formSettings, submission_behavior: "MESSAGE" })}>
                                                    <input type="radio" checked={formSettings.submission_behavior === "MESSAGE"} onChange={() => { }} className="mt-1" />
                                                    <div>
                                                        <p className="font-medium">Show a success message</p>
                                                        <p className="text-sm text-muted-foreground">Keep the user on the same page and show a thank you message.</p>
                                                        {formSettings.submission_behavior === "MESSAGE" && (
                                                            <Input
                                                                className="mt-2"
                                                                value={formSettings.success_message || ""}
                                                                onChange={(e) => setFormSettings({ ...formSettings, success_message: e.target.value })}
                                                                placeholder="Thank you for your submission!"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-3 p-3 bg-muted/40 rounded-lg cursor-pointer hover:bg-muted/60" onClick={() => setFormSettings({ ...formSettings, submission_behavior: "REDIRECT" })}>
                                                    <input type="radio" checked={formSettings.submission_behavior === "REDIRECT"} onChange={() => { }} className="mt-1" />
                                                    <div>
                                                        <p className="font-medium">Redirect to a URL</p>
                                                        <p className="text-sm text-muted-foreground">Send the user to a specific page (e.g., thank you page, calendar).</p>
                                                        {formSettings.submission_behavior === "REDIRECT" && (
                                                            <Input
                                                                className="mt-2"
                                                                value={formSettings.redirect_url || ""}
                                                                onChange={(e) => setFormSettings({ ...formSettings, redirect_url: e.target.value })}
                                                                placeholder="https://example.com/thank-you"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border p-4 rounded-lg flex items-center justify-between">
                                            <div>
                                                <Label className="text-base">Spam Protection</Label>
                                                <p className="text-sm text-muted-foreground">Require Turnstile captcha verification</p>
                                            </div>
                                            <Switch
                                                checked={formSettings.require_captcha || false}
                                                onCheckedChange={(c) => setFormSettings({ ...formSettings, require_captcha: c })}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="notifications" className="space-y-6 mt-0">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Team Notification Emails</Label>
                                            <Input
                                                value={formSettings.notify_emails?.join(", ") || ""}
                                                onChange={(e) => setFormSettings({ ...formSettings, notify_emails: e.target.value.split(",").map(s => s.trim()) })}
                                                placeholder="colleague@example.com, sales@example.com"
                                            />
                                            <p className="text-xs text-muted-foreground">Comma-separated.</p>
                                        </div>

                                        <div className="border-t pt-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label>Auto-Responder</Label>
                                                    <p className="text-sm text-muted-foreground">Send an email to the lead upon submission</p>
                                                </div>
                                                <Switch
                                                    checked={formSettings.auto_respond || false}
                                                    onCheckedChange={(c) => setFormSettings({ ...formSettings, auto_respond: c })}
                                                />
                                            </div>

                                            {formSettings.auto_respond && (
                                                <div className="pl-4 border-l-2 space-y-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Subject</Label>
                                                        <Input
                                                            value={formSettings.auto_respond_subject || ""}
                                                            onChange={(e) => setFormSettings({ ...formSettings, auto_respond_subject: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Message</Label>
                                                        <Textarea
                                                            rows={4}
                                                            value={formSettings.auto_respond_body || ""}
                                                            onChange={(e) => setFormSettings({ ...formSettings, auto_respond_body: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="integrations" className="space-y-6 mt-0">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Webhook URL</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={formSettings.webhook_url || ""}
                                                    onChange={(e) => setFormSettings({ ...formSettings, webhook_url: e.target.value })}
                                                    placeholder="https://hooks.zapier.com/..."
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                We'll send a POST request with the submission data to this URL.
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => setShowCustomizeDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveSettings} disabled={isSavingTheme}>
                            {isSavingTheme ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Embed Code Dialog */}
            < Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog} >
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Embed Form: {selectedForm?.name}</DialogTitle>
                        <DialogDescription>
                            Copy the code below to add this form to your website
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="iframe" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
                            <TabsTrigger value="js">JavaScript Snippet</TabsTrigger>
                        </TabsList>
                        <TabsContent value="iframe" className="space-y-4 mt-4">
                            <p className="text-sm text-muted-foreground">
                                Simple embed - paste this into your HTML where you want the form to appear.
                            </p>
                            <div className="relative">
                                <ScrollArea className="h-[300px] rounded-lg border bg-muted">
                                    <pre className="p-4 text-sm whitespace-pre-wrap break-all">
                                        <code>{selectedForm && generateEmbedCode(selectedForm)}</code>
                                    </pre>
                                </ScrollArea>
                                <Button
                                    className="absolute top-2 right-4 z-10"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => selectedForm && copyToClipboard(generateEmbedCode(selectedForm))}
                                >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy
                                </Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="js" className="space-y-4 mt-4">
                            <p className="text-sm text-muted-foreground">
                                Advanced embed - creates a native form with custom styling on your page.
                            </p>
                            <div className="relative">
                                <ScrollArea className="h-[400px] rounded-lg border bg-muted">
                                    <pre className="p-4 text-sm whitespace-pre-wrap break-all">
                                        <code>{selectedForm && generateJsSnippet(selectedForm)}</code>
                                    </pre>
                                </ScrollArea>
                                <Button
                                    className="absolute top-2 right-4 z-10"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => selectedForm && copyToClipboard(generateJsSnippet(selectedForm))}
                                >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog >
        </div >
    );
}
