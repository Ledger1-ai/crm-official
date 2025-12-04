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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border p-2 rounded-md">
      <Input
        placeholder="Label"
        value={item.label}
        onChange={(e) => {
          const next = { ...item, label: e.target.value };
          console.log('[ButtonEditorRow] label change', next);
          onChange(next);
        }}
        className="md:col-span-3"
      />
      <Input
        placeholder="https://example.com"
        value={item.href}
        onChange={(e) => {
          const next = { ...item, href: e.target.value };
          console.log('[ButtonEditorRow] href change', next);
          onChange(next);
        }}
        className="md:col-span-5"
      />
      <select
        value={item.type || 'secondary'}
        onChange={(e) => onChange({ ...item, type: e.target.value as any })}
        className="md:col-span-4 min-w-[160px] border rounded px-2 py-2"
      >
        <option value="primary">primary</option>
        <option value="secondary">secondary</option>
      </select>
      <div className="md:col-span-12 flex flex-wrap items-center gap-2">
        {/* Icon source selector */}
        <select
          className="border rounded px-2 py-2 text-sm"
          value={item.iconType || 'upload'}
          onChange={(e) => {
            const src = (e.target.value || 'upload') as 'upload' | 'lucide';
            const next = { ...item, iconType: src, iconUrl: '' };
            console.log('[ButtonEditorRow] iconType change', next);
            onChange(next);
          }}
        >
          <option value="upload">Uploaded image</option>
          <option value="lucide">Lucide symbol</option>
        </select>

        {/* Uploaded image controls */}
        {((item.iconType || 'upload') === 'upload') && (
          <>
            <Input
              placeholder="Icon URL (optional)"
              value={item.iconUrl || ''}
              onChange={async (e) => {
                const raw = e.target.value;
                const nextUrl = await signIfAzure(raw);
                const next = { ...item, iconUrl: nextUrl };
                console.log('[ButtonEditorRow] iconUrl input change', next);
                onChange(next);
              }}
            />
            {availableImages && availableImages.length > 0 && (
              <select
                className="border rounded px-2 py-2 text-sm"
                value={item.iconUrl || ''}
                onChange={async (e) => {
                  const raw = e.target.value;
                  const signed = await signIfAzure(raw);
                  const next = { ...item, iconUrl: signed };
                  console.log('[ButtonEditorRow] upload select change', next);
                  onChange(next);
                }}
              >
                <option value="">-- Select from uploads --</option>
                {availableImages.map((img) => (
                  <option key={img.url} value={img.url}>{img.name}</option>
                ))}
              </select>
            )}
            <div className="md:col-span-12 flex items-center gap-2">
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
                    console.log('[ButtonEditorRow] uploading icon to', endpoint, 'filename=', file.name, 'type=', file.type);
                    const res = await fetch(endpoint, { method: 'POST', body: fd });
                    const rawText = !res.ok ? await res.text() : undefined;
                    if (!res.ok) {
                      console.error('[ButtonEditorRow] upload failed', rawText);
                      throw new Error(rawText || 'Upload failed');
                    }
                    const j = await res.json();
                    console.log('[ButtonEditorRow] upload response', j);
                    const url = j?.document?.document_file_url;
                    if (url) {
                      const signed = await signIfAzure(url);
                      const next = { ...item, iconUrl: signed, iconType: 'upload' as 'upload' };
                      console.log('[ButtonEditorRow] upload icon set', next);
                      onChange(next);
                      toast.success('Icon uploaded');
                    } else {
                      toast.error('Upload succeeded, but no URL returned');
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
                onClick={() => {
                  const inputEl = document.getElementById(`file-${item.id}`) as HTMLInputElement | null;
                  inputEl?.click();
                }}
              >
                Upload Icon
              </Button>
              {item.iconUrl && (
                <img src={item.iconUrl} alt="icon" width={16} height={16} style={{ display: "inline-block", marginLeft: 6, flexShrink: 0 }} />
              )}
            </div>
          </>
        )}

        {/* Lucide controls */}
        {item.iconType === 'lucide' && (
          <select
            className="border rounded px-2 py-2 text-sm"
            value={lucideNameFromUrl(item.iconUrl) || ''}
            onChange={(e) => {
              const name = e.target.value;
              const url = name ? `https://api.iconify.design/lucide/${name}.svg?color=%23f1f5f9` : '';
              const next = { ...item, iconUrl: url, iconType: 'lucide' as 'lucide' };
              console.log('[ButtonEditorRow] lucide change', next);
              onChange(next);
            }}
          >
            <option value="">-- Lucide symbol --</option>
            {LUCIDE_ICONS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="md:col-span-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Enabled</span>
          <Switch
            checked={item.enabled !== false}
            onCheckedChange={(val) => onChange({ ...item, enabled: !!val })}
          />
        </div>
        <Button variant="destructive" onClick={onRemove}>Remove</Button>
      </div>
    </div>
  );
}

type Props = { boardId: string };

// Simple SWR hook for documents by project
function useProjectDocuments(boardId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ documents: any[] }>(
    boardId ? `/api/projects/${boardId}/documents` : null,
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
      console.log('[ProjectEditPanel] sync JSON from builder', cfg);
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
        const res = await fetch(`/api/projects/${boardId}/button-sets`);
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
      const res = await fetch(`/api/projects/${boardId}/button-sets`, {
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
      console.log('[ProjectEditPanel] saving preset', { name: defaultSetName || 'Default', config: configObj });
      const res = await fetch(`/api/projects/${boardId}/button-sets/${defaultSet.id}`, {
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
      // also sync theme pickers from saved config
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
    <div className="rounded-lg border bg-card dark:bg-slate-900 dark:border-slate-700 p-4 space-y-4 max-h-[80vh] overflow-auto">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="brand">Brand</TabsTrigger>
            <TabsTrigger value="default">Default Button Set</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
        </div>

        {/* Brand tab: reuse existing BrandEditor */}
        <TabsContent value="brand" className="space-y-3">
          <div className="text-sm text-muted-foreground">Modify project logo and primary color.</div>
          <BrandEditor projectId={boardId} />
        </TabsContent>

        {/* Default Button Set tab */}
        <TabsContent value="default" className="space-y-3">
          {loadingDefaultSet && <div className="text-sm text-muted-foreground">Loading default preset…</div>}
          {!loadingDefaultSet && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Name</label>
                  <Input value={defaultSetName} onChange={(e) => setDefaultSetName(e.target.value)} className="w-64" />
                  {!defaultSet && (
                    <Button onClick={onCreateDefaultSet}>Create Default</Button>
                  )}
                  {defaultSet && (
                    <Button onClick={onSaveDefaultSet} disabled={savingDefaultSet}>
                      {savingDefaultSet ? "Saving…" : "Save Default"}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Config JSON</label>
                  <Textarea
                    value={defaultSetConfigText}
                    onChange={(e) => setDefaultSetConfigText(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Default Buttons</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Primary</span>
                      <input type="color" value={builderPrimaryColor} onChange={(e) => setBuilderPrimaryColor(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Secondary</span>
                      <input type="color" value={builderSecondaryColor} onChange={(e) => setBuilderSecondaryColor(e.target.value)} />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDefaultButtons((prev) => ([
                          ...prev,
                          { id: Math.random().toString(36).slice(2), label: 'New Button', href: 'https://', type: 'secondary', enabled: true },
                        ]));
                      }}
                    >
                      Add Button
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                  {defaultButtons.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No buttons yet. Use Add Button or paste JSON to seed.</div>
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

                {/* Email preview */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Email Preview</div>
                  <div className="border rounded-md p-3 bg-white dark:bg-slate-900 max-h-[260px] overflow-auto">
                    <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 0' }}>
                            {/* Render buttons in an email-safe layout */}
                            {defaultButtons.filter(b => b.enabled !== false).map((b, i) => (
                              <table key={b.id || i} role="presentation" cellPadding={0} cellSpacing={0} style={{
                                display: 'inline-block',
                                marginRight: 12,
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
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Upload and manage project documents.</div>
            <Button onClick={() => setUploadOpen(true)}>Upload Document</Button>
          </div>

          {/* Upload modal */}
          <UploadFileModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document">
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const input = (e.currentTarget.querySelector("input[type=file]") as HTMLInputElement);
                const file = input?.files?.[0];
                if (!file) { toast.error("Select a file"); return; }
                try {
                  const form = new FormData();
                  form.append("file", file);
                  const res = await fetch(`/api/projects/${boardId}/upload-document`, {
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
              <input type="file" className="block w-full" />
              <div className="flex justify-end">
                <Button type="submit">Upload</Button>
              </div>
            </form>
          </UploadFileModal>

          {/* Documents list */}
          {docsLoading && <div className="text-sm text-muted-foreground">Loading documents…</div>}
          {!docsLoading && (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Owner</th>
                    <th className="text-left p-2">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {docs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">No documents yet.</td>
                    </tr>
                  ) : (
                    docs.map((d: any) => (
                      <tr key={d.id}>
                        <td className="p-2">{d.document_name || d.id}</td>
                        <td className="p-2">{d.document_type || "—"}</td>
                        <td className="p-2">{d.assigned_to_user?.email || "—"}</td>
                        <td className="p-2">
                          {d.document_file_url ? (
                            <a href={d.document_file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Open</a>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
