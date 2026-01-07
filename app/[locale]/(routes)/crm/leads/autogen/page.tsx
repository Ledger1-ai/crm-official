"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, FileText, Settings, Sparkles, Wand2, Zap, Globe, Code, Loader2, Sliders } from "lucide-react";
import { toast } from "react-hot-toast";
import AIWriterModal from "../components/modals/AIWriterModal";

type WizardMode = "ai-only" | "step-by-step" | "advanced";

type WizardState = {
  name: string;
  description?: string;
  industries: string;
  companySizes: string;
  geos: string;
  techStack: string;
  titles: string;
  excludeDomains: string;
  notes?: string;
  maxCompanies: number;
  maxContactsPerCompany: number;
  serpFallback?: boolean; // Allow SERP to run only if AI finds 0 companies
  aiPrompt?: string; // For AI-only mode
};

export default function LeadGenWizardPage() {
  const router = useRouter();
  const [mode, setMode] = useState<WizardMode>("ai-only");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [aiWriterOpen, setAiWriterOpen] = useState(false);
  const [currentAiField, setCurrentAiField] = useState<keyof WizardState | null>(null);

  // Common State (Top Level)
  const [state, setState] = useState<WizardState>({
    name: "",
    description: "",
    industries: "",
    companySizes: "",
    geos: "",
    techStack: "",
    titles: "",
    excludeDomains: "",
    notes: "",
    maxCompanies: 100,
    maxContactsPerCompany: 3,
    serpFallback: true, // Default to true per plan
    aiPrompt: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setState((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleWriteAi = (field: keyof WizardState) => {
    setCurrentAiField(field);
    setAiWriterOpen(true);
  };

  const handleAiInsert = (text: string) => {
    if (currentAiField) {
      if (currentAiField === 'maxCompanies' || currentAiField === 'maxContactsPerCompany') {
        // ignore number fields
      } else {
        setState(prev => ({ ...prev, [currentAiField!]: text }));
      }
    } else {
      setState(prev => ({ ...prev, aiPrompt: text }));
    }
  };

  // --- Helper Components ---
  const AIInputLabel = ({ label, field, className }: { label: string, field: keyof WizardState, className?: string }) => (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <label className="text-sm font-medium text-foreground/90">{label}</label>
      <div className="flex gap-2 scale-90 origin-right">
        <button
          type="button"
          tabIndex={-1}
          className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          onClick={() => toast.success("Enhancing content... (Simulated)")}
        >
          <Zap className="w-3 h-3" /> Enhance AI
        </button>
      </div>
    </div>
  );

  const InputWithAI = ({ label, name, placeholder }: { label: string, name: keyof WizardState, placeholder?: string }) => (
    <div>
      <AIInputLabel label={label} field={name} />
      <input
        name={name}
        value={state[name] as string}
        onChange={onChange}
        className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
        placeholder={placeholder}
      />
    </div>
  );

  const TextAreaWithAI = ({ label, name, placeholder, rows = 3 }: { label: string, name: keyof WizardState, placeholder?: string, rows?: number }) => (
    <div>
      <AIInputLabel label={label} field={name} />
      <textarea
        name={name}
        value={state[name] as string}
        onChange={onChange}
        rows={rows}
        className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
        placeholder={placeholder}
      />
    </div>
  );

  const tags = (csv: string) =>
    csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name) {
      toast.error("Please enter a campaign name");
      return;
    }
    setSubmitting(true);

    try {
      // If in AI-only mode with a prompt, parse it first to populate fields
      if (mode === "ai-only" && state.aiPrompt && state.aiPrompt.trim().length > 0) {
        console.log("[AUTOGEN] AI-only mode detected, parsing prompt...");
        try {
          const parseRes = await fetch("/api/leads/parse-icp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: state.aiPrompt }),
          });

          if (parseRes.ok) {
            const parsed = await parseRes.json();

            const payload = {
              name: state.name || "AI Generated Pool",
              description: state.description,
              icp: {
                industries: parsed.industries || [],
                companySizes: parsed.companySizes || [],
                geos: parsed.geos || [],
                techStack: parsed.techStack || [],
                titles: parsed.titles || [],
                excludeDomains: tags(state.excludeDomains),
                notes: parsed.notes || state.aiPrompt,
              },
              providers: {
                agenticAI: true,
                serp: true,
                serpFallback: true, // Always true as requested
              },
              limits: {
                maxCompanies: state.maxCompanies,
                maxContactsPerCompany: state.maxContactsPerCompany,
              },
            };

            const res = await fetch("/api/leads/autogen", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            // Auto-trigger pipeline
            try {
              await fetch(`/api/leads/autogen/run/${data.jobId}`, { method: "POST" });
            } catch (err) { console.error(err); }

            toast.success("AI Agent started successfully!");
            router.push("/crm/leads/pools");
            return;
          }
        } catch (parseErr) {
          console.error("[AUTOGEN] AI parsing error:", parseErr);
        }
      }

      // Regular submission
      const payload = {
        name: state.name || "AI Generated Pool",
        description: state.description,
        icp: {
          industries: tags(state.industries),
          companySizes: tags(state.companySizes),
          geos: tags(state.geos),
          techStack: tags(state.techStack),
          titles: tags(state.titles),
          excludeDomains: tags(state.excludeDomains),
          notes: mode === "ai-only" ? state.aiPrompt : state.notes,
        },
        providers: {
          agenticAI: true,
          serp: true,
          serpFallback: !!state.serpFallback,
        },
        limits: {
          maxCompanies: state.maxCompanies,
          maxContactsPerCompany: state.maxContactsPerCompany,
        },
      };

      const res = await fetch("/api/leads/autogen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      try {
        await fetch(`/api/leads/autogen/run/${data.jobId}`, { method: "POST" });
      } catch (err) { console.error(err); }

      toast.success("Campaign started successfully!");
      router.push("/crm/leads/pools");

    } catch (err: any) {
      toast.error(err.message || "Failed to start job");
    } finally {
      setSubmitting(false);
    }
  };

  const navCards = [
    {
      id: "ai-only",
      title: "Full Auto AI",
      description: "Describe your ideal customer, and let AI do the rest.",
      icon: Bot,
      color: "from-indigo-500/20 to-purple-500/20",
      iconColor: "text-indigo-400",
    },
    {
      id: "step-by-step",
      title: "Guided Wizard",
      description: "Step-by-step setup for precise targeting.",
      icon: Wand2,
      color: "from-cyan-500/20 to-sky-500/20",
      iconColor: "text-cyan-400",
    },
    {
      id: "advanced",
      title: "Advanced Mode",
      description: "Full control over every parameter and setting.",
      icon: Sliders,
      color: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
    },
  ];

  const renderTopConfiguration = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="md:col-span-2 relative group overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-sm transition-all hover:bg-white/10">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block">
          Campaign Name (Pool)
        </label>
        <input
          name="name"
          value={state.name}
          onChange={onChange}
          className="w-full bg-transparent border-none text-lg font-medium placeholder:text-muted-foreground/50 focus:ring-0 px-0"
          placeholder="e.g. Q1 SaaS Outreach Campaign..."
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent to-background/10" />
      </div>

      <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-sm transition-all hover:bg-white/10">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5 block">
          Leads Limit (Max 100)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="maxCompanies"
            value={state.maxCompanies}
            onChange={onChange}
            className="w-full bg-transparent border-none text-lg font-medium focus:ring-0 px-0"
            min={1}
            max={100}
          />
          <div className="text-xs text-muted-foreground whitespace-nowrap">companies</div>
        </div>
      </div>
    </div>
  );

  const renderModeSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {navCards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => { setMode(card.id as WizardMode); if (card.id === 'step-by-step') setStep(1); }}
          className={`group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] text-left ${mode === card.id
            ? "border-primary/50 bg-white/10 ring-2 ring-primary/30"
            : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
        >
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} ${mode === card.id ? 'opacity-100' : 'opacity-10 group-hover:opacity-60'} transition-opacity duration-300`} />

          <div className="relative z-10 flex flex-col items-start gap-4">
            <div className={`p-2.5 rounded-lg bg-gradient-to-br ${card.color} border border-white/10 shadow-lg ${card.iconColor} ring-1 ring-white/10`}>
              <card.icon className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <span className={`block text-base font-semibold transition-colors ${mode === card.id ? 'text-white' : 'text-foreground group-hover:text-white'}`}>
                {card.title}
              </span>
              <span className={`block text-xs mt-1 transition-colors ${mode === card.id ? 'text-white/80' : 'text-muted-foreground group-hover:text-white/80'}`}>
                {card.description}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  const renderAIOnlyMode = () => (
    <div className="space-y-6">
      <div className="relative group rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-1 backdrop-blur-xl shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />

        <div className="bg-card/40 rounded-xl p-5 min-h-[140px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Agent Instructions
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                onClick={() => toast.success("Enhancement triggered (simulated)")}
              >
                <Zap className="w-3.5 h-3.5" /> Enhance AI
              </button>
              <button
                type="button"
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20"
                onClick={() => { setCurrentAiField(null); setAiWriterOpen(true); }}
              >
                <Wand2 className="w-3.5 h-3.5" /> Write AI
              </button>
            </div>
          </div>

          <textarea
            name="aiPrompt"
            value={state.aiPrompt}
            onChange={onChange}
            className="w-full flex-1 bg-transparent border-none resize-none focus:ring-0 text-base leading-relaxed placeholder:text-muted-foreground/30 min-h-[100px]"
            placeholder="Describe your ideal customer profile in detail. For example: 'I'm looking for B2B SaaS companies in the US with 50-200 employees that use HubSpot and Stripe. They should be in the Fintech or Healthcare sectors...'"
          />
        </div>
      </div>

      <div className="flex justify-end p-2">
        <button
          type="submit"
          disabled={submitting || !state.name || (mode === 'ai-only' && !state.aiPrompt)}
          className="group relative px-8 py-4 rounded-xl font-semibold text-white shadow-2xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 w-full md:w-auto"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient" />
          <span className="relative flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
            {submitting ? "Deploying Agent..." : "Launch AI Agent"}
          </span>
        </button>
      </div>
    </div>
  );

  const renderStepByStep = () => {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-card/10 p-6 backdrop-blur-xl shadow-2xl">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400"><FileText className="w-5 h-5" /></div>
                <h3 className="text-lg font-semibold">Campaign Details</h3>
              </div>

              <TextAreaWithAI label="Description" name="description" placeholder="e.g. We are targeting B2B SaaS companies..." rows={4} />

              <div className="flex justify-end pt-4">
                <button type="button" onClick={() => setStep(2)} className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">Next Step</button>
              </div>
            </div>
          )}
          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400"><Globe className="w-5 h-5" /></div>
                <h3 className="text-lg font-semibold">Targeting</h3>
              </div>

              <div className="grid gap-6">
                <InputWithAI label="Industries" name="industries" placeholder="e.g. SaaS, Fintech, Healthcare" />
                <InputWithAI label="Locations" name="geos" placeholder="e.g. United States, Canada, UK" />
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-2.5 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">Back</button>
                <button type="button" onClick={() => setStep(3)} className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">Next Step</button>
              </div>
            </div>
          )}
          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400"><Code className="w-5 h-5" /></div>
                <h3 className="text-lg font-semibold">Roles & Tech</h3>
              </div>

              <div className="grid gap-6">
                <InputWithAI label="Job Titles" name="titles" placeholder="e.g. CEO, CTO, VP Sales" />
                <InputWithAI label="Tech Stack" name="techStack" placeholder="e.g. HubSpot, Salesforce, AWS" />
              </div>

              <div className="flex justify-between pt-4">
                <button type="button" onClick={() => setStep(2)} className="px-6 py-2.5 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">Back</button>
                <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all">
                  {submitting ? "Launching..." : "Launch Campaign"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAdvancedMode = () => (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-card/10 p-6 backdrop-blur-xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Full Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputWithAI label="Industries" name="industries" />
          <InputWithAI label="Locations" name="geos" />
          <InputWithAI label="Job Titles" name="titles" />
          <InputWithAI label="Tech Stack" name="techStack" />
          <InputWithAI label="Company Sizes" name="companySizes" />
          <InputWithAI label="Exclude Domains" name="excludeDomains" />
        </div>

        <div className="pt-2">
          <TextAreaWithAI label="Additional Notes" name="notes" placeholder="Any specific requirements..." />
        </div>

        <div className="pt-4 flex items-center gap-3">
          <input
            id="serpFallback_adv"
            type="checkbox"
            checked={!!state.serpFallback}
            onChange={(e) => setState((prev) => ({ ...prev, serpFallback: e.target.checked }))}
            className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary w-4 h-4"
          />
          <label htmlFor="serpFallback_adv" className="text-sm text-muted-foreground select-none cursor-pointer">
            Allow SERP fallback if AI finds 0 companies (Recommended)
          </label>
        </div>
      </div>

      <div className="flex justify-end p-2">
        <button
          type="submit"
          disabled={submitting}
          className="group relative px-8 py-4 rounded-xl font-semibold text-white shadow-2xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 w-full md:w-auto"
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-zinc-600 via-slate-600 to-zinc-600 bg-[length:200%_auto] animate-gradient" />
          <span className="relative flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {submitting ? "Starting..." : "Start Campaign"}
          </span>
        </button>
      </div>
    </div>
  );

  // Icon for fallback
  const Play = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            AI Lead Generation
          </h1>
          <p className="text-muted-foreground text-lg">
            Deploy autonomous agents to find, qualify, and engage your ideal customers.
          </p>
        </div>

        <form onSubmit={onSubmit}>
          {renderTopConfiguration()}

          {renderModeSelector()}

          <div className="relative">
            {mode === "ai-only" && renderAIOnlyMode()}
            {mode === "step-by-step" && renderStepByStep()}
            {mode === "advanced" && renderAdvancedMode()}
          </div>
        </form>
      </div>

      <AIWriterModal
        isOpen={aiWriterOpen}
        onClose={() => { setAiWriterOpen(false); setCurrentAiField(null); }}
        onInsert={handleAiInsert}
      />
    </div>
  );
}
