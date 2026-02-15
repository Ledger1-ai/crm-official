"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import { sanitizeHtml } from "@/lib/sanitize-html";
import {
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Mail,
    MessageSquare,
    Send,
    Eye,
    FileText,
    Sparkles,
    Users,
    AlertTriangle,
    Info,
    Wand2,
    Loader2,
    RefreshCw,
    Save,
    Cloud
} from "lucide-react";

/**
 * OutreachCampaignWizard - Comprehensive Prompt Builder & Sequence Manager
 * 
 * This wizard helps users:
 * 1. Define sequence basics and select leads
 * 2. Build a comprehensive AI prompt template (like vcrun.py)
 * 3. Configure project context and messaging strategy
 * 4. Preview generated messages with real lead data
 * 5. Test send to ANY email/phone (NEVER to the actual lead)
 * 6. Launch the sequence
 */

type Lead = {
    id: string;
    firstName?: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    assigned_accounts?: Array<{ company_name?: string }>;
};

type Campaign = {
    id: string;
    title: string;
    description?: string;
};

type Props = {
    selectedLeads?: Lead[];
    poolId?: string;
    campaignId?: string;
    campaign?: Campaign;
    onClose?: () => void;
};

// Default prompt template based on vcrun.py
const DEFAULT_PROMPT_TEMPLATE = `Persona:
You are {USER_NAME} — {USER_TITLE} at {COMPANY_NAME} and creator of {PRODUCT_NAME}. Write entirely in first person (I/me); never refer to yourself in third person. Your voice is principled builder, analytical and candid, confident but not salesy.

Goal:
Craft a personalized outreach email about {PRODUCT_NAME} tailored to the recipient, using any available firm/company research.

Voice and Style:
- Narrative, insight-driven prose; no section headings or bullet points in the email body.
- Avoid phrases like "Founder note".
- Be concise, confident, and specific; show operator depth and strategic clarity.

{PRODUCT_NAME} Briefing (context for personalization):
{CAMPAIGN_BRIEFING}

Meeting Preferences (embed naturally in CTA):
{MEETING_PREFERENCES}

Contact Information (this will be auto-filled for each lead):
- Name: {LEAD_NAME}
- Firm: {LEAD_COMPANY}
- Email Username: {LEAD_EMAIL_USERNAME}
- Title: {LEAD_TITLE}
- Investment Type: {LEAD_TYPE}
- Location: {LEAD_LOCATION}

Company Research (optional - will be auto-gathered):
{COMPANY_RESEARCH}

Requirements:
- Output JSON ONLY with keys "subject" and "body". Example: {{"subject":"...","body":"..."}}
- Body MUST be plain text (no HTML, signature, resources section, footers, or disclaimers).
- Length: 250–300 words.
- Open with a hook tied to their thesis/portfolio using available research.
- Personalize: connect {PRODUCT_NAME}'s value to their focus; demonstrate homework.
- Use preferred nickname if the email username or research suggests one.
- Maintain first-person voice throughout (I/me). No third-person references. No "Founder note".
- No explicit headings; write as natural prose paragraphs.
- End with a confident CTA that mentions remote availability and location preferences.

Return EXACTLY this JSON object:
{{
  "subject": "<compelling personalized subject>",
  "body": "<plain text body with paragraph breaks>"
}}`;

export default function OutreachCampaignWizard({
    selectedLeads = [],
    poolId,
    campaignId,
    campaign,
    onClose
}: Props) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

    // Step 1: Sequence Basics
    const [campaignName, setCampaignName] = useState("");
    const [campaignDescription, setCampaignDescription] = useState("");
    const [selectedChannels, setSelectedChannels] = useState<string[]>(["EMAIL"]);
    const [leads, setLeads] = useState<Lead[]>(selectedLeads);

    // Step 2: Sequence Context & Briefing
    const [campaignTitle, setCampaignTitle] = useState(campaign?.title || "");
    const [campaignBriefing, setCampaignBriefing] = useState("");
    const [userName, setUserName] = useState("");
    const [userTitle, setUserTitle] = useState("Founder");
    const [companyName, setCompanyName] = useState("The Utility Company");
    const [productName, setProductName] = useState(campaign?.title || "");
    const [meetingPreferences, setMeetingPreferences] = useState(
        "- I am based in Santa Fe, New Mexico.\n- I'm available for remote meetings with all investors.\n- In-person meetings only if you're in Albuquerque or Santa Fe, NM."
    );

    // Step 3: AI Prompt Template
    const [promptTemplate, setPromptTemplate] = useState(DEFAULT_PROMPT_TEMPLATE);
    const [includeResearch, setIncludeResearch] = useState(true);

    // Step 4: Preview & Test
    const [selectedLeadForPreview, setSelectedLeadForPreview] = useState<Lead | null>(null);
    const [emailPreview, setEmailPreview] = useState<any>(null);
    const [smsPreview, setSmsPreview] = useState<any>(null);
    const [testEmail, setTestEmail] = useState("");
    const [testPhone, setTestPhone] = useState("");

    // Loading states
    const [loading, setLoading] = useState(false);
    const [loadingCampaign, setLoadingCampaign] = useState(false);
    const [generatingEmail, setGeneratingEmail] = useState(false);
    const [generatingSms, setGeneratingSms] = useState(false);
    const [sendingTestEmail, setSendingTestEmail] = useState(false);
    const [sendingTestSms, setSendingTestSms] = useState(false);

    // SMS availability state
    const [smsConfigured, setSmsConfigured] = useState(false);
    const [checkingSmsConfig, setCheckingSmsConfig] = useState(true);

    // AI Enhancement loading states
    const [enhancingBriefing, setEnhancingBriefing] = useState(false);
    const [enhancingDescription, setEnhancingDescription] = useState(false);
    const [enhancingPreferences, setEnhancingPreferences] = useState(false);
    const [generatingPrompt, setGeneratingPrompt] = useState(false);

    // Build full context object with all wizard fields
    const buildFullContext = () => ({
        // Campaign basics (Step 1)
        campaignName,
        campaignDescription,
        selectedChannels,
        leadsCount: leads.length,
        // Project context (Step 2)
        productName: productName || campaignTitle,
        companyName,
        userName,
        userTitle,
        campaignTitle,
        briefing: campaignBriefing,
        meetingPreferences,
        // Campaign details (fetched)
        campaignId,
        fetchedCampaignDescription: fetchedCampaign?.description || campaign?.description,
    });

    // AI Enhancement function
    const enhanceText = async (
        type: "briefing" | "description" | "preferences" | "prompt",
        content: string,
        setter: (value: string) => void,
        setEnhancing: (value: boolean) => void
    ) => {
        setEnhancing(true);
        try {
            const res = await fetch("/api/outreach/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    content,
                    context: buildFullContext(),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to enhance");
            }

            const data = await res.json();
            setter(data.enhanced);
            toast.success("Enhanced with AI!");
        } catch (error: any) {
            toast.error(error.message || "Failed to enhance text");
        } finally {
            setEnhancing(false);
        }
    };

    // Generate a completely unique prompt template using AI
    const generateUniquePrompt = async () => {
        setGeneratingPrompt(true);
        try {
            // Get the current template with all substitutions as a starting point
            const populatedTemplate = buildPopulatedPromptTemplate();

            const res = await fetch("/api/outreach/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "prompt",
                    content: populatedTemplate, // Pass the populated template as a starting point
                    context: buildFullContext(),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to generate prompt");
            }

            const data = await res.json();
            setPromptTemplate(data.enhanced);
            toast.success("Generated unique AI prompt!");
        } catch (error: any) {
            toast.error(error.message || "Failed to generate prompt");
        } finally {
            setGeneratingPrompt(false);
        }
    };

    // Fetched campaign data
    const [fetchedCampaign, setFetchedCampaign] = useState<{
        id: string;
        title: string;
        description: string;
        brand_logo_url?: string;
        brand_primary_color?: string;
        require_approval?: boolean;
        campaign_brief?: string;
        meeting_link?: string;
        key_value_props?: string[];
    } | null>(null);

    useEffect(() => {
        if (leads.length > 0 && !selectedLeadForPreview) {
            setSelectedLeadForPreview(leads[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leads]);

    // Check if SMS is configured for the team
    useEffect(() => {
        const checkSmsConfig = async () => {
            setCheckingSmsConfig(true);
            try {
                // Check if SMS configuration exists for the team
                const res = await fetch("/api/outreach/sms/status");
                if (res.ok) {
                    const data = await res.json();
                    setSmsConfigured(data.configured === true);
                } else {
                    setSmsConfigured(false);
                }
            } catch (error) {
                console.error("Failed to check SMS config:", error);
                setSmsConfigured(false);
            } finally {
                setCheckingSmsConfig(false);
            }
        };
        checkSmsConfig();
    }, []);

    // Fetch campaign data when campaignId is provided
    useEffect(() => {
        if (!campaignId) return;

        const fetchCampaign = async () => {
            setLoadingCampaign(true);
            try {
                const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/summary`);
                if (res.ok) {
                    const data = await res.json();
                    setFetchedCampaign(data);

                    // Auto-populate fields from campaign
                    if (data.title) {
                        setCampaignTitle(data.title);
                        setProductName(data.title);
                        // Auto-generate campaign name based on campaign
                        if (!campaignName) {
                            const date = new Date();
                            const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                            setCampaignName(`${data.title} - ${monthYear} Outreach`);
                        }
                    }

                    // Use campaign_brief if available, otherwise fall back to description
                    if (data.campaign_brief) {
                        setCampaignBriefing(data.campaign_brief);
                    } else if (data.description) {
                        setCampaignBriefing(data.description);
                    }

                    // Auto-populate meeting link if available
                    if (data.meeting_link) {
                        const meetingPref = `- Book a meeting: ${data.meeting_link}\n- I'm available for remote meetings.`;
                        setMeetingPreferences(meetingPref);
                    }

                    // If key_value_props are available, enrich the briefing
                    if (data.key_value_props && data.key_value_props.length > 0) {
                        const currentBriefing = data.campaign_brief || data.description || "";
                        const valuePropsText = `\n\nKey Value Props:\n${data.key_value_props.map((p: string) => `• ${p}`).join("\n")}`;
                        if (!currentBriefing.includes("Key Value Props")) {
                            setCampaignBriefing(currentBriefing + valuePropsText);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch campaign:", error);
            } finally {
                setLoadingCampaign(false);
            }
        };

        fetchCampaign();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    // Also handle if campaign prop is provided directly
    useEffect(() => {
        if (campaign?.description && !campaignBriefing) {
            setCampaignBriefing(campaign.description);
        }
        if (campaign?.title) {
            setCampaignTitle(campaign.title);
            setProductName(campaign.title);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaign]);

    const steps = [
        { num: 1, title: "Sequence Basics", icon: Users },
        { num: 2, title: "Sequence Context", icon: FileText },
        { num: 3, title: "AI Prompt Template", icon: Sparkles },
        { num: 4, title: "Preview & Test", icon: Eye }
    ];

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return campaignName.trim() && leads.length > 0;
            case 2:
                return campaignTitle.trim() && campaignBriefing.trim();
            case 3:
                return promptTemplate.trim();
            case 4:
                return emailPreview || smsPreview;
            default:
                return false;
        }
    };

    // Auto-populate prompt template with user's context when moving to Step 3
    const buildPopulatedPromptTemplate = () => {
        return DEFAULT_PROMPT_TEMPLATE
            .replace(/{USER_NAME}/g, userName || "{USER_NAME}")
            .replace(/{USER_TITLE}/g, userTitle || "{USER_TITLE}")
            .replace(/{COMPANY_NAME}/g, companyName || "{COMPANY_NAME}")
            .replace(/{PRODUCT_NAME}/g, productName || campaignTitle || "{PRODUCT_NAME}")
            .replace(/{CAMPAIGN_BRIEFING}/g, campaignBriefing || "{CAMPAIGN_BRIEFING}")
            .replace(/{MEETING_PREFERENCES}/g, meetingPreferences || "{MEETING_PREFERENCES}");
    };

    const nextStep = () => {
        if (canProceed() && currentStep < 4) {
            // When moving to Step 3, auto-populate the prompt template with filled values
            if (currentStep === 2 && promptTemplate === DEFAULT_PROMPT_TEMPLATE) {
                setPromptTemplate(buildPopulatedPromptTemplate());
            }
            setCurrentStep((currentStep + 1) as any);

            // Auto-save draft when moving between steps
            saveDraft();
        }
    };

    // Draft campaign ID (stored when created)
    const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);
    const [savingDraft, setSavingDraft] = useState(false);

    // Save campaign as draft
    const saveDraft = async () => {
        if (!campaignName.trim()) return; // Need at least a name to save

        setSavingDraft(true);
        try {
            const payload = {
                id: draftCampaignId || undefined,
                name: campaignName,
                description: campaignDescription,
                channels: selectedChannels,
                leadIds: leads.map(l => l.id),
                poolId,
                campaignId,
                promptTemplate,
                includeResearch,
                status: "DRAFT",
                config: {
                    userName,
                    userTitle,
                    companyName,
                    productName,
                    campaignTitle,
                    campaignBriefing,
                    meetingPreferences,
                    currentStep,
                }
            };

            const res = await fetch("/api/outreach/sequences", {
                method: draftCampaignId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.id && !draftCampaignId) {
                    setDraftCampaignId(data.id);
                }
                // Silent save - no toast for drafts
            }
        } catch (error) {
            console.error("Failed to save draft:", error);
        } finally {
            setSavingDraft(false);
        }
    };

    // Auto-save draft when key fields change (debounced)
    useEffect(() => {
        if (!campaignName.trim()) return;

        const timeout = setTimeout(() => {
            saveDraft();
        }, 2000); // Auto-save after 2 seconds of inactivity

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignName, campaignDescription, selectedChannels, promptTemplate, campaignBriefing, meetingPreferences]);

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as any);
        }
    };

    const generateEmailPreview = async () => {
        if (!selectedLeadForPreview) {
            toast.error("Please select a lead for preview");
            return;
        }

        setGeneratingEmail(true);
        try {
            // Build the complete prompt with all substitutions
            const completePrompt = promptTemplate
                .replace(/{USER_NAME}/g, userName || "User")
                .replace(/{USER_TITLE}/g, userTitle)
                .replace(/{COMPANY_NAME}/g, companyName)
                .replace(/{PRODUCT_NAME}/g, productName || campaignTitle)
                .replace(/{CAMPAIGN_BRIEFING}/g, campaignBriefing)
                .replace(/{MEETING_PREFERENCES}/g, meetingPreferences)
                .replace(/{LEAD_NAME}/g, selectedLeadForPreview.firstName + " " + selectedLeadForPreview.lastName)
                .replace(/{LEAD_COMPANY}/g, selectedLeadForPreview.company || selectedLeadForPreview.assigned_accounts?.[0]?.company_name || "")
                .replace(/{LEAD_EMAIL_USERNAME}/g, selectedLeadForPreview.email?.split('@')[0] || "")
                .replace(/{LEAD_TITLE}/g, selectedLeadForPreview.jobTitle || "")
                .replace(/{LEAD_TYPE}/g, "")
                .replace(/{LEAD_LOCATION}/g, "")
                .replace(/{COMPANY_RESEARCH}/g, "");

            const res = await fetch(`/api/outreach/preview/email/${selectedLeadForPreview.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    promptOverride: completePrompt,
                    includeResearch,
                }),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();
            setEmailPreview(data);
            toast.success("Email preview generated");
        } catch (error: any) {
            toast.error(error.message || "Failed to generate email preview");
        } finally {
            setGeneratingEmail(false);
        }
    };

    const generateSmsPreview = async () => {
        if (!selectedLeadForPreview) {
            toast.error("Please select a lead for preview");
            return;
        }

        setGeneratingSms(true);
        try {
            const completePrompt = promptTemplate
                .replace(/{USER_NAME}/g, userName || "User")
                .replace(/{USER_TITLE}/g, userTitle)
                .replace(/{COMPANY_NAME}/g, companyName)
                .replace(/{PRODUCT_NAME}/g, productName || campaignTitle)
                .replace(/{CAMPAIGN_BRIEFING}/g, campaignBriefing)
                .replace(/{MEETING_PREFERENCES}/g, meetingPreferences);

            const res = await fetch(`/api/outreach/preview/sms/${selectedLeadForPreview.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    promptOverride: completePrompt,
                    includeResearch,
                }),
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();
            setSmsPreview(data);
            toast.success("SMS preview generated");
        } catch (error: any) {
            toast.error(error.message || "Failed to generate SMS preview");
        } finally {
            setGeneratingSms(false);
        }
    };

    const sendTestEmail = async () => {
        if (!testEmail.includes("@")) {
            toast.error("Please enter a valid test email address");
            return;
        }

        if (!selectedLeadForPreview) {
            toast.error("Please select a lead for testing");
            return;
        }

        // Require preview to be generated first
        if (!emailPreview) {
            toast.error("Please generate an email preview first");
            return;
        }

        setSendingTestEmail(true);
        try {
            // Pass the pre-generated content to skip AI regeneration
            const res = await fetch("/api/outreach/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leadIds: [selectedLeadForPreview.id],
                    test: true,
                    testEmail,
                    promptOverride: promptTemplate,
                    // Pass pre-generated content from preview to skip AI call
                    preGeneratedSubject: emailPreview.subject,
                    preGeneratedBody: emailPreview.bodyText,
                    preGeneratedHtml: emailPreview.html,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to send test email");
            }

            toast.success(`Test email sent to ${testEmail} (using the preview above)`);
        } catch (error: any) {
            toast.error(error.message || "Failed to send test email");
        } finally {
            setSendingTestEmail(false);
        }
    };

    const sendTestSms = async () => {
        if (!testPhone) {
            toast.error("Please enter a valid test phone number");
            return;
        }

        if (!selectedLeadForPreview) {
            toast.error("Please select a lead for testing");
            return;
        }

        // Require preview to be generated first
        if (!smsPreview) {
            toast.error("Please generate an SMS preview first");
            return;
        }

        setSendingTestSms(true);
        try {
            // Pass the pre-generated content to skip AI regeneration
            const res = await fetch("/api/outreach/sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leadIds: [selectedLeadForPreview.id],
                    test: true,
                    testPhone,
                    promptOverride: promptTemplate,
                    // Pass pre-generated SMS body from preview to skip AI call
                    preGeneratedBody: smsPreview.body,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to send test SMS");
            }

            toast.success(`Test SMS sent to ${testPhone} (using the preview above)`);
        } catch (error: any) {
            toast.error(error.message || "Failed to send test SMS");
        } finally {
            setSendingTestSms(false);
        }
    };

    const launchCampaign = async () => {
        setLoading(true);
        try {
            // Determine campaign status based on campaign approval requirement
            const requiresApproval = fetchedCampaign?.require_approval ?? false;
            const campaignStatus = requiresApproval ? "PENDING_APPROVAL" : "ACTIVE";

            const res = await fetch("/api/outreach/sequences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: campaignName,
                    description: campaignDescription,
                    channels: selectedChannels,
                    leadIds: leads.map(l => l.id),
                    poolId,
                    campaignId,
                    promptOverride: promptTemplate,
                    includeResearch,
                    status: campaignStatus, // Pass status based on approval setting
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to create campaign");
            }

            if (requiresApproval) {
                toast.success("Sequence submitted for approval! Your admin will review it.");
            } else {
                toast.success("Sequence launched successfully!");
            }
            if (onClose) onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to create sequence");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen p-6 space-y-6">
            {/* Campaign Context Header - Shows the company being represented */}
            {(fetchedCampaign || loadingCampaign) && (
                <div className="max-w-6xl mx-auto">
                    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                        <CardContent className="py-4">
                            {loadingCampaign ? (
                                <div className="flex items-center gap-3 animate-pulse">
                                    <div className="w-16 h-16 bg-muted rounded-lg" />
                                    <div className="space-y-2">
                                        <div className="h-5 w-48 bg-muted rounded" />
                                        <div className="h-4 w-32 bg-muted rounded" />
                                    </div>
                                </div>
                            ) : fetchedCampaign && (
                                <div className="flex items-center gap-4">
                                    {fetchedCampaign.brand_logo_url ? (
                                        <img
                                            src={fetchedCampaign.brand_logo_url}
                                            alt={fetchedCampaign.title}
                                            className="w-16 h-16 object-contain rounded-lg bg-white p-1"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <FileText className="w-8 h-8 text-primary" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                                REACHING OUT ON BEHALF OF
                                            </Badge>
                                        </div>
                                        <h2 className="text-xl font-bold text-primary mt-1">{fetchedCampaign.title}</h2>
                                        {fetchedCampaign.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1 max-w-xl">
                                                {fetchedCampaign.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Sequence ID</div>
                                        <div className="text-sm font-mono text-muted-foreground">{fetchedCampaign.id.slice(0, 8)}...</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Progress Steps */}
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.num;
                    const isCompleted = currentStep > step.num;

                    return (
                        <React.Fragment key={step.num}>
                            <div className="flex flex-col items-center flex-1">
                                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-2
                  ${isActive ? 'bg-primary text-primary-foreground' :
                                        isCompleted ? 'bg-green-500 text-white' :
                                            'bg-muted text-muted-foreground'}
                `}>
                                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                                </div>
                                <div className={`text-xs text-center font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {step.title}
                                </div>
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`h-0.5 flex-1 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Step Content */}
            <Card className="max-w-6xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">{steps[currentStep - 1].title}</CardTitle>
                    <CardDescription>
                        {currentStep === 1 && "Set up your sequence basics and select target leads"}
                        {currentStep === 2 && "Define your sequence context and product briefing for AI personalization"}
                        {currentStep === 3 && "Customize the AI prompt template that will generate personalized messages"}
                        {currentStep === 4 && "Preview generated messages and test send (NEVER to actual lead contacts)"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Step 1: Sequence Basics */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="campaignName">Campaign Name *</Label>
                                <Input
                                    id="campaignName"
                                    placeholder="e.g., Q1 2025 VC Outreach"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    className="text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="campaignDescription">Description</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => enhanceText("description", campaignDescription, setCampaignDescription, setEnhancingDescription)}
                                        disabled={enhancingDescription || !campaignDescription.trim()}
                                        className="h-7 text-xs gap-1"
                                    >
                                        {enhancingDescription ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                        Enhance with AI
                                    </Button>
                                </div>
                                <Textarea
                                    id="campaignDescription"
                                    placeholder="What is the goal of this campaign?"
                                    rows={3}
                                    value={campaignDescription}
                                    onChange={(e) => setCampaignDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Channels</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedChannels.includes("EMAIL")}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedChannels([...selectedChannels, "EMAIL"]);
                                                } else {
                                                    setSelectedChannels(selectedChannels.filter(c => c !== "EMAIL"));
                                                }
                                            }}
                                        />
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedChannels.includes("SMS")}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedChannels([...selectedChannels, "SMS"]);
                                                } else {
                                                    setSelectedChannels(selectedChannels.filter(c => c !== "SMS"));
                                                }
                                            }}
                                        />
                                        <MessageSquare className="w-4 h-4" />
                                        SMS
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Selected Leads ({leads.length})</Label>
                                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-muted/30">
                                    {leads.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No leads selected</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {leads.slice(0, 10).map((lead) => (
                                                <div key={lead.id} className="flex items-center justify-between text-sm">
                                                    <div>
                                                        <span className="font-medium">{lead.firstName} {lead.lastName}</span>
                                                        {lead.company && <span className="text-muted-foreground ml-2">• {lead.company}</span>}
                                                    </div>
                                                    <Badge variant="outline">{lead.email}</Badge>
                                                </div>
                                            ))}
                                            {leads.length > 10 && (
                                                <p className="text-xs text-muted-foreground">...and {leads.length - 10} more</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Project Context */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex gap-2">
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-900">
                                        <p className="font-semibold mb-1">This context will be used by AI to personalize every message</p>
                                        <p className="text-blue-700">The more detailed and specific you are, the better the AI can craft relevant, personalized outreach.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="userName">Your Name *</Label>
                                    <Input
                                        id="userName"
                                        placeholder="e.g., Krishna Patel"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="userTitle">Your Title *</Label>
                                    <Input
                                        id="userTitle"
                                        placeholder="e.g., Founder"
                                        value={userTitle}
                                        onChange={(e) => setUserTitle(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Company Name *</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="e.g., The Utility Company"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="productName">Product/Project Name *</Label>
                                    <Input
                                        id="productName"
                                        placeholder="e.g., PortalPay"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="campaignBriefing">Product/Campaign Briefing * (Detailed)</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => enhanceText("briefing", campaignBriefing, setCampaignBriefing, setEnhancingBriefing)}
                                        disabled={enhancingBriefing || !campaignBriefing.trim()}
                                        className="h-7 text-xs gap-1"
                                    >
                                        {enhancingBriefing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                        Enhance with AI
                                    </Button>
                                </div>
                                <Textarea
                                    id="campaignBriefing"
                                    placeholder={`Describe your product in detail. Include:
- What it does and key innovations
- Technology stack
- Key differentiators
- Market opportunity
- Traction metrics
- Target audience

Example from vcrun.py:
"- Crypto-native payment gateway enabling physical merchants to accept stablecoins
- Multi-Token Infrastructure: USDC, USDT, cbBTC, cbXRP, ETH on Base
- Cost Revolution: 2–3% savings vs card rails
- Instant Settlement: Real-time finality
- White-Label Platform: Fully branded portals
..."`}
                                    rows={12}
                                    value={campaignBriefing}
                                    onChange={(e) => setCampaignBriefing(e.target.value)}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {campaignBriefing.length} characters • Be comprehensive - this is the core context for personalization
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="meetingPreferences">Meeting Preferences</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => enhanceText("preferences", meetingPreferences, setMeetingPreferences, setEnhancingPreferences)}
                                        disabled={enhancingPreferences || !meetingPreferences.trim()}
                                        className="h-7 text-xs gap-1"
                                    >
                                        {enhancingPreferences ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                        Enhance with AI
                                    </Button>
                                </div>
                                <Textarea
                                    id="meetingPreferences"
                                    placeholder="e.g., Based in Santa Fe, NM. Available for remote meetings with all investors..."
                                    rows={4}
                                    value={meetingPreferences}
                                    onChange={(e) => setMeetingPreferences(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: AI Prompt Template */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-900">
                                        <p className="font-semibold mb-1">This is your master AI prompt template</p>
                                        <p className="text-amber-700">Variables like {`{LEAD_NAME}, {PRODUCT_NAME}, {PROJECT_BRIEFING}`} will be automatically filled for each lead. Edit carefully to maintain proper formatting.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>AI Prompt Template</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="default"
                                            size="sm"
                                            onClick={generateUniquePrompt}
                                            disabled={generatingPrompt || !campaignBriefing.trim()}
                                            className="gap-1"
                                        >
                                            {generatingPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            Generate Unique Prompt with AI
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPromptTemplate(buildPopulatedPromptTemplate())}
                                        >
                                            <RefreshCw className="w-3 h-3 mr-1" />
                                            Reset to Default
                                        </Button>
                                    </div>
                                </div>
                                <Textarea
                                    value={promptTemplate}
                                    onChange={(e) => setPromptTemplate(e.target.value)}
                                    rows={25}
                                    className="font-mono text-xs"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {promptTemplate.length} characters • Variables: {`{USER_NAME}, {PRODUCT_NAME}, {PROJECT_BRIEFING}, {LEAD_NAME}, {LEAD_COMPANY}`}, etc.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-semibold">Research Settings</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="includeResearch"
                                        checked={includeResearch}
                                        onChange={(e) => setIncludeResearch(e.target.checked)}
                                    />
                                    <Label htmlFor="includeResearch" className="font-normal">
                                        Include company research and website scraping for each lead
                                    </Label>
                                </div>
                                <p className="text-xs text-muted-foreground ml-6">
                                    AI will research each lead's company and scrape their website for additional context
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Preview & Test */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                                <div className="flex gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-900">
                                        <p className="font-bold mb-1">IMPORTANT: Test Sends are Safe</p>
                                        <p className="text-red-800">Test emails/SMS will ONLY be sent to the email/phone YOU enter below - NEVER to the actual lead contact. The lead data is only used to generate realistic previews.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Select Lead for Preview Generation</Label>
                                <select
                                    className="w-full border rounded-md p-2"
                                    value={selectedLeadForPreview?.id || ""}
                                    onChange={(e) => {
                                        const lead = leads.find(l => l.id === e.target.value);
                                        setSelectedLeadForPreview(lead || null);
                                    }}
                                >
                                    {leads.map((lead) => (
                                        <option key={lead.id} value={lead.id}>
                                            {lead.firstName} {lead.lastName} ({lead.email}) - {lead.company}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    This lead's data will be used to generate a realistic preview, but test sends will go to YOUR email/phone
                                </p>
                            </div>

                            <Tabs defaultValue="email" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="email" disabled={!selectedChannels.includes("EMAIL")}>
                                        <Mail className="w-4 h-4 mr-2" />
                                        Email Preview
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="sms"
                                        disabled={!selectedChannels.includes("SMS") || !smsConfigured}
                                        className="relative"
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        SMS Preview
                                        {!smsConfigured && selectedChannels.includes("SMS") && (
                                            <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4 bg-amber-100 text-amber-700 border-amber-300">
                                                Not Active
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                {/* SMS Not Configured Warning */}
                                {!smsConfigured && selectedChannels.includes("SMS") && (
                                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-amber-900">SMS is Not Yet Active</p>
                                                <p className="text-sm text-amber-800 mt-1">
                                                    SMS messaging requires 10DLC registration and a verified phone number.
                                                    This process typically takes 5-7 business days for approval.
                                                </p>
                                                <p className="text-sm text-amber-700 mt-2">
                                                    <strong>To enable SMS:</strong> Go to Team Settings → Message Portal to configure your SMS number,
                                                    or contact your administrator to complete the 10DLC registration.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <TabsContent value="email" className="space-y-4 mt-4">
                                    <Button onClick={generateEmailPreview} disabled={generatingEmail} className="w-full">
                                        {generatingEmail ? "Generating..." : "Generate Email Preview"}
                                    </Button>

                                    {emailPreview && (
                                        <div className="space-y-4">
                                            <div>
                                                <Label>Subject</Label>
                                                <div className="p-3 border rounded-lg bg-muted/50 font-semibold">
                                                    {emailPreview.subject}
                                                </div>
                                            </div>

                                            <div>
                                                <Label>Body (Plain Text)</Label>
                                                <div className="p-3 border rounded-lg bg-muted/50 whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">
                                                    {emailPreview.bodyText}
                                                </div>
                                            </div>

                                            <div>
                                                <Label>HTML Preview</Label>
                                                <div className="border rounded-lg bg-white p-4 max-h-96 overflow-y-auto">
                                                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(emailPreview.html) }} />
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <Label htmlFor="testEmail" className="text-base font-semibold">Test Email Address (YOUR email, not the lead's)</Label>
                                                <div className="flex gap-2 mt-2">
                                                    <Input
                                                        id="testEmail"
                                                        type="email"
                                                        placeholder="your@email.com"
                                                        value={testEmail}
                                                        onChange={(e) => setTestEmail(e.target.value)}
                                                    />
                                                    <Button onClick={sendTestEmail} disabled={sendingTestEmail}>
                                                        {sendingTestEmail ? "Sending..." : "Send Test"}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-red-600 mt-1 font-medium">
                                                    ⚠️ Will be sent to {testEmail || "YOUR email"} - NOT to {selectedLeadForPreview?.email}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="sms" className="space-y-4 mt-4">
                                    <Button onClick={generateSmsPreview} disabled={generatingSms} className="w-full">
                                        {generatingSms ? "Generating..." : "Generate SMS Preview"}
                                    </Button>

                                    {smsPreview && (
                                        <div className="space-y-4">
                                            <div>
                                                <Label>Message</Label>
                                                <div className="p-3 border rounded-lg bg-muted/50 whitespace-pre-wrap">
                                                    {smsPreview.body}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Characters: {smsPreview.body?.length || 0} / 160
                                                </p>
                                            </div>

                                            <div className="border-t pt-4">
                                                <Label htmlFor="testPhone" className="text-base font-semibold">Test Phone Number (YOUR phone, not the lead's)</Label>
                                                <div className="flex gap-2 mt-2">
                                                    <Input
                                                        id="testPhone"
                                                        type="tel"
                                                        placeholder="+1234567890"
                                                        value={testPhone}
                                                        onChange={(e) => setTestPhone(e.target.value)}
                                                    />
                                                    <Button onClick={sendTestSms} disabled={sendingTestSms}>
                                                        {sendingTestSms ? "Sending..." : "Send Test"}
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-red-600 mt-1 font-medium">
                                                    ⚠️ Will be sent to {testPhone || "YOUR phone"} - NOT to {selectedLeadForPreview?.phone}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                </Button>

                <div className="flex items-center gap-4">
                    {/* Draft indicator */}
                    {draftCampaignId && (
                        <div className="flex items-center gap-2 text-sm">
                            {savingDraft ? (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Saving...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-green-600">
                                    <Cloud className="w-3 h-3" />
                                    <span>Draft saved</span>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                        Step {currentStep} of {steps.length}
                    </div>
                </div>

                {currentStep < 4 ? (
                    <Button
                        onClick={nextStep}
                        disabled={!canProceed()}
                    >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={launchCampaign}
                        disabled={loading || !canProceed()}
                    >
                        {loading ? "Creating Campaign..." : "Launch Campaign"}
                        <Send className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
