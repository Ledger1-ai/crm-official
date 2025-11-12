"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import VoiceDuoWaveVisualizer from "@/components/voice/VoiceDuoWaveVisualizer";

type WizardState = {
  name: string;
  description?: string;
  industries: string;
  companySizes: string;
  geos: string;
  techStack: string;
  titles: string;
  languages: string;
  excludeDomains: string;
  notes?: string;
  serp: boolean;
  crawler: boolean;
  enrichment: boolean;
  emailDiscovery: boolean;
  verification: boolean;
  maxCompanies: number;
  maxContactsPerCompany: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
};

/**
 * LeadgenVoiceAgentModal
 *
 * Integrates Azure OpenAI Realtime Voice over WebRTC to guide users through the Lead Generation Wizard.
 * The agent runs a structured process using sequential tool calls, mediated via human-in-the-loop modals.
 *
 * Flow:
 * - User opens the modal and activates the Voice Agent
 * - Agent greets user and asks readiness to fill out the Lead Generation Wizard
 * - If ready, agent proceeds through sections with sequential tool calls:
 *   1) Basic Info (name, description)
 *   2) ICP (industries, companySizes, geos, techStack, titles, languages, excludeDomains, notes)
 *   3) Providers (serp, crawler, enrichment, emailDiscovery, verification)
 *   4) Limits (maxCompanies, maxContactsPerCompany)
 * - For each tool call, the agent proposes values; UI displays proposed changes and asks user to confirm.
 * - On confirmation, the client updates the wizard form state and returns tool_output to the agent.
 * - Agent determines when a section interaction is complete and proceeds to next.
 *
 * NOTE: This component sets up:
 * - RTCPeerConnection
 * - Local mic capture
 * - Remote audio playback
 * - DataChannel for Realtime events & tool calls
 * - Session update with instructions and tool definitions
 * - Response.create to begin the guided conversation
 */
export default function LeadgenVoiceAgentModal({ open, onOpenChange, state, setState }: Props) {
  const [agentActive, setAgentActive] = useState(false);
  const [agentReady, setAgentReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Timestamp of last detected tool call (for watchdog/reprompt logic)
  const lastToolCallAt = useRef<number>(0);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [activeInput, setActiveInput] = useState<{ field: string; value: string; callId: string } | null>(null);

  // Current pending tool call in UI (human-in-the-loop)
  const [pendingTool, setPendingTool] = useState<{
    callId: string;
    name: string;
    args: any;
    proposedChanges?: Array<{ field: string; value: any }>;
    section?: string;
  } | null>(null);
  const [pendingTools, setPendingTools] = useState<Array<{ callId: string; name: string; args: any; proposedChanges?: Array<{ field: string; value: any }>; section?: string }>>([]);
  // Per-field pending confirmations: value proposed by agent but not yet confirmed
  const [pendingFields, setPendingFields] = useState<Record<string, { callId: string; name: string; value: any; prevValue: any; status: "pending" | "confirmed"; confirmedAt?: number }>>({});

  // Field normalization to canonical wizard keys
  const FIELD_ALIASES: Record<string, keyof WizardState> = {
    name: "name",
    description: "description",
    industries: "industries",
    companySizes: "companySizes",
    company_sizes: "companySizes",
    geos: "geos",
    geographies: "geos",
    geo: "geos",
    techStack: "techStack",
    tech_stack: "techStack",
    titles: "titles",
    languages: "languages",
    excludeDomains: "excludeDomains",
    exclude_domains: "excludeDomains",
    notes: "notes",
    serp: "serp",
    crawler: "crawler",
    enrichment: "enrichment",
    emailDiscovery: "emailDiscovery",
    email_discovery: "emailDiscovery",
    verification: "verification",
    maxCompanies: "maxCompanies",
    max_companies: "maxCompanies",
    maxContactsPerCompany: "maxContactsPerCompany",
    max_contacts_per_company: "maxContactsPerCompany",
  };

  const normalizeField = (name: string): keyof WizardState | null => {
    const key = FIELD_ALIASES[String(name || "").trim()];
    return key || null;
  };

  const normalizeChanges = (
    changes: Array<{ field: string; value: any }>
  ): Array<{ field: keyof WizardState; value: any }> => {
    return changes
      .map((c) => {
        const k = normalizeField(c.field);
        if (!k) return null;
        return { field: k, value: c.value };
      })
      .filter(Boolean) as Array<{ field: keyof WizardState; value: any }>;
  };

  const tools = useMemo(
    () => [
      // Specialized tools per field with exact typing and purpose
      {
        type: "function",
        function: {
          name: "set_name",
          description: "Set the Lead Pool Name. This is a short, human-readable label for the run (e.g., 'DACH Fintech - Data Leaders').",
          parameters: { type: "object", properties: { value: { type: "string" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_description",
          description: "Set the optional description. This is a longer sentence describing the objective of the run.",
          parameters: { type: "object", properties: { value: { type: "string" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_industries",
          description: "Set Industries (comma-separated). These guide the search to target company verticals, e.g., 'fintech, logistics, ecommerce'.",
          parameters: { type: "object", properties: { value: { type: "string", description: "Comma-separated list" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_companySizes",
          description: "Set Company Sizes (comma-separated). Typical buckets: '1-10, 11-50, 51-200, 200-1000, 1000+'.",
          parameters: { type: "object", properties: { value: { type: "string", description: "Comma-separated list" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_geos",
          description: "Set Geographies (comma-separated). Regions or countries, e.g., 'US, UK, DACH, EU'.",
          parameters: { type: "object", properties: { value: { type: "string", description: "Comma-separated list" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_techStack",
          description: "Set Tech Stack (comma-separated). Technologies used by targets, e.g., 'Shopify, WooCommerce, React, Node.js'.",
          parameters: { type: "object", properties: { value: { type: "string", description: "Comma-separated list" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_titles",
          description: "Set Target Titles/Roles (comma-separated). Roles to contact, e.g., 'Head of Operations, Director of Data'.",
          parameters: { type: "object", properties: { value: { type: "string", description: "Comma-separated list" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_languages",
          description: "Set Preferred Languages (comma-separated). Language codes or names, e.g., 'en, de, fr'.",
          parameters: { type: "object", properties: { value: { type: "string", description: "Comma-separated list" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_excludeDomains",
          description: "Set Exclude Domains (comma-separated). Domains to ignore, e.g., 'competitor.com, existingcustomer.com'.",
          parameters: { type: "object", properties: { value: { type: "string", description: "Comma-separated list" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_notes",
          description: "Set Notes. Freeform guidance for the search and scraping pipeline.",
          parameters: { type: "object", properties: { value: { type: "string" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_serp",
          description: "Toggle Use Search API provider.",
          parameters: { type: "object", properties: { value: { type: "boolean" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_crawler",
          description: "Toggle Website Crawl provider.",
          parameters: { type: "object", properties: { value: { type: "boolean" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_enrichment",
          description: "Toggle Enrichment Providers.",
          parameters: { type: "object", properties: { value: { type: "boolean" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_emailDiscovery",
          description: "Toggle Email Discovery provider.",
          parameters: { type: "object", properties: { value: { type: "boolean" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_verification",
          description: "Toggle Email Verification provider.",
          parameters: { type: "object", properties: { value: { type: "boolean" } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_maxCompanies",
          description: "Set Max Companies (1-2000). Upper bound on companies to discover.",
          parameters: { type: "object", properties: { value: { type: "number", minimum: 1, maximum: 2000 } }, required: ["value"] },
        },
      },
      {
        type: "function",
        function: {
          name: "set_maxContactsPerCompany",
          description: "Set Max Contacts per Company (1-50). Upper bound on contacts per company.",
          parameters: { type: "object", properties: { value: { type: "number", minimum: 1, maximum: 50 } }, required: ["value"] },
        },
      },

      // Generic tools retained for backward compatibility and batch confirmations
      {
        type: "function",
        function: {
          name: "set_field",
          description: "Set a single wizard field to a concrete value. Use an exact field from the allowed list below. Provide a non-empty value: strings for text, booleans for toggles, numbers for numeric fields.",
          parameters: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "Field name in wizard state (use one of the allowed values)",
                enum: ["name","description","industries","companySizes","company_sizes","geos","geographies","geo","techStack","tech_stack","titles","languages","excludeDomains","exclude_domains","notes","serp","crawler","enrichment","emailDiscovery","email_discovery","verification","maxCompanies","max_companies","maxContactsPerCompany","max_contacts_per_company"]
              },
              value: {
                description: "Concrete value to set. Strings for text fields, boolean for toggles, numbers for numeric fields."
              },
            },
            required: ["field", "value"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "set_fields_batch",
          description: "Set multiple wizard fields at once for a section. Include all fields you propose for the section and provide concrete values for each (no placeholders). If unsure, ask a clarifying question instead of leaving values empty.",
          parameters: {
            type: "object",
            properties: {
              changes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: {
                      type: "string",
                      enum: ["name","description","industries","companySizes","company_sizes","geos","geographies","geo","techStack","tech_stack","titles","languages","excludeDomains","exclude_domains","notes","serp","crawler","enrichment","emailDiscovery","email_discovery","verification","maxCompanies","max_companies","maxContactsPerCompany","max_contacts_per_company"]
                    },
                    value: {},
                  },
                  required: ["field", "value"],
                },
              },
              section: { type: "string", description: "Section name being filled" },
            },
            required: ["changes"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "confirm_section",
          description: "Ask the user to confirm a section ONLY after proposing concrete values via tools. Include the fields and the proposed values to be confirmed. Do not call this without proposing values first.",
          parameters: {
            type: "object",
            properties: {
              section: { type: "string" },
              fields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    field: {
                      type: "string",
                      enum: ["name","description","industries","companySizes","company_sizes","geos","geographies","geo","techStack","tech_stack","titles","languages","excludeDomains","exclude_domains","notes","serp","crawler","enrichment","emailDiscovery","email_discovery","verification","maxCompanies","max_companies","maxContactsPerCompany","max_contacts_per_company"]
                    },
                    value: {},
                  },
                  required: ["field", "value"],
                },
              },
            },
            required: ["section", "fields"],
          },
        },
      },
    ],
    []
  );

  // Initialize WebRTC & Azure Realtime
  const startAgent = async () => {
    setError(null);
    setConnecting(true);

    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Playback remote audio
      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        setRemoteStream(stream);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {
            // Autoplay might be blocked; user can click play
          });
        }
      };

      // Receive transceiver for audio from server
      pc.addTransceiver("audio", { direction: "recvonly" });

      // Capture local mic
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = localStream;
      setLocalStream(localStream);
      for (const track of localStream.getAudioTracks()) {
        pc.addTrack(track, localStream);
      }

      // Data channel for Realtime messages
      const dc = pc.createDataChannel("oai");
      dcRef.current = dc;

      // Also listen for server-provided data channel (e.g., "oai" or "oai-events")
      // This ensures we bind handlers if the runtime creates the channel on its side.
      // Handlers will be bound AFTER they are defined to avoid undefined assignments.

      dc.onopen = () => {
        // Send session.update with instructions and tools
        const instructions = `
You are a helpful Voice Agent assisting with populating the Lead Generation Wizard.
Always speak in English unless the user explicitly asks for another language. If the user's language differs, kindly confirm, but keep speaking in English unless requested otherwise.
Follow a structured process in sequential sections:
1) Basic Info (name, description)
2) ICP (industries, companySizes, geos, techStack, titles, languages, excludeDomains, notes)
3) Providers (serp, crawler, enrichment, emailDiscovery, verification)
4) Limits (maxCompanies, maxContactsPerCompany)

At the start, greet the user and ask if they are ready to fill out the wizard.
If they are unsure, offer guidance and examples.
For each section, use the appropriate tools:
- set_field or set_fields_batch to propose values
- confirm_section to request human-in-the-loop confirmation of the proposed values
Wait for tool_output result before proceeding.
When all sections are complete, summarize the inputs and ask for final confirmation to end.
`;

        const sessionUpdate = {
          type: "session.update",
          session: {
            instructions,
            modalities: ["audio", "text"],
            // Explicitly set model/deployment from env (fallback to "gpt-realtime")
            model: process.env.NEXT_PUBLIC_AZURE_OPENAI_REALTIME_DEPLOYMENT || "gpt-realtime",
            voice: "marin", // model default voice name; can be customized
            turn_detection: { type: "server" },
            tools: tools.map((t: any) =>
              t && t.type === "function" && t.function
                ? {
                    type: "function",
                    name: t.function.name,
                    description: t.function.description,
                    parameters: t.function.parameters,
                  }
                : t
            ),
            tool_choice: "auto",
          },
        };

        dc.send(JSON.stringify(sessionUpdate));
        try {
          fetch("/api/voice/realtime/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ direction: "outbound", event: "session.update", payload: sessionUpdate }),
          }).catch(() => {});
        } catch {}

        // Reinforce strict tool usage so the model actually calls our tools instead of only narrating.
        const strictToolRules = {
          type: "session.update",
          session: {
            instructions: `
STRICT TOOL USAGE RULES:
- You MUST use the defined tools to set values. Do not narrate changes without tool calls.
- Before any run of tool calls (for one or more fields), first speak to the user: clearly list which fields you will update and why.
- Prefer specialized tools for each field (set_name, set_description, set_industries, set_companySizes, set_geos, set_techStack, set_titles, set_languages, set_excludeDomains, set_notes, set_serp, set_crawler, set_enrichment, set_emailDiscovery, set_verification, set_maxCompanies, set_maxContactsPerCompany). Use set_field only as fallback; avoid set_fields_batch unless absolutely necessary.
- You MAY issue multiple specialized tool calls in the same turn (parallel) to cover all fields in the active section; after sending them, speak: “Proposals sent, ready for your confirmation in the modal.”
- For single generic fields, call set_field with { field, value }. Use canonical camelCase or snake_case synonyms:
  name, description, industries, companySizes/company_sizes, geos/geographies, techStack/tech_stack, titles, languages, excludeDomains/exclude_domains, notes, serp, crawler, enrichment, emailDiscovery/email_discovery, verification, maxCompanies/max_companies, maxContactsPerCompany/max_contacts_per_company.
- After proposing values for a section, call confirm_section with { section, fields } including the exact values you proposed; do NOT call confirm_section without proposing values first.
- Do not rely on plaintext narration for setting values; always use tool calls so the UI can mark fields for human-in-the-loop confirmation.
- Always wait for tool outputs; if a value is rejected, immediately speak to the user to clarify and propose a corrected value with another tool call.
- Continue speaking in English unless the user explicitly requests another language.
`
          }
        };
        dc.send(JSON.stringify(strictToolRules));
        // Provide concrete examples to guide tool usage
        const toolExamples = {
          type: "session.update",
          session: {
            instructions: `
EXAMPLES:
- set_field:
  { "type": "tool", "name": "set_field", "arguments": { "field": "name", "value": "Acme Leads Campaign" } }

- set_fields_batch for section 1 (name & description):
  { "type": "tool", "name": "set_fields_batch", "arguments": { "section": "section_1", "changes": [
    { "field": "name", "value": "Acme Leads Campaign" },
    { "field": "description", "value": "Discover high-quality B2B leads in NA tech sector." }
  ] } }

- confirm_section with proposed values (only after proposing):
  { "type": "tool", "name": "confirm_section", "arguments": { "section": "section_1", "fields": [
    { "field": "name", "value": "Acme Leads Campaign" },
    { "field": "description", "value": "Discover high-quality B2B leads in NA tech sector." }
  ] } }
`
          }
        };
        dc.send(JSON.stringify(toolExamples));
        const fieldGuidance = {
          type: "session.update",
          session: {
            instructions: `
FORM FIELD DEFINITIONS AND ORDER:
Section 1 - Basic Info:
- name (string): Lead Pool Name, short descriptive label.
- description (string, optional): Longer sentence describing the objective.

Section 2 - ICP:
- industries (csv string): verticals like "fintech, logistics, ecommerce".
- companySizes (csv string): "1-10, 11-50, 51-200, 200-1000, 1000+".
- geos (csv string): regions/countries like "US, UK, DACH, EU".
- techStack (csv string): technologies like "Shopify, WooCommerce, React, Node.js".
- titles (csv string): roles like "Head of Operations, Director of Data".
- languages (csv string): language codes or names, like "en, de, fr".
- excludeDomains (csv string): domains to exclude like "competitor.com".
- notes (string): freeform guidance for the pipeline.

Section 3 - Providers (booleans): serp, crawler, enrichment, emailDiscovery, verification.

Section 4 - Limits (numbers): maxCompanies (1-2000), maxContactsPerCompany (1-50).

USAGE RULES:
- Prefer specialized tools: set_name, set_description, set_industries, set_companySizes, set_geos, set_techStack, set_titles, set_languages, set_excludeDomains, set_notes, set_serp, set_crawler, set_enrichment, set_emailDiscovery, set_verification, set_maxCompanies, set_maxContactsPerCompany.
- You MAY issue multiple specialized tool calls in parallel within a single turn to propose all fields for a section. After proposing, call confirm_section with the concrete values.
- CSV means a comma-separated string; do not include placeholders. If uncertain, ask a clarifying question first.
`
          }
        };
        dc.send(JSON.stringify(fieldGuidance));

        // Kick off the conversation
        const responseCreate = {
          type: "response.create",
          response: {
            instructions:
              "Greet the user in English and ask if they are ready to fill out the Lead Generation Wizard. If ready, start with section 1: name & description. Immediately propose initial values via a set_fields_batch tool call and then request confirmation with confirm_section. Continue speaking in English unless the user requests another language.",
          },
        };
        dc.send(JSON.stringify(responseCreate));
        try {
          fetch("/api/voice/realtime/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ direction: "outbound", event: "response.create", payload: responseCreate }),
          }).catch(() => {});
        } catch {}

        // Watchdog: if no tool call happens shortly after kickoff, proactively nudge the agent to issue tool calls
        try {
          setTimeout(() => {
            try {
              if (!lastToolCallAt.current) {
                const ch = dcRef.current;
                if (ch && ch.readyState === "open") {
                  const req = {
                    type: "response.create",
                    response: {
                      tool_choice: "auto",
                      instructions:
                        "Issue specialized tool calls now to propose concrete values for the active section. Do not narrate; call the tools (e.g., set_name, set_description) and then request confirmation with confirm_section.",
                    },
                  };
                  ch.send(JSON.stringify(req));
                }
              }
            } catch {}
          }, 4000);
        } catch {}

        setAgentReady(true);
        setConnecting(false);
        setAgentActive(true);
      };

      // Handle messages from Realtime agent (tool calls, etc.)
      dc.onmessage = (ev) => {
        try {
          let data: any = ev.data;
          if (data instanceof ArrayBuffer) {
            try {
              data = new TextDecoder().decode(data);
            } catch {}
          }
          const msg = typeof data === "string" ? JSON.parse(data) : data;
          // Forward inbound realtime messages to server log (terminal)
          try {
            fetch("/api/voice/realtime/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ direction: "inbound", message: msg }),
            }).catch(() => {});
          } catch {}

          // Fallback bridge: some runtimes emit JSON-in-text instead of real tool calls.
          // Detect JSON content parts and synthesize tool calls so UI updates and terminal logs reflect them.
          try {
            const parseFirstJsonInText = (txt: string) => {
              if (!txt || typeof txt !== "string") return null;
              try {
                const m = txt.match(/{[\s\S]*}/);
                if (!m) return null;
                return JSON.parse(m[0]);
              } catch {
                return null;
              }
            };

            if (msg?.type === "response.content_part.done") {
              const textPart = (msg as any)?.part || (msg as any)?.content;
              if (textPart?.type === "text" && typeof textPart?.text === "string") {
                const obj = parseFirstJsonInText(textPart.text);
                if (!obj) {
                  return;
                }
                /* Heuristics disabled: agent must use explicit tool calls
                // Heuristics: when no JSON object is present, parse plain text "key: value" lines
                // and synthesize specialized tool calls so the UI updates dynamically.
                try {
                  const txt = String(textPart.text || "");
                  const proposals: Array<{ field: string; value: any }> = [];
                  // Text fields (with CSV where applicable)
                  const spec: Array<{ key: string; re: RegExp; group?: number }> = [
                    { key: "name", re: /name:\s*([^\n]+)/i },
                    { key: "description", re: /description:\s*([^\n]+)/i },
                    { key: "industries", re: /industries:\s*([^\n]+)/i },
                    { key: "companySizes", re: /(company\s*sizes|company_sizes):\s*([^\n]+)/i, group: 2 },
                    { key: "geos", re: /(geographies|geos):\s*([^\n]+)/i, group: 2 },
                    { key: "techStack", re: /(tech\s*stack|tech_stack):\s*([^\n]+)/i, group: 2 },
                    { key: "titles", re: /titles:\s*([^\n]+)/i },
                    { key: "languages", re: /languages:\s*([^\n]+)/i },
                    { key: "excludeDomains", re: /(exclude\s*domains|exclude_domains):\s*([^\n]+)/i, group: 2 },
                    { key: "notes", re: /notes:\s*([^\n]+)/i },
                    { key: "maxCompanies", re: /max\s*companies:\s*(\d+)/i },
                    { key: "maxContactsPerCompany", re: /max\s*contacts\s*per\s*company:\s*(\d+)/i },
                  ];
                  for (const item of spec) {
                    const m = txt.match(item.re);
                    const val = m ? (item.group ? m[item.group] : m[1]) : null;
                    if (val != null) proposals.push({ field: item.key, value: val });
                  }
                  // Provider booleans "serp: true/false", "crawler: on/off", etc.
                  const parseBool = (label: string) => {
                    const r = new RegExp(`${label}\\s*:\\s*([^\n]+)`, "i");
                    const m = txt.match(r);
                    if (!m) return null;
                    const s = m[1].trim().toLowerCase();
                    if (["true", "1", "yes", "on", "enable", "enabled"].includes(s)) return true;
                    if (["false", "0", "no", "off", "disable", "disabled"].includes(s)) return false;
                    return null;
                  };
                  const boolSpecs: Array<{ field: string; labels: string[] }> = [
                    { field: "serp", labels: ["serp", "search api", "use search api"] },
                    { field: "crawler", labels: ["crawler", "website crawl"] },
                    { field: "enrichment", labels: ["enrichment"] },
                    { field: "emailDiscovery", labels: ["email discovery", "email_discovery"] },
                    { field: "verification", labels: ["verification"] },
                  ];
                  for (const b of boolSpecs) {
                    for (const lbl of b.labels) {
                      const val = parseBool(lbl);
                      if (val !== null) {
                        proposals.push({ field: b.field, value: val });
                        break;
                      }
                    }
                  }
                  // Natural language "set X to Y" extraction (e.g., "set industries to restaurants")
                  try {
                    const addProposal = (fieldKey: string, value: any) => {
                      // Avoid duplicates; keep last mentioned value for the same field
                      const idx = proposals.findIndex((p) => normalizeField(p.field) === normalizeField(fieldKey));
                      const entry = { field: fieldKey, value };
                      if (idx >= 0) proposals[idx] = entry;
                      else proposals.push(entry);
                    };

                    // Generic "set <field> to <value>" across text
                    // Example matches: "set industries to restaurants and cafes", "update geographies as Albuquerque, New Mexico"
                    const setRe =
                      /\b(?:set|update|fill|change)\s+(name|description|industries|company\s*sizes|company_sizes|geographies|geos|tech\s*stack|tech_stack|titles|languages|exclude\s*domains|exclude_domains|notes)\s+(?:to|as)\s+([^.;\n]+)/gi;
                    let m: RegExpExecArray | null;
                    while ((m = setRe.exec(txt)) !== null) {
                      const rawField = m[1] || "";
                      const rawValue = (m[2] || "").trim();
                      const norm =
                        rawField
                          .toLowerCase()
                          .replace(/\s+/g, "")
                          .replace(/techstack/, "techStack")
                          .replace(/companysizes/, "companySizes")
                          .replace(/excludedomains/, "excludeDomains")
                          .replace(/geographies|geos/, "geos") || rawField;
                      const canon = normalizeField(norm) || (norm as any);
                      if (canon && rawValue) {
                        addProposal(String(canon), rawValue);
                      }
                    }

                    // Numeric limits "set max companies to 500", "max contacts per company as 3"
                    const numPairs: Array<{ re: RegExp; field: string; group?: number }> = [
                      { re: /\b(?:set|update|change)\s+max\s*companies\s+(?:to|as)\s+(\d+)/i, field: "maxCompanies" },
                      {
                        re: /\b(?:set|update|change)\s+max\s*contacts\s*per\s*company\s+(?:to|as)\s+(\d+)/i,
                        field: "maxContactsPerCompany",
                      },
                    ];
                    for (const np of numPairs) {
                      const nm = txt.match(np.re);
                      if (nm && nm[1]) {
                        addProposal(np.field, Number(nm[1]));
                      }
                    }

                    // Boolean toggles: "turn on serp", "enable crawler", "disable verification"
                    const toggleSpecs: Array<{ labels: string[]; field: string }> = [
                      { labels: ["serp", "search api"], field: "serp" },
                      { labels: ["crawler", "website crawl"], field: "crawler" },
                      { labels: ["enrichment"], field: "enrichment" },
                      { labels: ["email discovery", "email_discovery"], field: "emailDiscovery" },
                      { labels: ["verification"], field: "verification" },
                    ];
                    const toggleOn = /\b(turn\s*on|enable|enabled|activate|on)\b/i;
                    const toggleOff = /\b(turn\s*off|disable|disabled|deactivate|off)\b/i;
                    for (const specT of toggleSpecs) {
                      for (const lbl of specT.labels) {
                        const segRe = new RegExp(`\\b(${lbl})\\b[^.\\n]*`, "i");
                        const seg = txt.match(segRe)?.[0] || "";
                        if (!seg) continue;
                        if (toggleOn.test(seg)) {
                          addProposal(specT.field, true);
                          break;
                        }
                        if (toggleOff.test(seg)) {
                          addProposal(specT.field, false);
                          break;
                        }
                      }
                    }
                  } catch {}

                  if (proposals.length) {
                    const changes = proposals.map((p) => ({ field: p.field, value: p.value }));
                    const callId = `synth_text_${Date.now()}`;
                    // Apply changes and queue a pending batch for confirmation UX
                    applyChanges(changes);
                    setPendingTool({
                      callId,
                      name: "set_fields_batch",
                      args: { changes, section: undefined },
                      proposedChanges: changes,
                      section: undefined,
                    });
                    setPendingTools((prev) => [
                      ...prev,
                      { callId, name: "set_fields_batch", args: { changes }, proposedChanges: changes, section: undefined },
                    ]);
                    try {
                      fetch("/api/voice/realtime/events", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          direction: "inbound",
                          event: "tool_call_detected_text_bridge_plaintext",
                          changes,
                          callId,
                        }),
                      }).catch(() => {});
                    } catch {}
                    // Stop further handling; this content has been bridged to synthesized tool calls.
                    return;
                  }

                  // Completion intent detection (e.g., "submitted all information", "I'm done", "ready to confirm")
                  try {
                    const doneRe = /(submitted|done|finished|that'?s all|complete|ready to confirm)/i;
                    if (doneRe.test(txt)) {
                      const fields: Array<{ field: string; value: any }> = [
                        { field: "name", value: state.name },
                        { field: "description", value: state.description || "" },
                        { field: "industries", value: state.industries },
                        { field: "companySizes", value: state.companySizes },
                        { field: "geos", value: state.geos },
                        { field: "techStack", value: state.techStack },
                        { field: "titles", value: state.titles },
                        { field: "languages", value: state.languages },
                        { field: "excludeDomains", value: state.excludeDomains },
                        { field: "notes", value: state.notes || "" },
                        { field: "serp", value: state.serp },
                        { field: "crawler", value: state.crawler },
                        { field: "enrichment", value: state.enrichment },
                        { field: "emailDiscovery", value: state.emailDiscovery },
                        { field: "verification", value: state.verification },
                        { field: "maxCompanies", value: state.maxCompanies },
                        { field: "maxContactsPerCompany", value: state.maxContactsPerCompany },
                      ];
                      const callId = `synth_confirm_${Date.now()}`;
                      // Mark a synthetic tool call for watchdog purposes
                      try { lastToolCallAt.current = Date.now(); } catch {}
                      setPendingTool({
                        callId,
                        name: "confirm_section",
                        args: { section: "final_review", fields },
                        proposedChanges: fields,
                        section: "final_review",
                      });
                      setPendingTools((prev) => [
                        ...prev,
                        {
                          callId,
                          name: "confirm_section",
                          args: { section: "final_review", fields },
                          proposedChanges: fields,
                          section: "final_review",
                        },
                      ]);
                      try {
                        fetch("/api/voice/realtime/events", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            direction: "inbound",
                            event: "tool_call_detected_text_bridge_final_confirm",
                            section: "final_review",
                            fields,
                            callId,
                          }),
                        }).catch(() => {});
                      } catch {}
                      return;
                    }
                  } catch {}

                } catch {}
                */ 
                if (obj && typeof obj === "object") {
                  // 1) Direct tool intent e.g. { tool: "set_field", arguments: {...} } or { name: "set_field", arguments: {...} }
                  const toolName = (obj as any).tool || (obj as any).name;
                  const toolArgs = (obj as any).arguments || (obj as any).args || (obj as any).parameters;
                  if (toolName && toolArgs) {
                    const callId = `synth_${Date.now()}`;
                    try {
                      fetch("/api/voice/realtime/events", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          direction: "inbound",
                          event: "tool_call_detected_text_bridge",
                          name: toolName,
                          args: toolArgs,
                          callId
                        }),
                      }).catch(() => {});
                    } catch {}
                    {
                      const _name = String(toolName);
                      let _args: any = toolArgs;
                      if (typeof _args === "string") {
                        try { _args = JSON.parse(_args); } catch {}
                      }
                      if (_name === "set_field") {
                        const proposed = [{ field: _args.field, value: _args.value }];
                        applyChanges(proposed);
                        setPendingTool({ callId, name: _name, args: _args, proposedChanges: proposed, section: undefined });
                        setActiveInput({ field: String(normalizeField(_args.field) || _args.field), value: String(_args.value ?? ""), callId });
                      } else if (_name === "set_fields_batch") {
                        const proposed = Array.isArray(_args.changes) ? _args.changes : [];
                        if (proposed.length) {
                          applyChanges(proposed);
                        }
                        setPendingTool({
                          callId,
                          name: _name,
                          args: _args,
                          proposedChanges: proposed,
                          section: _args.section,
                        });
                      } else if (_name === "confirm_section") {
                        const proposed = Array.isArray(_args.fields) ? _args.fields : [];
                        setPendingTool({
                          callId,
                          name: _name,
                          args: _args,
                          proposedChanges: proposed,
                          section: _args.section,
                        });
                      }
                    }
                    // Stop further handling; this content has been bridged to a tool call.
                    return;
                  }

                  // 2) Section confirmation style e.g. { section: "name_description", fields: ["name","description"], values?: { name:"...", description:"..." } }
                  if (obj && (obj as any).section && Array.isArray((obj as any).fields)) {
                    const fields = (obj as any).fields as any[];
                    const valuesMap = (obj as any).values && typeof (obj as any).values === "object" ? (obj as any).values : null;
                    const section = (obj as any).section;
                    const callId = `synth_section_${Date.now()}`;

                    if (valuesMap) {
                      // Synthesize a batch set with provided values
                      const proposed = fields
                        .map((f) => {
                          const key = typeof f === "string" ? f : f?.field;
                          if (!key) return null;
                          const val = (valuesMap as any)[key];
                          if (typeof val === "undefined") return null;
                          return { field: String(key), value: val };
                        })
                        .filter(Boolean) as Array<{ field: string; value: any }>;

                      if (proposed.length) {
                        try {
                          fetch("/api/voice/realtime/events", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              direction: "inbound",
                              event: "tool_call_detected_text_bridge_set_fields_batch",
                              section,
                              changes: proposed,
                              callId
                            }),
                          }).catch(() => {});
                        } catch {}
                        {
                          const _name = "set_fields_batch";
                          const _args: any = { changes: proposed, section };
                          // Optimistically apply batch changes
                          if (proposed.length) {
                            applyChanges(proposed);
                          }
                          setPendingTool({
                            callId,
                            name: _name,
                            args: _args,
                            proposedChanges: proposed,
                            section,
                          });
                        }
                        return;
                      }
                    }

                    // No values provided; synthesize a confirm_section gate so the UI at least reflects the intent.
                    const confirmFields = fields.map((f) => {
                      if (typeof f === "string") {
                        const canon = normalizeField(f) || f;
                        const existing = (state as any)[canon];
                        return { field: String(canon), value: typeof existing !== "undefined" ? existing : "" };
                      } else {
                        const key0 = f?.field;
                        const canon = normalizeField(String(key0)) || key0;
                        const existing = canon ? (state as any)[canon] : undefined;
                        return {
                          field: String(canon),
                          value:
                            typeof f?.value !== "undefined"
                              ? f.value
                              : typeof existing !== "undefined"
                              ? existing
                              : "",
                        };
                      }
                    });
                    try {
                      fetch("/api/voice/realtime/events", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          direction: "inbound",
                          event: "tool_call_detected_text_bridge_confirm_section",
                          section,
                          fields: confirmFields,
                          callId
                        }),
                      }).catch(() => {});
                    } catch {}
                    {
                      const _name = "confirm_section";
                      const _args: any = { section, fields: confirmFields };
                      const proposed = Array.isArray(confirmFields) ? confirmFields : [];
                      setPendingTool({
                        callId,
                        name: _name,
                        args: _args,
                        proposedChanges: proposed,
                        section,
                      });
                      // Optimistically apply current wizard values so UI is populated even if runtime omitted values
                      try {
                        if (Array.isArray(proposed) && proposed.length) {
                          applyChanges(proposed);
                        }
                      } catch {}
                      // Prefill inline input for the first field to accelerate user approval/edits
                      try {
                        const firstField =
                          Array.isArray(proposed) && proposed.length
                            ? proposed[0].field
                            : Array.isArray(confirmFields) && confirmFields.length
                            ? confirmFields[0].field
                            : undefined;
                        const firstValue =
                          Array.isArray(proposed) && proposed.length
                            ? String(proposed[0].value ?? "")
                            : Array.isArray(confirmFields) && confirmFields.length
                            ? String(confirmFields[0].value ?? "")
                            : "";
                        if (firstField) {
                          setActiveInput({ field: String(firstField), value: firstValue, callId });
                        }
                      } catch {}

                      // Ask the agent to propose concrete values before confirmation
                      try {
                  const ch = dcRef.current;
                  if (ch && ch.readyState === "open") {
                          const req = {
                            type: "response.create",
                            response: {
                              tool_choice: "auto",
                              instructions: `Before confirming the section "${section}", propose concrete values for each field using set_field or set_fields_batch with changes including values. Do not request confirmation without proposing specific values.`,
                            },
                          };
                          ch.send(JSON.stringify(req));
                        }
                      } catch {}
                    }
                    return;
                  }
                }
              }
            }
          } catch {}

          // Debug incoming messages to verify tool call shapes
          try {
            console.debug("[VOICE_AGENT_MSG]", msg);
          } catch {}

          const tryParse = (v: any) => {
            if (!v) return v;
            if (typeof v === "string") {
              try {
                return JSON.parse(v);
              } catch {
                return v;
              }
            }
            return v;
          };

  const handleCall = (name: string, args: any, callId: string) => {
    args = tryParse(args);
    try {
      fetch("/api/voice/realtime/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "inbound", event: "tool_call_detected", name, args, callId }),
      }).catch(() => {});
    } catch {}
    // Mark last tool call time for watchdog logic
    try { lastToolCallAt.current = Date.now(); } catch {}

    // Specialized per-field setters map
    const SPECIAL_SET_TO_FIELD: Record<string, keyof WizardState> = {
      set_name: "name",
      set_description: "description",
      set_industries: "industries",
      set_companySizes: "companySizes",
      set_geos: "geos",
      set_techStack: "techStack",
      set_titles: "titles",
      set_languages: "languages",
      set_excludeDomains: "excludeDomains",
      set_notes: "notes",
      set_serp: "serp",
      set_crawler: "crawler",
      set_enrichment: "enrichment",
      set_emailDiscovery: "emailDiscovery",
      set_verification: "verification",
      set_maxCompanies: "maxCompanies",
      set_maxContactsPerCompany: "maxContactsPerCompany",
    };

    if (name in SPECIAL_SET_TO_FIELD) {
      const field = SPECIAL_SET_TO_FIELD[name];
      const proposed = [{ field: field as string, value: args?.value }];
      // Optimistically apply change for immediate UI feedback
      applyChanges(proposed);
      // Track per-field pending confirmation and previous value for possible revert
      try {
        const prevValue = (state as any)[String(field)];
        setPendingFields((prev) => ({
          ...prev,
          [String(field)]: { callId, name, value: args?.value, prevValue, status: "pending" },
        }));
      } catch {}
      // Prefill inline input for text-like fields
      const textLike: Array<keyof WizardState> = ["name","description","industries","companySizes","geos","techStack","titles","languages","excludeDomains","notes"];
      if (textLike.includes(field)) {
        setActiveInput({ field: String(field), value: String(args?.value ?? ""), callId });
      }
      return;
    }

    if (name === "set_field") {
      const proposed = [{ field: args.field, value: args.value }];
      // Optimistically apply change for immediate UI feedback
      applyChanges(proposed);
      // Track per-field pending confirmation and previous value for possible revert
      try {
        const f = String(normalizeField(args.field) || args.field);
        const prevValue = (state as any)[f];
        setPendingFields((prev) => ({
          ...prev,
          [f]: { callId, name, value: args?.value, prevValue, status: "pending" },
        }));
      } catch {}
      setActiveInput({ field: String(normalizeField(args.field) || args.field), value: String(args.value ?? ""), callId });
    } else if (name === "set_fields_batch") {
      const proposed = Array.isArray(args.changes) ? args.changes : [];
      // Optimistically apply batch changes for immediate UI feedback
      if (proposed.length) {
        applyChanges(proposed);
      }
      // Track each changed field as pending for inline confirmation
      try {
        for (const ch of proposed) {
          const f = String(normalizeField(ch.field) || ch.field);
          const prevValue = (state as any)[f];
          setPendingFields((prev) => ({
            ...prev,
            [f]: { callId, name, value: ch.value, prevValue, status: "pending" },
          }));
        }
      } catch {}
    } else if (name === "confirm_section") {
      const proposed = Array.isArray(args.fields) ? args.fields : [];
      setPendingTool({
        callId,
        name,
        args,
        proposedChanges: proposed,
        section: args.section,
      });
      setPendingTools((prev) => [...prev, { callId, name, args, proposedChanges: proposed, section: args.section }]);
    }
  };

          // Case 1: direct tool/function call event
          if (
            msg.type === "response.tool_call" ||
            msg.type === "tool_call" ||
            msg.type === "response.function_call" ||
            msg.type === "function_call"
          ) {
            const callId = msg.call_id || msg.id || `${Date.now()}`;
            const name = msg.name || msg.tool?.name || msg.function?.name;
            const args = msg.arguments ?? msg.tool?.arguments ?? msg.function?.arguments;
            if (name) handleCall(name, args, callId);
            return;
          }

          // Case 2: nested in response.output_items (OpenAI Realtime pattern)
          if (msg.response && Array.isArray(msg.response.output_items)) {
            for (const item of msg.response.output_items) {
              const type = item.type || item.item_type;
              if (type && String(type).toLowerCase().includes("tool")) {
                const name = item.name || item.tool_name || item.tool?.name;
                const args = item.arguments || item.params || item.tool?.arguments;
                const callId = item.id || `${Date.now()}`;
                if (name) handleCall(name, args, callId);
              }
            }
            return;
          }

          // Case 2b: nested in response.output (some runtimes)
          if (msg.response && Array.isArray(msg.response.output)) {
            for (const item of msg.response.output) {
              const type = item.type || item.item_type;
              if (type && (String(type).toLowerCase().includes("tool") || String(type).toLowerCase().includes("function"))) {
                const name = item.name || item.tool_name || item.tool?.name || item.function?.name;
                const args = item.arguments || item.params || item.tool?.arguments || item.function?.arguments;
                const callId = item.id || `${Date.now()}`;
                if (name) handleCall(name, args, callId);
              }
            }
            return;
          }

          // Case 2c: Assistants/Responses-style required_action tool calls
          if (msg.response && msg.response.required_action && msg.response.required_action.type) {
            const ra = msg.response.required_action;
            // Common shapes: { type: "submit_tool_outputs", tool_calls: [{id,name,arguments}, ...] }
            const tcList =
              (ra.tool_calls && Array.isArray(ra.tool_calls) && ra.tool_calls) ||
              (ra.calls && Array.isArray(ra.calls) && ra.calls) ||
              [];
            if (tcList.length) {
              for (const tc of tcList) {
                const name = tc.name || tc.tool_name || tc.tool?.name;
                const args = tc.arguments || tc.tool?.arguments || tc.params;
                const callId = tc.id || `${Date.now()}`;
                if (name) handleCall(name, args, callId);
              }
              return;
            }
          }

          // Case 3: delta stream with tool_call_delta(s)
          const candidates = msg.delta?.tool_calls || msg.tool_calls || msg.tool_call_delta;
          if (candidates && Array.isArray(candidates)) {
            for (const tc of candidates) {
              const name = tc.name || tc.tool?.name;
              const args = tc.arguments || tc.tool?.arguments;
              const callId = tc.id || `${Date.now()}`;
              if (name) handleCall(name, args, callId);
            }
            return;
          }

          // Case 4: minimal payload with name/arguments at root
          if (msg && msg.name && (msg.arguments || msg.args)) {
            handleCall(msg.name, msg.arguments || msg.args, msg.id || `${Date.now()}`);
            return;
          }

          // Other messages ignored; audio handled via WebRTC tracks
        } catch (_e) {
          // Ignore non-JSON/control frames
        }
      };

      // Also listen for server-provided data channel (e.g., "oai" or "oai-events")
      // Bind handlers after they are defined, so they are not undefined
      pc.ondatachannel = (ev) => {
        const srv = ev.channel;
        dcRef.current = srv;
        // Mirror handlers onto the server channel
        srv.onopen = dc.onopen;
        srv.onmessage = dc.onmessage;
      };

      // Request ephemeral session first (no wallet gating), then POST SDP directly to Azure WebRTC
      // 1) Get ephemeral client_secret
      const sessRes = await fetch("/api/voice/azure/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: "coral" }),
      });
      let errMsg = "";
      if (!sessRes.ok) {
        try {
          const cts = sessRes.headers.get("content-type") || "";
          if (cts.includes("application/json")) {
            const j = await sessRes.json();
            errMsg = j?.error || "";
          } else {
            errMsg = await sessRes.text();
          }
        } catch {}
        throw new Error(errMsg || `Failed to create Azure realtime session (status ${sessRes.status})`);
      }
      const sessJson = await sessRes.json();
      const clientSecret =
        sessJson?.client_secret?.value || sessJson?.client_secret || sessJson?.token;
      if (!clientSecret) {
        throw new Error("Azure session did not return a client_secret");
      }

      // 2) Create SDP offer and send to Azure WebRTC endpoint using the ephemeral bearer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const base = process.env.NEXT_PUBLIC_AZURE_OPENAI_REALTIME_WEBRTC_URL;
      const dep = process.env.NEXT_PUBLIC_AZURE_OPENAI_REALTIME_DEPLOYMENT;
      const ver = process.env.NEXT_PUBLIC_AZURE_OPENAI_REALTIME_API_VERSION;
      if (!base) throw new Error("Realtime WebRTC URL is not configured");
      const webrtcUrl = `${base}?deployment=${encodeURIComponent(dep || "")}&api-version=${encodeURIComponent(
        ver || ""
      )}`;

      const res = await fetch(webrtcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
          "Accept": "application/sdp",
          "Authorization": `Bearer ${clientSecret}`,
        },
        body: offer.sdp || "",
      });

      const ct = res.headers.get("content-type") || "";

      if (!res.ok) {
        let msg = `Failed to negotiate WebRTC session (status ${res.status})`;
        try {
          if (ct.includes("application/json")) {
            let j: any = null;
            try {
              j = await res.json();
            } catch {}
            const errObj: any = j && (j as any).error;
            let errMsgStr = "";
            if (typeof errObj === "string") {
              errMsgStr = errObj;
            } else if (
              errObj &&
              typeof errObj === "object" &&
              "message" in errObj &&
              typeof (errObj as any).message === "string"
            ) {
              errMsgStr = (errObj as any).message;
            }
            msg = errMsgStr || msg;
          } else {
            const text = await res.text();
            msg = text || msg;
          }
        } catch {}
        throw new Error(msg);
      }

      const answerSdp = await res.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (e: any) {
      console.error("[VOICE_AGENT_START]", e);
      setError(e?.message || "Failed to start voice agent");
      setConnecting(false);
      stopAgent();
    }
  };

  const stopAgent = () => {
    setAgentActive(false);
    setAgentReady(false);
    setConnecting(false);
    setPendingTool(null);
    setError(null);
    setRemoteStream(null);
    setLocalStream(null);
    setActiveInput(null);

    try {
      dcRef.current?.close();
    } catch {}
    dcRef.current = null;
    try {
      pcRef.current?.getSenders().forEach((s) => {
        try {
          s.track?.stop();
        } catch {}
      });
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      stopAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Apply proposed changes on human confirmation
  const applyChanges = (changes: Array<{ field: string; value: any }>) => {
    // Normalize incoming fields (handles snake_case and alternate names)
    const normalized = normalizeChanges(changes);

    setState((prev) => {
      const next: WizardState = { ...prev };
      for (const c of normalized) {
        const f = c.field as keyof WizardState;
        // Coerce types for known numeric/boolean fields
        if (f === "maxCompanies" || f === "maxContactsPerCompany") {
          (next as any)[f] = Number(c.value);
        } else if (
          f === "serp" ||
          f === "crawler" ||
          f === "enrichment" ||
          f === "emailDiscovery" ||
          f === "verification"
        ) {
          const toBool = (v: any) => {
            if (typeof v === "boolean") return v;
            if (typeof v === "string") {
              const s = v.trim().toLowerCase();
              if (["true", "1", "yes", "on"].includes(s)) return true;
              if (["false", "0", "no", "off"].includes(s)) return false;
            }
            return !!v;
          };
          (next as any)[f] = toBool(c.value);
        } else {
          (next as any)[f] = String(c.value ?? "");
        }
      }
      return next;
    });
  };

  const sendToolOutput = (callId: string, ok: boolean, details?: any) => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    const payload = {
      type: "tool_output",
      call_id: callId,
      output: {
        status: ok ? "ok" : "rejected",
        details: details || null,
      },
    };
    try {
      dc.send(JSON.stringify(payload));

      // Also send a compatibility event for runtimes expecting "response.function_call_output"
      // Include function name if provided in details
      const payload2 = {
        type: "response.function_call_output",
        call_id: callId,
        name: details?.name || undefined,
        output: details?.applied ?? details ?? null,
      };
      try {
        dc.send(JSON.stringify(payload2));
      } catch {}

      // Assistants/required_action compatibility: submit tool outputs array
      const payload3 = {
        type: "response.submit_tool_outputs",
        outputs: [
          {
            call_id: callId,
            output: details?.applied ?? details ?? null,
            name: details?.name || undefined,
          },
        ],
      } as any;
      try {
        dc.send(JSON.stringify(payload3));
      } catch {}

      try {
        console.debug("[VOICE_TOOL_OUTPUT_SENT]", { payload, payload2, payload3 });
      } catch {}
      // Forward outbound tool outputs to server log (terminal)
      try {
        fetch("/api/voice/realtime/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            direction: "outbound",
            tool_output: payload,
            function_call_output: payload2,
            submit_tool_outputs: payload3,
          }),
        }).catch(() => {});
      } catch {}
    } catch (e) {
      console.error("[VOICE_TOOL_OUTPUT_SEND]", e);
      // Forward errors to server log (terminal)
      try {
        const errMsg =
          e && typeof e === "object" && "message" in e && typeof (e as any).message === "string"
            ? (e as any).message
            : String(e);
        fetch("/api/voice/realtime/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            direction: "error",
            error: errMsg,
          }),
        }).catch(() => {});
      } catch {}
    }
  };

  // Confirm/Reject specific pending tool by callId (for parallel confirmations)
  const onConfirmCall = (callId: string) => {
    const item = pendingTools.find((t) => t.callId === callId);
    if (!item) return;
    if (item.proposedChanges && item.proposedChanges.length) {
      applyChanges(item.proposedChanges as Array<{ field: string; value: any }>);
    }
    sendToolOutput(callId, true, { applied: item.proposedChanges ?? [], name: item.name, args: item.args });
    setPendingTools((prev) => prev.filter((t) => t.callId !== callId));
    if (pendingTool?.callId === callId) setPendingTool(null);
  };
  const onRejectCall = (callId: string) => {
    const item = pendingTools.find((t) => t.callId === callId);
    if (!item) return;
    sendToolOutput(callId, false, { name: item.name, args: item.args });
    setPendingTools((prev) => prev.filter((t) => t.callId !== callId));
    if (pendingTool?.callId === callId) setPendingTool(null);
  };

  // Inline field confirm/reject handlers
  const onConfirmField = (fieldKey: keyof WizardState) => {
    const entry = pendingFields[String(fieldKey)];
    if (!entry) return;
    const { callId, name } = entry;
    // Mark confirmed and schedule border removal
    setPendingFields((prev) => ({
      ...prev,
      [String(fieldKey)]: { ...entry, status: "confirmed", confirmedAt: Date.now() },
    }));
    setTimeout(() => {
      setPendingFields((prev) => {
        const next = { ...prev };
        if (next[String(fieldKey)] && next[String(fieldKey)].status === "confirmed") {
          delete next[String(fieldKey)];
        }
        return next;
      });
    }, 5000);
    // Send tool_output success for this field
    try {
      sendToolOutput(callId, true, { applied: [{ field: String(fieldKey), value: (state as any)[fieldKey] }], name });
    } catch {}
  };

  const onRejectField = (fieldKey: keyof WizardState) => {
    const entry = pendingFields[String(fieldKey)];
    if (!entry) return;
    const { callId, name, prevValue } = entry;
    // Revert state to previous value
    try {
      setState((prev) => ({ ...prev, [fieldKey]: prevValue } as any));
    } catch {}
    // Remove pending mark
    setPendingFields((prev) => {
      const next = { ...prev };
      delete next[String(fieldKey)];
      return next;
    });
    // Send tool_output rejected and prompt agent to follow up verbally
    try {
      sendToolOutput(callId, false, { name, args: { field: fieldKey, value: prevValue } });
      const ch = dcRef.current;
      if (ch && ch.readyState === "open") {
        const req = {
          type: "response.create",
          response: {
            instructions: `The user rejected the proposed value for "${String(fieldKey)}". Ask a clarifying question and propose a corrected value via the appropriate specialized tool.`,
          },
        };
        ch.send(JSON.stringify(req));
      }
    } catch {}
  };

  const onConfirm = () => {
    if (!pendingTool) return;
    const { callId, name, proposedChanges, args } = pendingTool;

    // set_field or set_fields_batch changes
    if (proposedChanges && proposedChanges.length) {
      applyChanges(proposedChanges);
    }

    // For confirm_section, no state change; it's a confirmation gate
    sendToolOutput(callId, true, { applied: proposedChanges ?? [], name, args });
    setPendingTool(null);
  };

  const onReject = () => {
    if (!pendingTool) return;
    const { callId, name, args } = pendingTool;
    sendToolOutput(callId, false, { name, args });
    setPendingTool(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Lead Generation Voice Assistant</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            The voice agent will guide you through each section of the Lead Generation Wizard, proposing values and asking for your confirmation. You can stop it anytime.
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={startAgent}
              disabled={agentActive || connecting}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {connecting ? "Connecting…" : agentActive ? "Agent Active" : "Start Voice Agent"}
            </Button>
            <Button onClick={stopAgent} variant="outline" disabled={!agentActive}>
              Stop Agent
            </Button>
            {error ? <div className="text-xs text-red-600">{error}</div> : null}
          </div>

          {/* Hidden audio element for agent playback without timeline */}
          <audio ref={remoteAudioRef} className="hidden" autoPlay playsInline />

          <div className="relative">
            <VoiceDuoWaveVisualizer
              leftStream={localStream}
              rightStream={remoteStream}
              leftLabel="You"
              rightLabel="Agent"
              className="h-[200px]"
            />
            {activeInput && (
              <div className="pointer-events-auto absolute left-3 top-3 max-w-[80%] rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-2xl ring-1 ring-white/20 border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-3">
                <div className="text-[11px] uppercase tracking-wide text-white/80 mb-1">
                  Input: <span className="font-semibold">{activeInput.field}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={activeInput.value}
                    onChange={(e) => setActiveInput((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                    className="flex-1 rounded-md px-3 py-2 bg-white/10 text-white placeholder:text-white/50 outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-white/30"
                    placeholder="Type value..."
                  />
                  <Button
                    onClick={() => {
                      if (pendingTool && pendingTool.name === "set_field" && pendingTool.callId === activeInput.callId) {
                        const v = activeInput.value;
                        setPendingTool((pt) => {
                          if (!pt) return pt;
                          if (pt.name !== "set_field") return pt;
                          const proposed = [{ field: activeInput.field, value: v }];
                          return { ...pt, proposedChanges: proposed };
                        });
                      }
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save
                  </Button>
                </div>
                <div className="text-[10px] text-white/60 mt-1">Stays until the next field prompt.</div>
              </div>
            )}
          </div>

          <div className="border rounded p-3">
            <div className="text-sm font-medium mb-2">Human-in-the-loop Confirmation</div>
            {false && (
              <div className="space-y-3">
                {pendingTools.map((pt) => (
                  <div key={pt.callId} className="space-y-2 border rounded p-2">
                    <div className="text-xs">
                      <div>
                        <span className="font-semibold">Tool:</span> {pt.name}
                      </div>
                      {pt.section ? (
                        <div>
                          <span className="font-semibold">Section:</span> {pt.section}
                        </div>
                      ) : null}
                    </div>
                    {pt.proposedChanges?.length ? (
                      <div className="space-y-1">
                        <div className="text-xs font-medium">Proposed Changes:</div>
                        <ul className="text-xs list-disc pl-5">
                          {pt.proposedChanges.map((c, idx) => (
                            <li key={idx}>
                              {c.field}: <span className="font-mono">{String(c.value)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        The agent requests confirmation for the current section values.
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <Button onClick={() => onConfirmCall(pt.callId)} className="bg-green-600 text-white hover:bg-green-700">
                        Confirm
                      </Button>
                      <Button onClick={() => onRejectCall(pt.callId)} variant="outline">
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!pendingTool && (
              <div className="text-xs text-muted-foreground">
                The agent is speaking. When it proposes changes, they will appear here for your review and confirmation.
              </div>
            )}

            {false && (
              <div className="space-y-2">
                <div className="text-xs">
                  <div>
                    <span className="font-semibold">Tool:</span> {pendingTool?.name}
                  </div>
                  {pendingTool?.section ? (
                    <div>
                      <span className="font-semibold">Section:</span> {pendingTool?.section}
                    </div>
                  ) : null}
                </div>
                {pendingTool?.proposedChanges?.length ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium">Proposed Changes:</div>
                    <ul className="text-xs list-disc pl-5">
                      {pendingTool?.proposedChanges?.map((c, idx) => (
                        <li key={idx}>
                          {c.field}:{" "}
                          <span className="font-mono">{String(c.value)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    The agent requests confirmation for the current section values.
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={onConfirm} className="bg-green-600 text-white hover:bg-green-700">
                    Confirm
                  </Button>
                  <Button onClick={onReject} variant="outline">
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => {
                try {
                  const dc = dcRef.current;
                  if (dc && dc.readyState === "open") {
                    const payload = {
                      type: "tool_output",
                      call_id: "manual_finalize",
                      output: {
                        status: "ok",
                        details: { note: "User finalized drafts and closed modal." },
                      },
                    };
                    dc.send(JSON.stringify(payload));
                  }
                } catch {}
                onOpenChange(false);
              }}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Apply Drafts & Close
            </Button>
          </div>

          {/* Live preview of current wizard values to assist the user */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-xs space-y-1">
              <div className="font-medium">Basic Info</div>
              <div className={`${pendingFields["name"] ? (pendingFields["name"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Name: {state.name}</span>
                {pendingFields["name"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("name")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("name")}>✕</Button>
                  </span>
                ) : null}
              </div>
              <div className={`${pendingFields["description"] ? (pendingFields["description"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Description: {state.description || ""}</span>
                {pendingFields["description"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("description")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("description")}>✕</Button>
                  </span>
                ) : null}
              </div>
              <div className="font-medium pt-2">ICP</div>
              <div className={`${pendingFields["industries"] ? (pendingFields["industries"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Industries: {state.industries}</span>
                {pendingFields["industries"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("industries")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("industries")}>✕</Button>
                  </span>
                ) : null}
              </div>
              <div className={`${pendingFields["companySizes"] ? (pendingFields["companySizes"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Company Sizes: {state.companySizes}</span>
                {pendingFields["companySizes"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("companySizes")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("companySizes")}>✕</Button>
                  </span>
                ) : null}
              </div>
              <div className={`${pendingFields["geos"] ? (pendingFields["geos"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Geographies: {state.geos}</span>
                {pendingFields["geos"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("geos")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("geos")}>✕</Button>
                  </span>
                ) : null}
              </div>
              <div className={`${pendingFields["techStack"] ? (pendingFields["techStack"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Tech Stack: {state.techStack}</span>
                {pendingFields["techStack"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("techStack")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("techStack")}>✕</Button>
                  </span>
                ) : null}
              </div>
              <div className={`${pendingFields["titles"] ? (pendingFields["titles"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Titles: {state.titles}</span>
                {pendingFields["titles"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("titles")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("titles")}>✕</Button>
                  </span>
                ) : null}
              </div>
              <div className={`${pendingFields["languages"] ? (pendingFields["languages"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Languages: {state.languages}</span>
                {pendingFields["languages"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("languages")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("languages")}>✕</Button>
                  </span>
                ) : null}
              </div>
              <div className={`${pendingFields["excludeDomains"] ? (pendingFields["excludeDomains"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Exclude Domains: {state.excludeDomains}</span>
                {pendingFields["excludeDomains"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("excludeDomains")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("excludeDomains")}>✕</Button>
                  </span>
                ) : null}
              </div>
              <div className={`${pendingFields["notes"] ? (pendingFields["notes"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Notes: {state.notes || ""}</span>
                {pendingFields["notes"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("notes")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("notes")}>✕</Button>
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-xs space-y-1">
              <div className="font-medium">Providers</div>
              <div className="flex items-center gap-2">
                <Switch checked={state.serp} onCheckedChange={(v) => setState((p) => ({ ...p, serp: v }))} />
                <span>Use Search API</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={state.crawler} onCheckedChange={(v) => setState((p) => ({ ...p, crawler: v }))} />
                <span>Website Crawl</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={state.enrichment} onCheckedChange={(v) => setState((p) => ({ ...p, enrichment: v }))} />
                <span>Enrichment Providers</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={state.emailDiscovery} onCheckedChange={(v) => setState((p) => ({ ...p, emailDiscovery: v }))} />
                <span>Email Discovery</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={state.verification} onCheckedChange={(v) => setState((p) => ({ ...p, verification: v }))} />
                <span>Email Verification</span>
              </div>
              <div className="font-medium pt-2">Limits</div>
              <div className={`${pendingFields["maxCompanies"] ? (pendingFields["maxCompanies"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Max Companies: {state.maxCompanies}</span>
                {pendingFields["maxCompanies"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("maxCompanies")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("maxCompanies")}>✕</Button>
                  </span>
                ) : null}
              </div>
              <div className={`${pendingFields["maxContactsPerCompany"] ? (pendingFields["maxContactsPerCompany"].status === "confirmed" ? "ring-2 ring-green-500" : "ring-2 ring-orange-500") : ""} rounded p-1 flex items-center justify-between`}>
                <span>Max Contacts per Company: {state.maxContactsPerCompany}</span>
                {pendingFields["maxContactsPerCompany"] ? (
                  <span className="flex items-center gap-2">
                    <Button className="bg-green-600 text-white" onClick={() => onConfirmField("maxContactsPerCompany")}>✓</Button>
                    <Button variant="outline" onClick={() => onRejectField("maxContactsPerCompany")}>✕</Button>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
