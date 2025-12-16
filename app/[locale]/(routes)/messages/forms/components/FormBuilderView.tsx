"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Plus, Copy, Code, Eye, Trash2, Settings, ChevronDown, ChevronRight,
    GripVertical, FileText, Lock, Globe, Users, Sparkles, Braces, Loader2,
    Palette, RefreshCw
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
];

const LEAD_FIELD_MAPPINGS = [
    { value: "__none__", label: "No mapping" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "firstName", label: "First Name" },
    { value: "lastName", label: "Last Name" },
    { value: "name", label: "Full Name" },
    { value: "company", label: "Company" },
    { value: "website", label: "Website" },
    { value: "address", label: "Address" },
    { value: "city", label: "City" },
    { value: "state", label: "State" },
    { value: "zip", label: "ZIP Code" },
    { value: "country", label: "Country" },
];

export function FormBuilderView({ forms, projects, baseUrl, currentUserId }: FormBuilderViewProps) {
    const { toast } = useToast();
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEmbedDialog, setShowEmbedDialog] = useState(false);
    const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
    const [selectedForm, setSelectedForm] = useState<Form | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingTheme, setIsSavingTheme] = useState(false);
    const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set());

    // Theme customization state
    const [formTheme, setFormTheme] = useState<FormTheme>(DEFAULT_THEME);

    const [newForm, setNewForm] = useState({
        name: "",
        description: "",
        project_id: "",
        visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
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
                fields: [{ name: "email", label: "Email", field_type: "EMAIL", is_required: true, lead_field_mapping: "email" }],
            });
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

    const saveTheme = async () => {
        if (!selectedForm) return;
        setIsSavingTheme(true);
        try {
            const response = await fetch(`/api/forms/${selectedForm.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    primary_color: formTheme.primaryColor,
                    custom_css: JSON.stringify(formTheme),
                }),
            });
            if (!response.ok) throw new Error("Failed to save theme");
            toast({ title: "Success", description: "Theme saved successfully" });
            setShowCustomizeDialog(false);
            window.location.reload();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save theme", variant: "destructive" });
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
        return `<!-- ${form.name} Form Script -->
<div id="form-${form.slug}"></div>
<script>
(function() {
  const formSlug = "${form.slug}";
  const apiEndpoint = "${baseUrl}/api/forms/submit";
  
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
    
    const label = document.createElement("label");
    label.textContent = field.label + (field.required ? " *" : "");
    label.style.cssText = "display:block;margin-bottom:6px;font-weight:500;color:" + theme.labelColor + ";font-size:14px;";
    wrapper.appendChild(label);
    
    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
    } else {
      input = document.createElement("input");
      input.type = field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text";
    }
    input.name = field.name;
    input.required = field.required;
    input.placeholder = field.placeholder || "";
    input.style.cssText = "width:100%;padding:10px 12px;border:1px solid " + theme.borderColor + ";border-radius:" + theme.borderRadius + ";font-size:14px;background:" + theme.inputBgColor + ";color:" + theme.textColor + ";box-sizing:border-box;";
    wrapper.appendChild(input);
    
    form.appendChild(wrapper);
  });
  
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Submit";
  submit.style.cssText = "background:" + theme.primaryColor + ";color:" + theme.buttonTextColor + ";border:none;padding:12px 28px;border-radius:" + theme.borderRadius + ";cursor:pointer;font-size:14px;font-weight:500;width:100%;margin-top:8px;";
  form.appendChild(submit);
  
  // Hover effect
  submit.onmouseover = function() { this.style.opacity = "0.9"; };
  submit.onmouseout = function() { this.style.opacity = "1"; };
  
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    submit.disabled = true;
    submit.textContent = "Submitting...";
    submit.style.opacity = "0.7";
    
    const data = {};
    new FormData(form).forEach(function(v, k) { data[k] = v; });
    
    fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form_slug: formSlug,
        data: data,
        source_url: window.location.href,
        referrer: document.referrer
      })
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-muted-foreground">
                        {forms.length} form{forms.length !== 1 ? "s" : ""} created
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Form
                </Button>
            </div>

            {/* Forms List */}
            <div className="space-y-4">
                {forms.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-semibold mb-2">No forms yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first form to start capturing leads from your website.
                            </p>
                            <Button onClick={() => setShowCreateDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Form
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    forms.map((form) => (
                        <Card key={form.id}>
                            <CardHeader
                                className="cursor-pointer"
                                onClick={() => toggleFormExpanded(form.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {expandedForms.has(form.id) ? (
                                            <ChevronDown className="h-5 w-5" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5" />
                                        )}
                                        <div>
                                            <CardTitle className="text-lg">{form.name}</CardTitle>
                                            {form.description && (
                                                <CardDescription>{form.description}</CardDescription>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
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
                                        <Badge variant="outline">
                                            {form._count.submissions} submissions
                                        </Badge>
                                        <Button variant="outline" size="sm" onClick={() => showCustomize(form)}>
                                            <Palette className="h-4 w-4 mr-1" />
                                            Customize
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => showEmbed(form)}>
                                            <Code className="h-4 w-4 mr-1" />
                                            Get Code
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            {expandedForms.has(form.id) && (
                                <CardContent className="border-t pt-4">
                                    <div className="space-y-4">
                                        <div className="text-sm text-muted-foreground">
                                            <strong>Slug:</strong> {form.slug}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            <strong>Created:</strong> {format(new Date(form.createdAt), "PPpp")}
                                        </div>
                                        <div>
                                            <strong className="text-sm">Fields ({form.fields.length}):</strong>
                                            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {form.fields.map((field) => (
                                                    <div
                                                        key={field.id}
                                                        className="border rounded p-2 text-sm"
                                                    >
                                                        <div className="font-medium">{field.label}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {field.field_type}
                                                            {field.is_required && " • Required"}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* Create Form Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Create New Form</DialogTitle>
                        <DialogDescription>
                            Build a lead capture form for your website
                        </DialogDescription>
                    </DialogHeader>

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
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
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

                    <ScrollArea className="max-h-[60vh] pr-4">
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
                    </ScrollArea>
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

            {/* Customize Theme Dialog */}
            <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Customize Form: {selectedForm?.name}</DialogTitle>
                        <DialogDescription>
                            Customize the appearance of your embedded form
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left side - Theme controls */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm">Colors</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Primary / Button Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={formTheme.primaryColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, primaryColor: e.target.value })}
                                                className="w-12 h-9 p-1 cursor-pointer"
                                            />
                                            <Input
                                                value={formTheme.primaryColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, primaryColor: e.target.value })}
                                                placeholder="#F54029"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Background Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={formTheme.backgroundColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, backgroundColor: e.target.value })}
                                                className="w-12 h-9 p-1 cursor-pointer"
                                            />
                                            <Input
                                                value={formTheme.backgroundColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, backgroundColor: e.target.value })}
                                                placeholder="#ffffff"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Text Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={formTheme.textColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, textColor: e.target.value })}
                                                className="w-12 h-9 p-1 cursor-pointer"
                                            />
                                            <Input
                                                value={formTheme.textColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, textColor: e.target.value })}
                                                placeholder="#333333"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Label Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={formTheme.labelColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, labelColor: e.target.value })}
                                                className="w-12 h-9 p-1 cursor-pointer"
                                            />
                                            <Input
                                                value={formTheme.labelColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, labelColor: e.target.value })}
                                                placeholder="#374151"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Border Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={formTheme.borderColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, borderColor: e.target.value })}
                                                className="w-12 h-9 p-1 cursor-pointer"
                                            />
                                            <Input
                                                value={formTheme.borderColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, borderColor: e.target.value })}
                                                placeholder="#cccccc"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Input Background</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={formTheme.inputBgColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, inputBgColor: e.target.value })}
                                                className="w-12 h-9 p-1 cursor-pointer"
                                            />
                                            <Input
                                                value={formTheme.inputBgColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, inputBgColor: e.target.value })}
                                                placeholder="#ffffff"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Button Text Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={formTheme.buttonTextColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, buttonTextColor: e.target.value })}
                                                className="w-12 h-9 p-1 cursor-pointer"
                                            />
                                            <Input
                                                value={formTheme.buttonTextColor}
                                                onChange={(e) => setFormTheme({ ...formTheme, buttonTextColor: e.target.value })}
                                                placeholder="#ffffff"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-medium text-sm">Style</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Border Radius</Label>
                                        <Select
                                            value={formTheme.borderRadius}
                                            onValueChange={(v) => setFormTheme({ ...formTheme, borderRadius: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0px">None (Square)</SelectItem>
                                                <SelectItem value="4px">Small (4px)</SelectItem>
                                                <SelectItem value="8px">Medium (8px)</SelectItem>
                                                <SelectItem value="12px">Large (12px)</SelectItem>
                                                <SelectItem value="16px">Extra Large (16px)</SelectItem>
                                                <SelectItem value="9999px">Pill (Full)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Font Family</Label>
                                        <Select
                                            value={formTheme.fontFamily}
                                            onValueChange={(v) => setFormTheme({ ...formTheme, fontFamily: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="system-ui, -apple-system, sans-serif">System Default</SelectItem>
                                                <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                                                <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                                                <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                                                <SelectItem value="Georgia, serif">Georgia</SelectItem>
                                                <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                                                <SelectItem value="monospace">Monospace</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={resetTheme}>
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Reset to Default
                                </Button>
                            </div>
                        </div>

                        {/* Right side - Preview */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm">Preview</h3>
                            <div
                                className="border rounded-lg p-6 min-h-[400px]"
                                style={{ backgroundColor: "#f5f5f5" }}
                            >
                                <div
                                    style={{
                                        maxWidth: "100%",
                                        fontFamily: formTheme.fontFamily,
                                        backgroundColor: formTheme.backgroundColor,
                                        padding: "24px",
                                        borderRadius: formTheme.borderRadius,
                                    }}
                                >
                                    {selectedForm?.fields.slice(0, 3).map((field, i) => (
                                        <div key={i} style={{ marginBottom: "16px" }}>
                                            <label
                                                style={{
                                                    display: "block",
                                                    marginBottom: "6px",
                                                    fontWeight: 500,
                                                    color: formTheme.labelColor,
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {field.label}{field.is_required ? " *" : ""}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                                disabled
                                                style={{
                                                    width: "100%",
                                                    padding: "10px 12px",
                                                    border: `1px solid ${formTheme.borderColor}`,
                                                    borderRadius: formTheme.borderRadius,
                                                    fontSize: "14px",
                                                    backgroundColor: formTheme.inputBgColor,
                                                    color: formTheme.textColor,
                                                    boxSizing: "border-box",
                                                }}
                                            />
                                        </div>
                                    ))}
                                    {(selectedForm?.fields.length || 0) > 3 && (
                                        <p style={{ color: formTheme.textColor, fontSize: "12px", marginBottom: "16px", opacity: 0.7 }}>
                                            ...and {(selectedForm?.fields.length || 0) - 3} more fields
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        style={{
                                            backgroundColor: formTheme.primaryColor,
                                            color: formTheme.buttonTextColor,
                                            border: "none",
                                            padding: "12px 28px",
                                            borderRadius: formTheme.borderRadius,
                                            cursor: "pointer",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            width: "100%",
                                            marginTop: "8px",
                                        }}
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCustomizeDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveTheme} disabled={isSavingTheme}>
                            {isSavingTheme ? "Saving..." : "Save Theme"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Embed Code Dialog */}
            <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
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
            </Dialog>
        </div>
    );
}
