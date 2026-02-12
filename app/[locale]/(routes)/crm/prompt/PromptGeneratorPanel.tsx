"use client";

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'react-hot-toast';
import CustomCCP from '@/components/voice/CustomCCP';
import { usePermission } from '@/components/providers/permissions-provider';
import { useSession } from 'next-auth/react';
import { Shield } from 'lucide-react';

type RolePreset = {
  key: string;
  label: string;
  description: string;
};

const ROLE_PRESETS: RolePreset[] = [
  { key: 'sales_agent', label: 'Sales Agent', description: 'Persuasive, helpful, discovery-first, objection-handling.' },
  { key: 'solutions_architect', label: 'Solutions Architect', description: 'Technical scoping, constraints, roadmap and feasibility.' },
  { key: 'account_manager', label: 'Account Manager', description: 'Relationship-focused, renewal-driven, service-oriented.' },
  { key: 'support_specialist', label: 'Support Specialist', description: 'Diagnostic, troubleshooting, clear step-by-step guidance.' },
  { key: 'custom', label: 'Custom Role', description: 'Define your own role name and behaviors.' },
];

function buildPrompt(opts: {
  projectName: string;
  projectContext: string;
  projectNotes: string;
  leadName: string;
  leadTitle: string;
  leadCompany: string;
  leadEmail: string;
  leadPhone: string;
  roleKey: string;
  customRoleName: string;
  roleNotes: string;
  language: string;
}) {
  const now = new Date().toLocaleString();
  const roleName =
    opts.roleKey === 'custom'
      ? (opts.customRoleName || 'Custom Role')
      : (ROLE_PRESETS.find(r => r.key === opts.roleKey)?.label || 'Agent');
  const roleDesc =
    opts.roleKey === 'custom'
      ? (opts.roleNotes || '')
      : (ROLE_PRESETS.find(r => r.key === opts.roleKey)?.description || '');

  return [
    `System Prompt — Generated ${now}`,
    ``,
    `Role: ${roleName}`,
    roleDesc ? `Role Profile: ${roleDesc}` : ``,
    opts.language ? `Primary Language: ${opts.language}` : ``,
    ``,
    `Project`,
    `- Name: ${opts.projectName || '(unknown project)'}`,
    `- Context: ${opts.projectContext || ''}`,
    `- Notes: ${opts.projectNotes || ''}`,
    ``,
    `Lead`,
    `- Name: ${opts.leadName || ''}`,
    `- Title: ${opts.leadTitle || ''}`,
    `- Company: ${opts.leadCompany || ''}`,
    `- Email: ${opts.leadEmail || ''}`,
    `- Phone: ${opts.leadPhone || ''}`,
    ``,
    `Operational Guidance`,
    `- Always confirm the latest assigned language before speaking.`,
    `- Keep responses concise and structured; use numbered/bulleted steps where helpful.`,
    `- Ask clarifying questions to confirm understanding before proposing solutions.`,
    `- Avoid sharing internal system details or secrets; follow company policies.`,
    ``,
    `Conversation Objectives`,
    `- Build rapport and value alignment for ${opts.projectName || 'the project'}.`,
    `- Qualify needs and constraints; offer next steps or scheduling.`,
    `- If requested, draft a follow-up email or summary with action items.`,
    `- Generated via Prompt Generator Module`,
  ].filter(Boolean).join('\n');
}

export default function PromptGeneratorPanel({ embedded = false, showSoftphone = true }: { embedded?: boolean; showSoftphone?: boolean }) {
  const [projectName, setProjectName] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadTitle, setLeadTitle] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [roleKey, setRoleKey] = useState<RolePreset['key']>('sales_agent');
  const [customRoleName, setCustomRoleName] = useState('');
  const [roleNotes, setRoleNotes] = useState('');
  const [language, setLanguage] = useState('English');
  const [wallet, setWallet] = useState('');
  const [prompt, setPrompt] = useState('');

  const { hasAccess, isSuperAdmin } = usePermission();
  const { data: session } = useSession();

  const generated = useMemo(
    () =>
      buildPrompt({
        projectName,
        projectContext,
        projectNotes,
        leadName,
        leadTitle,
        leadCompany,
        leadEmail,
        leadPhone,
        roleKey,
        customRoleName,
        roleNotes,
        language,
      }),
    [
      projectName,
      projectContext,
      projectNotes,
      leadName,
      leadTitle,
      leadCompany,
      leadEmail,
      leadPhone,
      roleKey,
      customRoleName,
      roleNotes,
      language,
    ],
  );

  async function handleGenerate() {
    try {
      setPrompt(generated);
      toast.success('Prompt generated');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to generate prompt');
    }
  }

  async function handlePushToVoiceHub() {
    try {
      const w = (wallet || '').trim().toLowerCase();
      if (!w) {
        toast.error('Enter wallet address to push to VoiceHub');
        return;
      }
      const body = { prompt: prompt || generated, meta: { projectName, leadCompany, roleKey, language } };
      const res = await fetch('/api/crm/prompt/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet': w },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `VoiceHub push failed (${res.status})`);
      }
      toast.success('Prompt pushed to VoiceHub');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to push prompt');
    }
  }

  // 1. Module Level Gate
  const isAdmin = (session?.user as any)?.isAdmin === true;

  if (!isAdmin && !isSuperAdmin && !hasAccess('ai_lab') && !hasAccess('ai_lab.prompt_generator')) {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[200px] space-y-2">
        <Shield className="h-8 w-8 text-red-500/50 mb-2" />
        <p className="text-sm font-semibold text-foreground">Access Restricted</p>
        <p className="text-xs">You do not have permission to access the Prompt Generator.</p>
      </div>
    );
  }

  return (
    <div className={embedded ? "w-full px-1 py-2 space-y-4" : "max-w-6xl mx-auto px-4 py-6 space-y-6"}>
      {!embedded && (
        <>
          <h1 className="text-2xl md:text-3xl font-bold">Prompt Generator</h1>
          <p className="text-sm text-muted-foreground">
            Build a comprehensive System Prompt using lead and project context. Choose a role preset or define your own, then generate and push to VoiceHub.
          </p>
        </>
      )}

      {/* Context inputs */}
      <section className="rounded-md border bg-card p-4">
        <h2 className="text-lg font-semibold mb-2">Project</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Project Name</label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g., BasaltCRM onboarding" />
          </div>
          <div>
            <label className="text-xs font-medium">Primary Language</label>
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g., English" />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium">Project Context</label>
          <Textarea rows={3} value={projectContext} onChange={(e) => setProjectContext(e.target.value)} placeholder="Background, goals, constraints..." />
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium">Project Notes</label>
          <Textarea rows={3} value={projectNotes} onChange={(e) => setProjectNotes(e.target.value)} placeholder="Any additional information for the agent..." />
        </div>
      </section>

      <section className="rounded-md border bg-card p-4">
        <h2 className="text-lg font-semibold mb-2">Lead</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Lead Name</label>
            <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="e.g., Jane Doe" />
          </div>
          <div>
            <label className="text-xs font-medium">Title</label>
            <Input value={leadTitle} onChange={(e) => setLeadTitle(e.target.value)} placeholder="e.g., Director of Operations" />
          </div>
          <div>
            <label className="text-xs font-medium">Company</label>
            <Input value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} placeholder="e.g., Acme Corp" />
          </div>
          <div>
            <label className="text-xs font-medium">Email</label>
            <Input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="e.g., jane@acme.com" />
          </div>
          <div>
            <label className="text-xs font-medium">Phone</label>
            <Input value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} placeholder="e.g., +15551234567" />
          </div>
        </div>
      </section>

      {/* Role selection */}
      <section className="rounded-md border bg-card p-4 max-w-md">
        <h2 className="text-lg font-semibold mb-2">Role</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Preset</label>
            <Select
              value={roleKey}
              onValueChange={(val) => setRoleKey(val as RolePreset['key'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_PRESETS.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="microtext text-muted-foreground mt-2 px-1">
              {(ROLE_PRESETS.find(r => r.key === roleKey)?.description) || ''}
            </div>
          </div>
          {roleKey === 'custom' && (
            <>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Custom Role Name</label>
                <Input value={customRoleName} onChange={(e) => setCustomRoleName(e.target.value)} placeholder="e.g., Enterprise Advisor" />
              </div>
              <div className="">
                <label className="text-xs font-medium mb-1.5 block">Custom Role Notes</label>
                <Textarea rows={3} value={roleNotes} onChange={(e) => setRoleNotes(e.target.value)} placeholder="Define behaviors, tone, and goals..." />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Actions */}
      <section className="rounded-md border bg-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
          {hasAccess('ai_lab.actions.generate') && (
            <Button onClick={handleGenerate} className="w-full sm:w-auto">Generate Prompt</Button>
          )}

          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto min-w-[200px]">
            <span className="text-xs font-medium whitespace-nowrap">Wallet</span>
            <Input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className="flex-1 min-w-0"
            />
          </div>

          {hasAccess('ai_lab.actions.push_voicehub') && (
            <Button variant="outline" onClick={handlePushToVoiceHub} className="w-full sm:w-auto">
              Push to VoiceHub
            </Button>
          )}
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium mb-1.5 block">Generated Prompt</label>
          <Textarea
            rows={10}
            value={prompt || generated}
            onChange={(e) => setPrompt(e.target.value)}
            className="font-mono text-sm bg-muted/30"
          />
        </div>
      </section>

      {showSoftphone && (
        <>
          {/* Connect CCP Softphone (optional visibility) */}
          <section className="rounded-md border bg-card p-4">
            <h2 className="text-sm font-semibold mb-2">Softphone</h2>
            <CustomCCP title="Connect Softphone" subtitle="Custom CCP (theme-aligned)" dialerLeft />
            <div className="microtext text-muted-foreground mt-2">
              This uses the unified Custom CCP. The Prompt Generator works independently of the dialing backend.
            </div>
          </section>
        </>
      )}
    </div>
  );
}
