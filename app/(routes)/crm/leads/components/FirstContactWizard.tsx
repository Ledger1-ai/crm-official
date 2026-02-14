"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { sanitizeHtml } from "@/lib/sanitize-html";

/**
 * FirstContactWizard
 * - Comprehensive prompt builder for Email + SMS
 * - Optional research inclusion (basic website meta scrape)
 * - Email HTML preview (rendered from server-side using OutreachTemplate)
 * - SMS text preview
 * - Test send controls: user-entered email or phone
 * - References the project assigned to the lead and specific lead information (handled server-side in preview routes)
 *
 * Server Endpoints Used:
 * - POST /api/outreach/preview/email/:leadId { promptOverride?:string, includeResearch?:boolean, meetingLinkOverride?:string }
 *   => { subject, bodyText, html, project, researchSummary }
 * - POST /api/outreach/preview/sms/:leadId { promptOverride?:string, includeResearch?:boolean, meetingLinkOverride?:string }
 *   => { body }
 * - POST /api/outreach/send { leadIds:[leadId], test:true, promptOverride?:string, meetingLinkOverride?:string, testEmail?:string }
 * - POST /api/outreach/sms { leadIds:[leadId], test:true, promptOverride?:string, senderId?:string, testPhone?:string }
 */

type Props = {
    leadId: string;
};

export default function FirstContactWizard({ leadId }: Props) {
    // Shared prompt builder state
    const [promptOverride, setPromptOverride] = useState<string>("");
    const [includeResearch, setIncludeResearch] = useState<boolean>(true);
    const [meetingLinkOverride, setMeetingLinkOverride] = useState<string>("");

    // Email preview state
    const [emailSubject, setEmailSubject] = useState<string>("");
    const [emailBodyText, setEmailBodyText] = useState<string>("");
    const [emailHtml, setEmailHtml] = useState<string>("");
    const [emailCampaign, setEmailCampaign] = useState<{ title?: string; description?: string } | null>(null);
    const [emailResearchSummary, setEmailResearchSummary] = useState<string>("");

    // SMS preview state
    const [smsBody, setSmsBody] = useState<string>("");

    // Test send targets
    const [testEmail, setTestEmail] = useState<string>("");
    const [testPhone, setTestPhone] = useState<string>("");
    const [senderId, setSenderId] = useState<string>(""); // for SMS (Amazon Pinpoint regions)

    const [loadingEmailPreview, setLoadingEmailPreview] = useState<boolean>(false);
    const [loadingSmsPreview, setLoadingSmsPreview] = useState<boolean>(false);
    const [sendingTestEmail, setSendingTestEmail] = useState<boolean>(false);
    const [sendingTestSms, setSendingTestSms] = useState<boolean>(false);

    async function generateEmailPreview() {
        setLoadingEmailPreview(true);
        try {
            const res = await fetch(`/api/outreach/preview/email/${encodeURIComponent(leadId)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    promptOverride: promptOverride || undefined,
                    includeResearch,
                    meetingLinkOverride: meetingLinkOverride || undefined,
                }),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Failed to generate email preview");
            }
            const j = await res.json();
            setEmailSubject(String(j.subject || ""));
            setEmailBodyText(String(j.bodyText || ""));
            setEmailHtml(String(j.html || ""));
            setEmailCampaign(j.project || null); // Note: API might still return 'project' key for now
            setEmailResearchSummary(String(j.researchSummary || ""));
            toast.success("Email preview generated");
        } catch (e: any) {
            toast.error(e?.message || "Failed to generate email preview");
        } finally {
            setLoadingEmailPreview(false);
        }
    }

    async function generateSmsPreview() {
        setLoadingSmsPreview(true);
        try {
            const res = await fetch(`/api/outreach/preview/sms/${encodeURIComponent(leadId)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    promptOverride: promptOverride || undefined,
                    includeResearch,
                    meetingLinkOverride: meetingLinkOverride || undefined,
                }),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Failed to generate SMS preview");
            }
            const j = await res.json();
            setSmsBody(String(j.body || ""));
            toast.success("SMS preview generated");
        } catch (e: any) {
            toast.error(e?.message || "Failed to generate SMS preview");
        } finally {
            setLoadingSmsPreview(false);
        }
    }

    async function sendTestEmail() {
        if (!testEmail || !testEmail.includes("@")) {
            toast.error("Enter a valid test email address");
            return;
        }
        setSendingTestEmail(true);
        try {
            const res = await fetch("/api/outreach/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leadIds: [leadId],
                    test: true,
                    testEmail,
                    promptOverride: promptOverride || undefined,
                    meetingLinkOverride: meetingLinkOverride || undefined,
                }),
            });
            const j = await res.json().catch(() => ({}));
            if (res.ok) {
                const sentCount = Number(j?.sent || 0);
                toast.success(`Test email sent${sentCount ? ` (${sentCount})` : ""}`);
            } else {
                toast.error(String(j?.message || "Failed to send test email"));
            }
        } catch (e: any) {
            toast.error(e?.message || "Failed to send test email");
        } finally {
            setSendingTestEmail(false);
        }
    }

    async function sendTestSms() {
        if (!testPhone || !testPhone.trim()) {
            toast.error("Enter a valid test phone number");
            return;
        }
        setSendingTestSms(true);
        try {
            const res = await fetch("/api/outreach/sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leadIds: [leadId],
                    test: true,
                    testPhone,
                    senderId: senderId || undefined,
                    promptOverride: promptOverride || undefined,
                }),
            });
            const j = await res.json().catch(() => ({}));
            if (res.ok) {
                const sentCount = Number(j?.sent || 0);
                toast.success(`Test SMS sent${sentCount ? ` (${sentCount})` : ""}`);
            } else {
                toast.error(String(j?.message || "Failed to send test SMS"));
            }
        } catch (e: any) {
            toast.error(e?.message || "Failed to send test SMS");
        } finally {
            setSendingTestSms(false);
        }
    }

    return (
        <div className="rounded border bg-muted/10 p-4 space-y-4">
            <div className="text-sm font-semibold">Initiate First Contact Wizard</div>

            {/* Prompt Builder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 space-y-2">
                    <div className="text-xs font-medium">Prompt Override (optional)</div>
                    <Textarea
                        rows={6}
                        placeholder="Provide a custom prompt to guide personalization. If empty, the user's default prompt will be used."
                        value={promptOverride}
                        onChange={(e) => setPromptOverride(e.target.value)}
                    />
                    <div className="flex items-center gap-3">
                        <label className="text-sm flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={includeResearch}
                                onChange={(e) => setIncludeResearch(e.target.checked)}
                            />
                            Include basic company research
                        </label>
                    </div>
                    <div className="text-xs font-medium mt-2">Meeting Link Override (optional)</div>
                    <Input
                        placeholder="https://..."
                        value={meetingLinkOverride}
                        onChange={(e) => setMeetingLinkOverride(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <div className="text-xs font-medium">Test Email Address</div>
                    <Input
                        placeholder="you@example.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                    />
                    <div className="text-xs font-medium mt-2">Test Phone Number</div>
                    <Input
                        placeholder="+15555550123"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground">
                        SMS Sender ID (optional; region-specific)
                    </div>
                    <Input
                        placeholder="SURGE"
                        value={senderId}
                        onChange={(e) => setSenderId(e.target.value)}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                <Button onClick={generateEmailPreview} disabled={loadingEmailPreview}>
                    {loadingEmailPreview ? "Generating Email..." : "Generate Email Preview"}
                </Button>
                <Button onClick={generateSmsPreview} variant="secondary" disabled={loadingSmsPreview}>
                    {loadingSmsPreview ? "Generating SMS..." : "Generate SMS Preview"}
                </Button>
                <Button onClick={sendTestEmail} variant="outline" disabled={sendingTestEmail}>
                    {sendingTestEmail ? "Sending Test Email..." : "Send Test Email"}
                </Button>
                <Button onClick={sendTestSms} variant="outline" disabled={sendingTestSms}>
                    {sendingTestSms ? "Sending Test SMS..." : "Send Test SMS"}
                </Button>
            </div>

            {/* Email Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-2">
                    <div className="text-xs font-semibold">Email Subject</div>
                    <div className="rounded border bg-card p-2 text-sm min-h-[40px]">
                        {emailSubject || "(no subject yet)"}
                    </div>
                    <div className="text-xs font-semibold mt-2">Email Body (Plain Text)</div>
                    <div className="rounded border bg-card p-2 text-sm whitespace-pre-wrap min-h-[120px]">
                        {emailBodyText || "(no body yet)"}
                    </div>
                    <div className="text-xs font-semibold mt-2">Campaign & Research References</div>
                    <div className="rounded border bg-card p-2 text-xs">
                        {emailCampaign ? (
                            <>
                                <div><span className="font-medium">Campaign:</span> {emailCampaign.title || "(untitled)"}</div>
                                {emailCampaign.description ? (
                                    <div className="text-muted-foreground">{emailCampaign.description}</div>
                                ) : null}
                            </>
                        ) : (
                            <div className="text-muted-foreground">(no campaign reference)</div>
                        )}
                        {emailResearchSummary ? (
                            <div className="mt-2">
                                <div className="font-medium">Research Summary</div>
                                <div className="text-muted-foreground">{emailResearchSummary}</div>
                            </div>
                        ) : (
                            <div className="text-muted-foreground">(no research included)</div>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="text-xs font-semibold">Email HTML Preview</div>
                    <div className="rounded border bg-white p-2 min-h-[240px] overflow-auto">
                        {emailHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(emailHtml) }} />
                        ) : (
                            <div className="text-xs text-muted-foreground p-2">
                                Generate email preview to see the rendered template.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SMS Preview */}
            <div className="space-y-2">
                <div className="text-xs font-semibold">SMS Text Preview</div>
                <div className="rounded border bg-card p-2 text-sm whitespace-pre-wrap min-h-[80px]">
                    {smsBody || "(no sms yet)"}
                </div>
            </div>
        </div>
    );
}
