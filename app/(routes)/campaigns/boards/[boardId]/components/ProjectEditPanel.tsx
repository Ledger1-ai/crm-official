"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BrandEditor from "./BrandEditor";
import UploadFileModal from "@/components/modals/upload-file-modal";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Settings, Palette, LayoutTemplate, FileText, Plus, Trash2, Upload, Link as LinkIcon, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Button builder item type used for default preset UI
type ButtonItem = {
  id: string;
  label: string;
  href: string;
  type?: 'primary' | 'secondary';
  iconUrl?: string;
  iconType?: 'upload' | 'lucide';
  enabled?: boolean;
};

type ImageOption = { name: string; url: string };

// Common Lucide icon names to choose from (expand as needed)
const LUCIDE_ICONS = [
  'calendar',
  'link',
  'external-link',
  'globe',
  'wallet',
  'credit-card',
  'users',
  'file-text',
  'folder',
  'book-open',
  'phone',
  'video',
  'mail',
  'dollar-sign',
  'badge-dollar-sign',
  'presentation',
  'chart-bar',
  'rocket',
];

function ButtonEditorRow({
  item,
  onChange,
  onRemove,
  availableImages,
  boardId,
}: {
  item: ButtonItem;
  onChange: (next: ButtonItem) => void;
  onRemove: () => void;
  availableImages?: ImageOption[];
  boardId?: string;
}) {
  const lucideNameFromUrl = (url?: string) => {
    if (!url) return '';
    const m = url.match(/lucide\/([a-z0-9-]+)\.svg/i);
    return m?.[1] || '';
  };

  // If Azure Blob container is private, convert raw blob URL to a signed SAS URL
  const signIfAzure = async (rawUrl: string): Promise<string> => {
    try {
      if (!rawUrl) return rawUrl;
      if (/\.blob\.core\.windows\.net\//i.test(rawUrl)) {
        const res = await fetch('/api/blobs/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl, ttlSeconds: 24 * 3600 }),
        });
        if (!res.ok) throw new Error(await res.text());
        const j = await res.json();
        return j?.url || rawUrl;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  return (
    <div className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 rounded-xl border border-border/50 bg-background/30 hover:bg-background/50 transition-all">
      <div className="md:col-span-4 space-y-1">
        <Label className="text-xs text-muted-foreground">Label</Label>
        <Input
          placeholder="Button Label"
          value={item.label}
          onChange={(e) => onChange({ ...item, label: e.target.value })}
          className="bg-background/50 border-border/50 h-9"
        />
      </div>

      <div className="md:col-span-5 space-y-1">
        <Label className="text-xs text-muted-foreground">Destination URL</Label>
        <div className="relative">
          <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="https://example.com"
            value={item.href}
            onChange={(e) => onChange({ ...item, href: e.target.value })}
            className="bg-background/50 border-border/50 h-9 pl-9"
          />
        </div>
      </div>

      <div className="md:col-span-3 space-y-1">
        <Label className="text-xs text-muted-foreground">Style</Label>
        <Select
          value={item.type || 'secondary'}
          onValueChange={(val) => onChange({ ...item, type: val as any })}
        >
          <SelectTrigger className="bg-background/50 border-border/50 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-12 pt-3 border-t border-border/30 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Icon:</Label>
            <Select
              value={item.iconType || 'upload'}
              onValueChange={(val) => {
                const src = (val || 'upload') as 'upload' | 'lucide';
                onChange({ ...item, iconType: src, iconUrl: '' });
              }}
            >
              <SelectTrigger className="w-[100px] bg-background/50 border-border/50 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upload">Image</SelectItem>
                <SelectItem value="lucide">Icon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Uploaded image controls */}
          {((item.iconType || 'upload') === 'upload') && (
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto min-w-0">
              {availableImages && availableImages.length > 0 && (
                <Select
                  value={item.iconUrl || ''}
                  onValueChange={async (val) => {
                    const signed = await signIfAzure(val);
                    onChange({ ...item, iconUrl: signed });
                  }}
                >
                  <SelectTrigger className="flex-1 w-full sm:w-[160px] bg-background/50 border-border/50 h-8 text-xs truncate">
                    <SelectValue placeholder="Select file..." />
                  </SelectTrigger>
                  <SelectContent className="max-w-[200px]">
                    {availableImages.map((img) => (
                      <SelectItem key={img.url} value={img.url} className="truncate text-xs">
                        {img.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-2 shrink-0">
                <input
                  id={`file-${item.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    try {
                      const file = e.currentTarget.files?.[0] || null;
                      if (!file) { toast.error('Select an image'); return; }
                      const fd = new FormData();
                      fd.append('file', file);
                      const endpoint = '/api/upload';
                      const res = await fetch(endpoint, { method: 'POST', body: fd });
                      if (!res.ok) throw new Error(await res.text());
                      const j = await res.json();
                      const url = j?.document?.document_file_url;
                      if (url) {
                        const signed = await signIfAzure(url);
                        onChange({ ...item, iconUrl: signed, iconType: 'upload' as 'upload' });
                        toast.success('Icon uploaded');
                      }
                    } catch (err: any) {
                      toast.error(err?.message || 'Upload failed');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs bg-background/50 border-border/50"
                  onClick={() => {
                    const inputEl = document.getElementById(`file-${item.id}`) as HTMLInputElement | null;
                    inputEl?.click();
                  }}
                  title="Upload new image"
                >
                  <Upload className="w-3 h-3 sm:mr-2" />
                  <span className="hidden sm:inline">Upload</span>
                </Button>
                {item.iconUrl && (
                  <div className="h-8 w-8 rounded border border-border/50 bg-background/50 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={item.iconUrl} alt="icon" className="w-4 h-4 object-contain" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lucide controls */}
          {item.iconType === 'lucide' && (
            <Select
              value={lucideNameFromUrl(item.iconUrl) || ''}
              onValueChange={(val) => {
                const url = val ? `https://api.iconify.design/lucide/${val}.svg?color=%23f1f5f9` : '';
                onChange({ ...item, iconUrl: url, iconType: 'lucide' as 'lucide' });
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px] bg-background/50 border-border/50 h-8 text-xs">
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {LUCIDE_ICONS.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-4 ml-auto shrink-0">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Enabled</Label>
            <Switch
              checked={item.enabled !== false}
              onCheckedChange={(val) => onChange({ ...item, enabled: !!val })}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

type Props = { boardId: string };

// Simple SWR hook for documents by project
function useProjectDocuments(boardId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ documents: any[] }>(
    boardId ? `/api/campaigns/${boardId}/documents` : null,
    fetcher,
    { refreshInterval: 60000 }
  );
  return { docs: data?.documents ?? [], error, isLoading, mutate };
}

export default function ProjectEditPanel({ boardId }: Props) {
  const [tab, setTab] = useState("brand");

  // Default button set state
  const [defaultSet, setDefaultSet] = useState<any | null>(null);
  const [defaultSetName, setDefaultSetName] = useState<string>("");
  const [defaultSetConfigText, setDefaultSetConfigText] = useState<string>("{}");
  const [defaultButtons, setDefaultButtons] = useState<ButtonItem[]>([]);
  // Theme colors for email-styled preview (match vcrun.py PortalPay styles)
  const [builderPrimaryColor, setBuilderPrimaryColor] = useState<string>("#0f766e");
  const [builderSecondaryColor, setBuilderSecondaryColor] = useState<string>("#14b8a6");
  const [loadingDefaultSet, setLoadingDefaultSet] = useState(false);
  const [savingDefaultSet, setSavingDefaultSet] = useState(false);

  // Keep JSON config text in sync with builder edits so changes (e.g., iconUrl) are visible immediately
  useEffect(() => {
    try {
      const cfg = { buttons: defaultButtons, theme: { primary: builderPrimaryColor, secondary: builderSecondaryColor } };
      setDefaultSetConfigText(JSON.stringify(cfg, null, 2));
    } catch { }
  }, [defaultButtons, builderPrimaryColor, builderSecondaryColor]);

  // Documents
  const { docs, isLoading: docsLoading, mutate: refreshDocs } = useProjectDocuments(boardId);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Precompute available image docs for pickers
  const availableImages: ImageOption[] = useMemo(() => {
    const isImageUrl = (url: string) => /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url);
    return (docs || [])
      .map((d: any) => ({ name: d.document_name || d.id || 'image', url: d.document_file_url }))
      .filter((x) => !!x.url && isImageUrl(x.url));
  }, [docs]);

  // Load default preset for this project
  useEffect(() => {
    (async () => {
      if (!boardId) return;
      try {
        setLoadingDefaultSet(true);
        const res = await fetch(`/api/campaigns/${boardId}/button-sets`);
        if (!res.ok) throw new Error(await res.text());
        const j = await res.json();
        const sets: any[] = Array.isArray(j?.sets) ? j.sets : [];
        const def = sets.find((s) => !!s.isDefault) || null;
        setDefaultSet(def);
        if (def) {
          setDefaultSetName(def.name || "Default");
          setDefaultSetConfigText(JSON.stringify(def.config ?? {}, null, 2));
          const cfg = def?.config ?? {};
          const initialButtons = Array.isArray((cfg as any)?.buttons)
            ? (cfg as any).buttons
            : Array.isArray(cfg)
              ? (cfg as any)
              : [];
          setDefaultButtons(initialButtons);
          // Initialize theme colors from preset config
          try {
            const theme = (cfg as any)?.theme || {};
            if (typeof theme.primary === 'string') setBuilderPrimaryColor(theme.primary);
            if (typeof theme.secondary === 'string') setBuilderSecondaryColor(theme.secondary);
          } catch { }
        } else {
          setDefaultSetName("Default");
          setDefaultSetConfigText("{}");
          setDefaultButtons([]);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingDefaultSet(false);
      }
    })();
  }, [boardId]);

  const onCreateDefaultSet = async () => {
    try {
      const res = await fetch(`/api/campaigns/${boardId}/button-sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: defaultSetName || "Default", config: {}, isDefault: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      setDefaultSet(j?.set || null);
      setDefaultSetName(j?.set?.name || "Default");
      setDefaultSetConfigText(JSON.stringify(j?.set?.config ?? {}, null, 2));
      toast.success("Default preset created");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create default preset");
    }
  };

  const onSaveDefaultSet = async () => {
    if (!defaultSet?.id) {
      toast.error("No default preset exists. Create it first.");
      return;
    }
    // Prefer builder buttons; fallback to JSON textarea if empty
    let configObj: any = {};
    if (defaultButtons && defaultButtons.length > 0) {
      configObj = { buttons: defaultButtons, theme: { primary: builderPrimaryColor, secondary: builderSecondaryColor } };
    } else {
      try {
        configObj = JSON.parse(defaultSetConfigText);
        if (configObj && typeof configObj === 'object') {
          configObj.theme = { primary: builderPrimaryColor, secondary: builderSecondaryColor, ...(configObj.theme || {}) };
        }
      } catch {
        toast.error("Invalid JSON config");
        return;
      }
    }
    try {
      setSavingDefaultSet(true);
      const res = await fetch(`/api/campaigns/${boardId}/button-sets/${defaultSet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: defaultSetName || "Default", config: configObj }),
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      const updated = j?.set;
      setDefaultSet(updated || defaultSet);
      setDefaultSetName(updated?.name || defaultSetName);
      // update local builder state from returned config so user sees saved data immediately
      const cfg = updated?.config ?? {};
      setDefaultSetConfigText(JSON.stringify(cfg, null, 2));
      const initialButtons = Array.isArray((cfg as any)?.buttons)
        ? (cfg as any).buttons
        : Array.isArray(cfg)
          ? (cfg as any)
          : [];
      setDefaultButtons(initialButtons);
      try {
        const theme = (cfg as any)?.theme || {};
        if (typeof theme.primary === 'string') setBuilderPrimaryColor(theme.primary);
        if (typeof theme.secondary === 'string') setBuilderSecondaryColor(theme.secondary);
      } catch { }
      toast.success("Default preset saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save default preset");
    } finally {
      setSavingDefaultSet(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-1 sm:p-4">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/40 backdrop-blur-xl shadow-xl">
        {/* Glass Header */}
        <div className="relative px-6 py-8 border-b border-border/50 bg-background/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-50" />
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.15)]">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Board Settings</h2>
              <p className="text-muted-foreground mt-1">Configure branding, defaults, and assets.</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <Tabs value={tab} onValueChange={setTab} className="space-y-8">
            <TabsList className="bg-background/50 border border-border/50 p-1 h-11 rounded-xl">
              <TabsTrigger value="brand" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Palette className="w-4 h-4 mr-2" />
                Brand
              </TabsTrigger>
              <TabsTrigger value="default" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Default Set
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Brand tab */}
            <TabsContent value="brand" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-background/30 p-6 rounded-xl border border-border/50">
                <BrandEditor projectId={boardId} />
              </div>
            </TabsContent>

            {/* Default Button Set tab */}
            <TabsContent value="default" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {loadingDefaultSet && (
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                  Loading settings...
                </div>
              )}
              {!loadingDefaultSet && (
                <div className="space-y-8">
                  <div className="bg-background/30 p-6 rounded-xl border border-border/50 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label>Preset Name</Label>
                        <Input
                          value={defaultSetName}
                          onChange={(e) => setDefaultSetName(e.target.value)}
                          className="bg-background/50 border-border/50 w-full sm:w-64"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-4 sm:pt-0">
                        {!defaultSet && (
                          <Button onClick={onCreateDefaultSet} className="shadow-lg shadow-primary/20">
                            Create Default
                          </Button>
                        )}
                        {defaultSet && (
                          <Button onClick={onSaveDefaultSet} disabled={savingDefaultSet} className="shadow-lg shadow-primary/20">
                            {savingDefaultSet ? "Saving..." : "Save Changes"}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Raw Config (Advanced)</Label>
                      <Textarea
                        value={defaultSetConfigText}
                        onChange={(e) => setDefaultSetConfigText(e.target.value)}
                        rows={4}
                        className="bg-background/50 border-border/50 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Editor Column */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LayoutTemplate className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold">Button Editor</h3>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDefaultButtons((prev) => ([
                              ...prev,
                              { id: Math.random().toString(36).slice(2), label: 'New Button', href: 'https://', type: 'secondary', enabled: true },
                            ]));
                          }}
                          className="bg-background/50 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Button
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {defaultButtons.length === 0 ? (
                          <div className="text-center p-12 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground">
                            No buttons configured. Add one to get started.
                          </div>
                        ) : (
                          defaultButtons.map((item, idx) => (
                            <ButtonEditorRow
                              key={item.id || idx}
                              item={item}
                              availableImages={availableImages}
                              boardId={boardId}
                              onChange={(next) => setDefaultButtons((prev) => prev.map((p, i) => (i === idx ? { ...p, ...next, iconType: next.iconType as 'upload' | 'lucide' | undefined } : p)))}
                              onRemove={() => setDefaultButtons((prev) => prev.filter((_, i) => i !== idx))}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    {/* Preview Column */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold">Live Preview</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Primary</span>
                            <div className="h-6 w-6 rounded-full overflow-hidden border border-border/50 shadow-sm relative">
                              <input
                                type="color"
                                value={builderPrimaryColor}
                                onChange={(e) => setBuilderPrimaryColor(e.target.value)}
                                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Secondary</span>
                            <div className="h-6 w-6 rounded-full overflow-hidden border border-border/50 shadow-sm relative">
                              <input
                                type="color"
                                value={builderSecondaryColor}
                                onChange={(e) => setBuilderSecondaryColor(e.target.value)}
                                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border border-border/50 rounded-xl p-6 bg-zinc-950/50 backdrop-blur-sm shadow-inner min-h-[300px] flex items-center justify-center">
                        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg shadow-2xl overflow-hidden transform scale-95 sm:scale-100 transition-transform">
                          {/* Fake Email Header */}
                          <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>

                          {/* Email Body */}
                          <div className="p-6 space-y-4">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>

                            <div className="py-4">
                              <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: '8px 0' }}>
                                      {defaultButtons.filter(b => b.enabled !== false).map((b, i) => (
                                        <table key={b.id || i} role="presentation" cellPadding={0} cellSpacing={0} style={{
                                          display: 'inline-block',
                                          marginRight: 12,
                                          marginBottom: 12,
                                          borderRadius: 16,
                                          background:
                                            `radial-gradient(120% 140% at 15% 15%, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.22) 38%, rgba(4,120,87,0.16) 62%, rgba(3,84,63,0.12) 100%), ` +
                                            `linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%), ` +
                                            `linear-gradient(135deg, ${builderPrimaryColor} 0%, ${builderPrimaryColor} 100%)`,
                                          border: `2px solid ${builderSecondaryColor}`,
                                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 24px rgba(15,118,110,0.35)',
                                          overflow: 'hidden',
                                          borderCollapse: 'separate',
                                        }}>
                                          <tbody>
                                            <tr>
                                              <td style={{
                                                height: 40,
                                                padding: '0 12px',
                                              }}>
                                                <a href={b.href || '#'}
                                                  style={{
                                                    color: '#f1f5f9',
                                                    fontSize: 14,
                                                    fontFamily: 'Inter, Arial, sans-serif',
                                                    fontWeight: 700,
                                                    letterSpacing: 0.2,
                                                    whiteSpace: 'nowrap',
                                                    textDecoration: 'none',
                                                    display: 'inline-block',
                                                    outline: 'none',
                                                    border: 0,
                                                    lineHeight: '18px',
                                                  }}
                                                >
                                                  {b.iconUrl ? (
                                                    <img src={b.iconUrl} alt="" width={18} height={18} style={{ display: 'inline-block', verticalAlign: 'middle', border: '0', marginRight: 8, objectFit: 'contain', background: 'transparent' }} />
                                                  ) : null}
                                                  <span style={{ verticalAlign: 'middle' }}>{b.label || 'Button'}</span>
                                                </a>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      ))}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Documents tab */}
            <TabsContent value="documents" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-background/30 p-6 rounded-xl border border-border/50 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Project Documents</h3>
                    <p className="text-sm text-muted-foreground">Manage files associated with this board.</p>
                  </div>
                  <Button onClick={() => setUploadOpen(true)} className="shadow-lg shadow-primary/20">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>

                {/* Upload modal */}
                <UploadFileModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document">
                  <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const input = (e.currentTarget.querySelector("input[type=file]") as HTMLInputElement);
                      const file = input?.files?.[0];
                      if (!file) { toast.error("Select a file"); return; }
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        const res = await fetch(`/api/campaigns/${boardId}/upload-document`, {
                          method: "POST",
                          body: form,
                        });
                        if (!res.ok) throw new Error(await res.text());
                        toast.success("Document uploaded");
                        setUploadOpen(false);
                        refreshDocs();
                      } catch (err: any) {
                        toast.error(err?.message || "Upload failed");
                      }
                    }}
                  >
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => (document.querySelector('input[type=file]') as HTMLInputElement)?.click()}>
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to select or drag and drop file here</p>
                    </div>
                    <input type="file" className="hidden" />
                    <div className="flex justify-end">
                      <Button type="submit">Upload</Button>
                    </div>
                  </form>
                </UploadFileModal>

                {/* Documents list */}
                {docsLoading && (
                  <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                    Loading documents...
                  </div>
                )}
                {!docsLoading && (
                  <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border/50">
                        <tr>
                          <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Owner</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {docs.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              No documents yet.
                            </td>
                          </tr>
                        ) : (
                          docs.map((d: any) => (
                            <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-4 font-medium">{d.document_name || d.id}</td>
                              <td className="p-4 text-muted-foreground">{d.document_type || "—"}</td>
                              <td className="p-4 text-muted-foreground">{d.assigned_to_user?.email || "—"}</td>
                              <td className="p-4">
                                {d.document_file_url ? (
                                  <a href={d.document_file_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary hover:underline">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Open
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
