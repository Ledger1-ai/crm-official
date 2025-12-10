'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
const SignatureBuilder = dynamic(() => import('@/components/SignatureBuilder'), { ssr: false });

/**
* Signatures & Resources panel
* - Signature tab: paste HTML signature, preview, save to /api/profile/signature
* - Resources tab: manage per-user resource buttons, and per-project presets (create, edit, duplicate default)
* - Prompt tab: edit per-user default outreach prompt, save to /api/profile/outreach-prompt
*/

type ResourceLink = {
  id: string;
  label: string;
  href: string;
  type?: 'primary' | 'secondary';
  iconUrl?: string;
  enabled?: boolean;
};

const DEFAULT_RESOURCES: ResourceLink[] = [
  { id: 'portalpay', label: 'Explore PortalPay', href: 'https://pay.ledger1.ai', type: 'primary', enabled: true },
  { id: 'calendar', label: 'Schedule a Call', href: 'https://calendar.app.google/EJ4WsqeS2JSXt6ZcA', type: 'primary', enabled: true },
  { id: 'investor_portal', label: 'View Investor Portal', href: 'https://stack.angellist.com/s/lp1srl5cnf', type: 'secondary', enabled: true },
  { id: 'data_room', label: 'Access Data Room', href: 'https://stack.angellist.com/s/x8g9yjgpbw', type: 'secondary', enabled: true },
]

function ResourceEditorRow({
  item,
  onChange,
  onRemove,
}: {
  item: ResourceLink;
  onChange: (next: ResourceLink) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center border p-2 rounded-md">
      <Input
        placeholder="Label"
        value={item.label}
        onChange={(e) => onChange({ ...item, label: e.target.value })}
        className="md:col-span-1"
      />
      <Input
        placeholder="https://example.com"
        value={item.href}
        onChange={(e) => onChange({ ...item, href: e.target.value })}
        className="md:col-span-2"
      />
      <Input
        placeholder="Icon URL (optional)"
        value={item.iconUrl || ''}
        onChange={(e) => onChange({ ...item, iconUrl: e.target.value })}
        className="md:col-span-2"
      />
      <select
        value={item.type || 'secondary'}
        onChange={(e) => onChange({ ...item, type: e.target.value as any })}
        className="border rounded px-2 py-2"
      >
        <option value="primary">primary</option>
        <option value="secondary">secondary</option>
      </select>
      <div className="flex items-center gap-2">
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={item.enabled !== false}
            onChange={(e) => onChange({ ...item, enabled: e.target.checked })}
          />
          Enabled
        </label>
        <Button variant="destructive" onClick={onRemove}>Remove</Button>
      </div>
    </div>
  );
}

export default function SignaturesResourcesPanel() {
  const [tab, setTab] = useState('resources');
  const [showSignatureBuilder, setShowSignatureBuilder] = useState(false);

  // Signature
  const [signatureHtml, setSignatureHtml] = useState<string>('');
  const [signatureMeta, setSignatureMeta] = useState<any>(null);
  const signaturePreview = useMemo(() => ({ __html: signatureHtml || '' }), [signatureHtml]);

  // Resources
  const [resources, setResources] = useState<ResourceLink[]>(DEFAULT_RESOURCES);
  // Theme for button previews (fallback to PortalPay teal theme)
  const [themePrimary, setThemePrimary] = useState<string>('#0f766e');
  const [themeSecondary, setThemeSecondary] = useState<string>('#14b8a6');

  // Projects + presets state
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [presetSets, setPresetSets] = useState<any[]>([]);
  const [presetsLoading, setPresetsLoading] = useState<boolean>(false);
  const [editingPreset, setEditingPreset] = useState<Record<string, { name: string; configText: string }>>({});

  // Prompt
  const [promptText, setPromptText] = useState<string>('');
  const [promptUpdatedAt, setPromptUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    // Load existing settings + projects on mount
    (async () => {
      try {
        // Signature
        const sigRes = await fetch('/api/profile/signature', { method: 'GET' });
        if (sigRes.ok) {
          const data = await sigRes.json();
          setSignatureHtml(data.signature_html || '');
          const meta = data.signature_meta || null;
          setSignatureMeta(meta);
          // Apply theme from signature meta if present
          try {
            const t = (meta?.theme) || {};
            if (typeof t.primary === 'string') setThemePrimary(t.primary);
            if (typeof t.secondary === 'string') setThemeSecondary(t.secondary);
            // Fallback: if accentColor exists but no theme.secondary, use it as secondary accent
            if (!t.secondary && typeof meta?.accentColor === 'string') setThemeSecondary(meta.accentColor);
          } catch { }
        }

        // Resources
        const resRes = await fetch('/api/profile/resources', { method: 'GET' });
        if (resRes.ok) {
          const data = await resRes.json();
          if (Array.isArray(data.resources)) setResources(data.resources);
        }

        // Prompt
        const promptRes = await fetch('/api/profile/outreach-prompt', { method: 'GET' });
        if (promptRes.ok) {
          const data = await promptRes.json();
          setPromptText(data.promptText || '');
          setPromptUpdatedAt(data.updatedAt || null);
        }

        // Projects (boards) accessible to the user
        const projRes = await fetch('/api/projects', { method: 'GET' });
        if (projRes.ok) {
          const j = await projRes.json();
          const list = Array.isArray(j?.projects) ? j.projects : [];
          setProjects(list);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    })();
  }, []);

  const saveSignature = async () => {
    try {
      const res = await fetch('/api/profile/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureHtml, meta: signatureMeta }),
      });
      if (res.ok) {
        toast.success('Signature saved');
      } else {
        const t = await res.text();
        toast.error(`Failed to save signature: ${t}`);
      }
    } catch (e: any) {
      toast.error(`Failed to save signature: ${e?.message || e}`);
    }
  };

  const addResource = () => {
    setResources((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), label: 'New Link', href: 'https://', type: 'secondary', enabled: true },
    ]);
  };

  const saveResources = async () => {
    try {
      const res = await fetch('/api/profile/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceLinks: resources }),
      });
      if (res.ok) {
        toast.success('Resources saved');
      } else {
        const t = await res.text();
        toast.error(`Failed to save resources: ${t}`);
      }
    } catch (e: any) {
      toast.error(`Failed to save resources: ${e?.message || e}`);
    }
  };

  const resetResourcesToDefault = () => setResources(DEFAULT_RESOURCES);

  const savePrompt = async () => {
    try {
      const res = await fetch('/api/profile/outreach-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText }),
      });
      if (res.ok) {
        toast.success('Prompt saved');
        setPromptUpdatedAt(new Date().toISOString());
      } else {
        const t = await res.text();
        toast.error(`Failed to save prompt: ${t}`);
      }
    } catch (e: any) {
      toast.error(`Failed to save prompt: ${e?.message || e}`);
    }
  };

  return (
    <div className="w-full h-full">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-start mb-4 w-full overflow-hidden">
          <div className="overflow-x-auto no-scrollbar w-full">
            <TabsList className="inline-flex h-8 p-0.5 min-w-max">
              <TabsTrigger value="signature" className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 whitespace-nowrap">Signature</TabsTrigger>
              <TabsTrigger value="resources" className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 whitespace-nowrap">Resources</TabsTrigger>
              <TabsTrigger value="prompt" className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 whitespace-nowrap">Prompt</TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Signature Tab - embedded builder behind an explicit toggle */}
        <TabsContent value="signature">
          {!showSignatureBuilder ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Use the Signature Builder to compose and save your email signature. It will be saved to your profile and can be copied for Gmail.</p>
              <Button onClick={() => setShowSignatureBuilder(true)}>Open Signature Builder</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <SignatureBuilder hasAccess={true} />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowSignatureBuilder(false)}>Close Builder</Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <div className="space-y-6">
            {/* Per-user resource buttons */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <h3 className="text-lg font-semibold">Resource Buttons</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={resetResourcesToDefault} className="text-xs sm:text-sm">Reset Defaults</Button>
                  <Button onClick={addResource} className="text-xs sm:text-sm">Add</Button>
                  <Button onClick={saveResources} className="text-xs sm:text-sm">Save</Button>
                </div>
              </div>
              <div className="space-y-2">
                {resources.map((item, idx) => (
                  <ResourceEditorRow
                    key={item.id || idx}
                    item={item}
                    onChange={(next) => {
                      setResources((prev) => prev.map((p, i) => (i === idx ? next : p)));
                    }}
                    onRemove={() => {
                      setResources((prev) => prev.filter((_, i) => i !== idx));
                    }}
                  />
                ))}
              </div>

              {/* Email preview of resource buttons */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Email Preview</div>
                <div className="border rounded-md p-3 bg-white">
                  <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 0' }}>
                          {resources.filter(b => b.enabled !== false).map((b, i) => (
                            <table key={b.id || i} role="presentation" cellPadding={0} cellSpacing={0} style={{ display: 'inline-block', marginRight: 12 }}>
                              <tbody>
                                <tr>
                                  <td>
                                    <a
                                      href={b.href || '#'}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        height: 40,
                                        padding: '0 12px',
                                        borderRadius: 9999,
                                        overflow: 'hidden',
                                        background:
                                          `radial-gradient(120% 140% at 15% 15%, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.22) 38%, rgba(4,120,87,0.16) 62%, rgba(3,84,63,0.12) 100%), ` +
                                          `linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%), ` +
                                          `linear-gradient(135deg, ${themePrimary} 0%, ${themePrimary} 100%)`,
                                        border: `2px solid ${themeSecondary}`,
                                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 24px rgba(15,118,110,0.35)',
                                        color: '#f1f5f9',
                                        fontSize: 14,
                                        fontFamily: 'Inter, Arial, sans-serif',
                                        fontWeight: 700,
                                        letterSpacing: 0.2,
                                        whiteSpace: 'nowrap',
                                        textDecoration: 'none'
                                      }}>
                                      {b.iconUrl ? (
                                        <img src={b.iconUrl} alt="" width={18} height={18} style={{ display: 'inline-block', verticalAlign: 'middle', border: '0' }} />
                                      ) : null}
                                      {b.label || 'Button'}
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

            {/* Project Presets Builder */}
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Project Presets</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                  <select
                    className="rounded border p-2 text-sm bg-background w-full sm:w-auto"
                    value={selectedProjectId}
                    onChange={async (e) => {
                      const pid = e.target.value;
                      setSelectedProjectId(pid);
                      if (!pid) return;
                      setPresetsLoading(true);
                      try {
                        const res = await fetch(`/api/projects/${pid}/button-sets`);
                        if (!res.ok) throw new Error(await res.text());
                        const j = await res.json();
                        const sets = Array.isArray(j?.sets) ? j.sets : [];
                        setPresetSets(sets);
                        const edit: Record<string, { name: string; configText: string }> = {};
                        for (const s of sets) {
                          edit[s.id] = { name: s.name || 'Preset', configText: JSON.stringify(s.config ?? {}, null, 2) };
                        }
                        setEditingPreset(edit);
                      } catch (e) {
                        toast.error('Failed to load presets');
                      } finally {
                        setPresetsLoading(false);
                      }
                    }}
                  >
                    <option value="">-- Select project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="text-xs"
                      onClick={async () => {
                        if (!selectedProjectId) { toast.error('Select a project'); return; }
                        setPresetsLoading(true);
                        try {
                          const res = await fetch(`/api/projects/${selectedProjectId}/button-sets`);
                          if (!res.ok) throw new Error(await res.text());
                          const j = await res.json();
                          const sets = Array.isArray(j?.sets) ? j.sets : [];
                          setPresetSets(sets);
                          const edit: Record<string, { name: string; configText: string }> = {};
                          for (const s of sets) {
                            edit[s.id] = { name: s.name || 'Preset', configText: JSON.stringify(s.config ?? {}, null, 2) };
                          }
                          setEditingPreset(edit);
                        } catch (e) {
                          toast.error('Failed to load presets');
                        } finally {
                          setPresetsLoading(false);
                        }
                      }}
                    >
                      Load
                    </Button>
                    <Button
                      className="text-xs"
                      onClick={async () => {
                        if (!selectedProjectId) { toast.error('Select a project'); return; }
                        try {
                          const res = await fetch(`/api/projects/${selectedProjectId}/button-sets`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: 'Preset', config: {}, isDefault: false }),
                          });
                          if (!res.ok) throw new Error(await res.text());
                          const j = await res.json();
                          const created = j?.set;
                          toast.success('Preset created');
                          setPresetSets((prev) => [...prev, created]);
                          setEditingPreset((prev) => ({ ...prev, [created.id]: { name: created.name || 'Preset', configText: JSON.stringify(created.config ?? {}, null, 2) } }));
                        } catch (e) {
                          toast.error('Failed to create preset');
                        }
                      }}
                    >
                      New
                    </Button>
                    <Button
                      variant="secondary"
                      className="text-xs"
                      onClick={async () => {
                        if (!selectedProjectId) { toast.error('Select a project'); return; }
                        const def = presetSets.find((s: any) => !!s.isDefault);
                        if (!def) { toast.error('No default preset found'); return; }
                        try {
                          const res = await fetch(`/api/projects/${selectedProjectId}/button-sets/${def.id}/duplicate`, { method: 'POST' });
                          if (!res.ok) throw new Error(await res.text());
                          const j = await res.json();
                          const created = j?.set;
                          toast.success('Duplicated');
                          setPresetSets((prev) => [...prev, created]);
                          setEditingPreset((prev) => ({ ...prev, [created.id]: { name: created.name || 'Preset', configText: JSON.stringify(created.config ?? {}, null, 2) } }));
                        } catch (e) {
                          toast.error('Failed to duplicate');
                        }
                      }}
                    >
                      Duplicate
                    </Button>
                  </div>
                </div>
              </div>

              {/* Presets list */}
              <div className="space-y-4">
                {presetsLoading && <div className="text-sm text-muted-foreground">Loading presets…</div>}
                {!presetsLoading && presetSets.length === 0 && selectedProjectId && (
                  <div className="text-sm text-muted-foreground">No presets yet.</div>
                )}
                {presetSets.map((s: any) => (
                  <div key={s.id} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingPreset[s.id]?.name || s.name || 'Preset'}
                          onChange={(e) => setEditingPreset((prev) => ({ ...prev, [s.id]: { ...(prev[s.id] || { name: s.name || 'Preset', configText: JSON.stringify(s.config ?? {}, null, 2) }), name: e.target.value } }))}
                          className="w-64"
                        />
                        {s.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">default</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const payloadName = editingPreset[s.id]?.name ?? s.name;
                          let payloadConfig: any = s.config ?? {};
                          const txt = editingPreset[s.id]?.configText;
                          if (typeof txt === 'string') {
                            try { payloadConfig = JSON.parse(txt); } catch { toast.error('Invalid JSON'); return; }
                          }
                          try {
                            const res = await fetch(`/api/projects/${selectedProjectId}/button-sets/${s.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: payloadName, config: payloadConfig })
                            });
                            if (!res.ok) throw new Error(await res.text());
                            const j = await res.json();
                            const updated = j?.set;
                            toast.success('Preset saved');
                            setPresetSets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                          } catch (e) {
                            toast.error('Failed to save preset');
                          }
                        }}
                      >
                        Save Preset
                      </Button>
                    </div>
                    <Textarea
                      rows={8}
                      value={editingPreset[s.id]?.configText ?? JSON.stringify(s.config ?? {}, null, 2)}
                      onChange={(e) => setEditingPreset((prev) => ({ ...prev, [s.id]: { ...(prev[s.id] || { name: s.name || 'Preset', configText: JSON.stringify(s.config ?? {}, null, 2) }), configText: e.target.value } }))}
                      placeholder="{}"
                    />

                    {/* Email preview for this preset */}
                    {(() => {
                      let btns: any[] = [];
                      let parsed: any = {};
                      try {
                        parsed = JSON.parse(editingPreset[s.id]?.configText ?? JSON.stringify(s.config ?? {}));
                        btns = Array.isArray(parsed?.buttons) ? parsed.buttons : (Array.isArray(parsed) ? parsed : []);
                      } catch { }
                      return (
                        <div className="mt-2 border rounded-md p-3 bg-white">
                          <div className="text-xs font-medium mb-1">Email Preview</div>
                          <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: '100%' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '8px 0' }}>
                                  {btns.filter((b: any) => b.enabled !== false).map((b: any, i: number) => (
                                    <table key={b.id || i} role="presentation" cellPadding={0} cellSpacing={0} style={{ display: 'inline-block', marginRight: 12 }}>
                                      <tbody>
                                        <tr>
                                          <td>
                                            <a
                                              href={b.href || '#'}
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                height: 40,
                                                padding: '0 12px',
                                                borderRadius: 9999,
                                                overflow: 'hidden',
                                                background:
                                                  `radial-gradient(120% 140% at 15% 15%, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.22) 38%, rgba(4,120,87,0.16) 62%, rgba(3,84,63,0.12) 100%), ` +
                                                  `linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%), ` +
                                                  `linear-gradient(135deg, ${(parsed?.theme?.primary || themePrimary)} 0%, ${(parsed?.theme?.primary || themePrimary)} 100%)`,
                                                border: `2px solid ${(parsed?.theme?.secondary || themeSecondary)}`,
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 24px rgba(15,118,110,0.35)',
                                                color: '#f1f5f9',
                                                fontSize: 14,
                                                fontFamily: 'Inter, Arial, sans-serif',
                                                fontWeight: 700,
                                                letterSpacing: 0.2,
                                                whiteSpace: 'nowrap',
                                                textDecoration: 'none'
                                              }}>
                                              {b.iconUrl ? (
                                                <img src={b.iconUrl} alt="" width={18} height={18} style={{ display: 'inline-block', verticalAlign: 'middle', border: '0' }} />
                                              ) : null}
                                              {b.label || 'Button'}
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
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Prompt Tab */}
        <TabsContent value="prompt">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Default Outreach Prompt</h3>
              <div className="text-xs text-muted-foreground">
                {promptUpdatedAt ? `Last updated: ${new Date(promptUpdatedAt).toLocaleString()}` : 'Not saved yet'}
              </div>
            </div>
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={14}
              placeholder="Write your default personalization prompt. It will be used unless overridden for a specific batch."
            />
            <div className="flex gap-2">
              <Button onClick={savePrompt}>Save Prompt</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
