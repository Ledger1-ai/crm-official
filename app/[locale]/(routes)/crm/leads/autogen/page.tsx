"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, FileText, Settings, Sparkles, CheckCircle, Building2, Globe, Code, Users, Target, Loader2 } from "lucide-react";

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
  aiPrompt?: string; // For AI-only mode
};

export default function LeadGenWizardPage() {
  const router = useRouter();
  const [mode, setMode] = useState<WizardMode>("ai-only");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{ poolId: string; jobId: string } | null>(null);

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

  const tags = (csv: string) =>
    csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    
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
            console.log("[AUTOGEN] Parsing successful:", parsed);
            
            // Populate form fields with AI-generated data (for visual feedback if they switch to Advanced)
            setState((prev) => ({
              ...prev,
              industries: parsed.industries?.join(", ") || prev.industries,
              companySizes: parsed.companySizes?.join(", ") || prev.companySizes,
              geos: parsed.geos?.join(", ") || prev.geos,
              techStack: parsed.techStack?.join(", ") || prev.techStack,
              titles: parsed.titles?.join(", ") || prev.titles,
              notes: parsed.notes || prev.notes,
            }));

            // Use parsed data for payload
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
              limits: {
                maxCompanies: state.maxCompanies,
                maxContactsPerCompany: state.maxContactsPerCompany,
              },
            };

            console.log("[AUTOGEN] Creating job with payload:", payload);

            const res = await fetch("/api/leads/autogen", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const text = await res.text();
              console.error("[AUTOGEN] Job creation failed:", text);
              throw new Error(text || "Failed to start job");
            }
            const data = await res.json();
            console.log("[AUTOGEN] Job created:", data);
            setResult(data);
            
            // Auto-trigger pipeline
            console.log("[AUTOGEN] Triggering pipeline for job:", data.jobId);
            try {
              const runRes = await fetch(`/api/leads/autogen/run/${data.jobId}`, { method: "POST" });
              console.log("[AUTOGEN] Pipeline triggered, status:", runRes.status);
            } catch (_err) {
              console.error("[AUTOGEN] Pipeline trigger failed:", _err);
              // ignore - user can manually trigger
            }
            return;
          } else {
            console.error("[AUTOGEN] Parse failed with status:", parseRes.status);
          }
        } catch (parseErr) {
          console.error("[AUTOGEN] AI parsing error:", parseErr);
          // Fall through to regular submission
        }
      }

      // Regular submission for non-AI-only mode or if parsing failed
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

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to start job");
      }
      const data = await res.json();
      setResult(data);
      
      // Auto-trigger pipeline
      try {
        await fetch(`/api/leads/autogen/run/${data.jobId}`, { method: "POST" });
      } catch (_err) {
        // ignore
      }
    } catch (err: any) {
      alert(err.message || "Failed to start job");
    } finally {
      setSubmitting(false);
    }
  };

  const renderModeSelector = () => (
    <div className="flex flex-wrap gap-3 mb-6">
      <button
        type="button"
        onClick={() => setMode("ai-only")}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          mode === "ai-only"
            ? "bg-primary text-primary-foreground shadow-lg"
            : "border hover:bg-accent"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        AI Only
      </button>
      <button
        type="button"
        onClick={() => { setMode("step-by-step"); setStep(1); }}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          mode === "step-by-step"
            ? "bg-primary text-primary-foreground shadow-lg"
            : "border hover:bg-accent"
        }`}
      >
        <FileText className="w-4 h-4" />
        Step-by-Step
      </button>
      <button
        type="button"
        onClick={() => setMode("advanced")}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          mode === "advanced"
            ? "bg-primary text-primary-foreground shadow-lg"
            : "border hover:bg-accent"
        }`}
      >
        <Settings className="w-4 h-4" />
        Advanced
      </button>
    </div>
  );

  const renderProgressBar = () => {
    if (mode !== "step-by-step") return null;
    
    const steps = [
      { num: 1, label: "Basic Info", icon: FileText },
      { num: 2, label: "Industry & Geo", icon: Globe },
      { num: 3, label: "Tech & Roles", icon: Code },
      { num: 4, label: "Settings", icon: Target }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isComplete = step > s.num;
            
            return (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isComplete
                        ? "bg-primary border-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-2 text-center ${isActive ? "font-semibold" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all ${
                      step > s.num ? "bg-primary" : "bg-muted-foreground/20"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAIOnlyMode = () => (
    <div className="space-y-6">
      <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Tell the AI What You Need</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Describe your target customers in natural language. AI will automatically analyze your prompt and complete all form fields when you click "Start AI Agent".
        </p>
        <textarea
          name="aiPrompt"
          value={state.aiPrompt}
          onChange={onChange}
          className="w-full rounded-lg border-2 p-4 text-base min-h-[200px]"
          placeholder={`Example: "I need to find restaurants in New Mexico" - AI will intelligently determine industries, geos, titles, company sizes, tech stack, and more!`}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Pool Name</label>
          <input
            name="name"
            value={state.name}
            onChange={onChange}
            className="w-full rounded border p-3"
            placeholder="e.g., Q1 2025 Campaign"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Max Companies</label>
          <input
            type="number"
            name="maxCompanies"
            value={state.maxCompanies}
            onChange={onChange}
            className="w-full rounded border p-3"
            min={1}
            max={500}
          />
        </div>
      </div>

    </div>
  );

  const renderStepByStep = () => {
    switch (step) {
      case 1:
        return (
        <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Step 1: Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Campaign Name *</label>
                  <input
                    name="name"
                    value={state.name}
                    onChange={onChange}
                    className="w-full rounded border p-3 text-base"
                    placeholder="e.g., Q1 2025 SaaS Outreach"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <input
                    name="description"
                    value={state.description}
                    onChange={onChange}
                    className="w-full rounded border p-3 text-base"
                    placeholder="What is this campaign for?"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <div></div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
              >
                Next: Target Industry →
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Step 2: Target Industry & Geography</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Industries *</label>
                  <input
                    name="industries"
                    value={state.industries}
                    onChange={onChange}
                    className="w-full rounded border p-3 text-base"
                    placeholder="SaaS, Fintech, E-commerce, Healthcare"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Separate multiple with commas</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Geographies *</label>
                  <input
                    name="geos"
                    value={state.geos}
                    onChange={onChange}
                    className="w-full rounded border p-3 text-base"
                    placeholder="United States, United Kingdom, Germany"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Separate multiple with commas</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border-2 rounded-lg font-medium"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
              >
                Next: Tech & Roles →
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Step 3: Technology & Target Roles</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tech Stack</label>
                  <input
                    name="techStack"
                    value={state.techStack}
                    onChange={onChange}
                    className="w-full rounded border p-3 text-base"
                    placeholder="React, AWS, Shopify, Stripe"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Technologies they use</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Target Job Titles *</label>
                  <input
                    name="titles"
                    value={state.titles}
                    onChange={onChange}
                    className="w-full rounded border p-3 text-base"
                    placeholder="CEO, CTO, VP Engineering, Head of Sales"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Who you want to reach</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Sizes</label>
                  <input
                    name="companySizes"
                    value={state.companySizes}
                    onChange={onChange}
                    className="w-full rounded border p-3 text-base"
                    placeholder="10-50, 50-200, 200-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 border-2 rounded-lg font-medium"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
              >
                Next: Settings →
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Step 4: Additional Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={state.notes}
                    onChange={onChange}
                    className="w-full rounded border p-3 text-base"
                    placeholder="Any special requirements for the AI..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Exclude Domains</label>
                  <input
                    name="excludeDomains"
                    value={state.excludeDomains}
                    onChange={onChange}
                    className="w-full rounded border p-3 text-base"
                    placeholder="competitor.com, existing-customer.com"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Companies</label>
                    <input
                      type="number"
                      name="maxCompanies"
                      value={state.maxCompanies}
                      onChange={onChange}
                      className="w-full rounded border p-3 text-base"
                      min={1}
                      max={500}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Contacts/Company</label>
                    <input
                      type="number"
                      name="maxContactsPerCompany"
                      value={state.maxContactsPerCompany}
                      onChange={onChange}
                      className="w-full rounded border p-3 text-base"
                      min={1}
                      max={20}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 border-2 rounded-lg font-medium"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 hover:shadow-lg"
              >
                {submitting ? "🤖 Launching AI..." : "🚀 Start Generation"}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderAdvancedMode = () => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="space-y-6 pb-20">
      <div className="border rounded-lg p-4 sm:p-6 space-y-4 bg-muted/30">
        <h2 className="text-lg font-semibold">Pool Information</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pool Name *</label>
            <input
              name="name"
              value={state.name}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              placeholder="e.g., Q1 2025 Campaign"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              name="description"
              value={state.description}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              placeholder="Campaign description"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 sm:p-6 space-y-4 bg-blue-50 dark:bg-blue-950/30">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          <h2 className="text-lg font-semibold">ICP Criteria</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Industries (comma-separated)</label>
            <input
              name="industries"
              value={state.industries}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              placeholder="SaaS, Fintech, E-commerce"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Geographies (comma-separated)</label>
            <input
              name="geos"
              value={state.geos}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              placeholder="United States, UK, Canada"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tech Stack (comma-separated)</label>
            <input
              name="techStack"
              value={state.techStack}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              placeholder="React, AWS, Stripe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Target Titles (comma-separated)</label>
            <input
              name="titles"
              value={state.titles}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              placeholder="CEO, CTO, VP Engineering"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Company Sizes (comma-separated)</label>
            <input
              name="companySizes"
              value={state.companySizes}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              placeholder="10-50, 50-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Exclude Domains</label>
            <input
              name="excludeDomains"
              value={state.excludeDomains}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              placeholder="competitor.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Additional Notes</label>
            <textarea
              name="notes"
              value={state.notes}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              placeholder="Special requirements..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold">Limits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Max Companies</label>
            <input
              type="number"
              name="maxCompanies"
              value={state.maxCompanies}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              min={1}
              max={500}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Contacts/Company</label>
            <input
              type="number"
              name="maxContactsPerCompany"
              value={state.maxContactsPerCompany}
              onChange={onChange}
              className="w-full rounded border p-3 text-base"
              min={1}
              max={20}
            />
          </div>
        </div>
      </div>

      {/* Submit buttons inside scroll area for advanced mode */}
      <div className="flex flex-wrap gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 sm:flex-none rounded bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI Agent Working...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Start AI Agent
            </>
          )}
        </button>
        <button
          type="button"
          className="rounded border px-4 py-2 hover:bg-accent transition-all"
          onClick={() => router.push("/crm/leads/pools")}
        >
          View Pools
        </button>
      </div>

      <div className="bg-card border rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4" />
          <p className="text-sm font-semibold">Autonomous AI Agent</p>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>✓ Searches intelligently for companies</li>
          <li>✓ Visits websites and extracts all data</li>
          <li>✓ Finds contacts (emails, phones, LinkedIn)</li>
          <li>✓ Qualifies based on your ICP</li>
          <li>✓ Refines strategy if needed</li>
          <li>✓ Works completely autonomously</li>
        </ul>
      </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">AI Lead Generation</h1>
          <p className="text-sm text-muted-foreground">
            Autonomous AI agent finds, qualifies, and extracts contacts from your ideal customers.
          </p>
        </div>

        {renderModeSelector()}
        {renderProgressBar()}

        <form onSubmit={onSubmit} className="space-y-6">
          {mode === "ai-only" && renderAIOnlyMode()}
          {mode === "step-by-step" && renderStepByStep()}
          {mode === "advanced" && renderAdvancedMode()}

          {mode !== "step-by-step" && (
            <div className="flex flex-wrap gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none rounded bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI Agent Working...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start AI Agent
                  </>
                )}
              </button>
              <button
                type="button"
                className="rounded border px-4 py-2 hover:bg-accent transition-all"
                onClick={() => router.push("/crm/leads/pools")}
              >
                View Pools
              </button>
            </div>
          )}

          <div className="bg-card border rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4" />
              <p className="text-sm font-semibold">Autonomous AI Agent</p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Searches intelligently for companies</li>
              <li>✓ Visits websites and extracts all data</li>
              <li>✓ Finds contacts (emails, phones, LinkedIn)</li>
              <li>✓ Qualifies based on your ICP</li>
              <li>✓ Refines strategy if needed</li>
              <li>✓ Works completely autonomously</li>
            </ul>
          </div>
        </form>

        {result && (
          <div className="border bg-card rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-3">✓ Job Started Successfully!</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Pool ID:</span> {result.poolId}</p>
              <p><span className="font-medium">Job ID:</span> {result.jobId}</p>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                className="rounded bg-primary px-4 py-2 text-primary-foreground"
                onClick={() => router.push(`/crm/leads/jobs/${result.jobId}`)}
              >
                Monitor Progress
              </button>
              <button
                className="rounded border px-4 py-2"
                onClick={() => router.push(`/crm/leads/pools/${result.poolId}`)}
              >
                Go to Pool
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
