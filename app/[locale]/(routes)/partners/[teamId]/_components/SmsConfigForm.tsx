"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    Loader2,
    Save,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Sparkles,
    Phone,
    Building2,
    MessageSquare,
} from "lucide-react";

// Vertical options for 10DLC registration
const VERTICAL_OPTIONS = [
    "AGRICULTURE",
    "AUTOMOTIVE",
    "BANKING",
    "CONSTRUCTION",
    "CONSUMER",
    "EDUCATION",
    "ENERGY",
    "ENGINEERING",
    "ENTERTAINMENT",
    "FINANCIAL",
    "GAMING",
    "GOVERNMENT",
    "HEALTHCARE",
    "HOSPITALITY",
    "INSURANCE",
    "LEGAL",
    "MANUFACTURING",
    "MEDIA",
    "NGO",
    "POLITICAL",
    "REAL_ESTATE",
    "RELIGIOUS",
    "RETAIL",
    "TECHNOLOGY",
    "TELECOM",
    "TRANSPORTATION",
    "TRAVEL",
];

const COMPANY_TYPE_OPTIONS = [
    { value: "PRIVATE_PROFIT", label: "Private/For-Profit" },
    { value: "PUBLIC_PROFIT", label: "Public/For-Profit" },
    { value: "NON_PROFIT", label: "Non-Profit" },
    { value: "GOVERNMENT", label: "Government" },
    { value: "SOLE_PROPRIETOR", label: "Sole Proprietor" },
];

const USE_CASE_OPTIONS = [
    { value: "ACCOUNT_NOTIFICATION", label: "Account Notification (Transactional)" },
    { value: "TWO_FACTOR_AUTHENTICATION", label: "Two-Factor Authentication" },
    { value: "CUSTOMER_CARE", label: "Customer Care" },
    { value: "DELIVERY_NOTIFICATION", label: "Delivery Notification" },
    { value: "FRAUD_ALERT", label: "Fraud Alert" },
    { value: "MARKETING", label: "Marketing (Promotional)" },
    { value: "MIXED", label: "Mixed" },
    { value: "LOW_VOLUME", label: "Low Volume" },
];

interface SmsConfigFormProps {
    teamId: string;
    teamName: string;
}

interface SmsConfig {
    id?: string;
    brand_registration_id?: string;
    brand_status?: string;
    brand_name?: string;
    brand_ein?: string;
    brand_vertical?: string;
    brand_company_type?: string;
    brand_website_url?: string;
    brand_street?: string;
    brand_city?: string;
    brand_state?: string;
    brand_postal_code?: string;
    brand_country_code?: string;
    brand_contact_email?: string;
    brand_contact_phone?: string;
    brand_support_email?: string;
    brand_support_phone?: string;
    campaign_registration_id?: string;
    campaign_status?: string;
    campaign_use_case?: string;
    campaign_description?: string;
    campaign_message_flow?: string;
    campaign_sample_messages?: string[];
    campaign_help_message?: string;
    campaign_opt_out_message?: string;
    phone_number_id?: string;
    phone_number?: string;
    phone_number_arn?: string;
    phone_number_status?: string;
    sms_enabled?: boolean;
    monthly_budget?: number;
    daily_limit?: number;
}

function StatusBadge({ status }: { status?: string }) {
    if (!status) return <Badge variant="outline">Not Started</Badge>;

    switch (status) {
        case "APPROVED":
            return (
                <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Approved
                </Badge>
            );
        case "SUBMITTED":
            return (
                <Badge className="bg-yellow-500">
                    <Clock className="w-3 h-3 mr-1" />
                    Submitted
                </Badge>
            );
        case "DENIED":
            return (
                <Badge className="bg-red-500">
                    <XCircle className="w-3 h-3 mr-1" />
                    Denied
                </Badge>
            );
        case "REQUIRES_UPDATE":
            return (
                <Badge className="bg-orange-500">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Requires Update
                </Badge>
            );
        case "PENDING":
        default:
            return (
                <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                </Badge>
            );
    }
}

export default function SmsConfigForm({ teamId, teamName }: SmsConfigFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoPopulating, setAutoPopulating] = useState(false);
    const [config, setConfig] = useState<SmsConfig>({
        brand_country_code: "US",
        campaign_use_case: "ACCOUNT_NOTIFICATION",
        sms_enabled: false,
        monthly_budget: 0,
        daily_limit: 100,
        campaign_sample_messages: [],
    });
    const [sampleMessagesText, setSampleMessagesText] = useState("");

    // Load existing config
    useEffect(() => {
        async function loadConfig() {
            try {
                const res = await fetch(`/api/teams/${teamId}/sms-config`);
                const data = await res.json();

                if (data.sms_config) {
                    setConfig(data.sms_config);
                    setSampleMessagesText(
                        data.sms_config.campaign_sample_messages?.join("\n\n") || ""
                    );
                }
            } catch (error) {
                console.error("Failed to load SMS config:", error);
                toast.error("Failed to load SMS configuration");
            } finally {
                setLoading(false);
            }
        }

        loadConfig();
    }, [teamId]);

    // Handle form field changes
    const handleChange = (field: keyof SmsConfig, value: any) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
    };

    // Save configuration
    const handleSave = async () => {
        setSaving(true);
        try {
            // Parse sample messages from textarea
            const sampleMessages = sampleMessagesText
                .split("\n\n")
                .filter((msg) => msg.trim())
                .slice(0, 5); // Max 5 sample messages

            const payload = {
                ...config,
                campaign_sample_messages: sampleMessages,
            };

            const res = await fetch(`/api/teams/${teamId}/sms-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save");
            }

            toast.success("SMS configuration saved successfully");
            router.refresh();
        } catch (error: any) {
            console.error("Failed to save SMS config:", error);
            toast.error(error.message || "Failed to save SMS configuration");
        } finally {
            setSaving(false);
        }
    };

    // AI Auto-populate based on team info
    const handleAutoPopulate = async () => {
        setAutoPopulating(true);
        try {
            // For now, use default Ledger1 template values
            // In future, this could call an AI endpoint to generate based on team details
            setConfig((prev) => ({
                ...prev,
                brand_vertical: prev.brand_vertical || "TECHNOLOGY",
                brand_company_type: prev.brand_company_type || "PRIVATE_PROFIT",
                campaign_use_case: "ACCOUNT_NOTIFICATION",
                campaign_description:
                    prev.campaign_description ||
                    `${teamName} Message Portal Notifications. When users send outreach messages to business contacts, the recipient receives an SMS notification with a secure link to view the full message in a web portal. This is used for B2B sales outreach and business communications.`,
                campaign_message_flow:
                    prev.campaign_message_flow ||
                    "Recipients opt-in when they are added as a lead/contact in the CRM. Business users initiate outreach through the Push to Outreach feature. Recipients can opt-out at any time by replying STOP or clicking unsubscribe in the portal.",
                campaign_help_message:
                    prev.campaign_help_message ||
                    `${teamName} Message Portal: You're receiving notifications about secure business messages. Reply STOP to opt out. Contact support for help.`,
                campaign_opt_out_message:
                    prev.campaign_opt_out_message ||
                    "You've been unsubscribed from message notifications. You will no longer receive SMS alerts. Reply START to re-subscribe.",
            }));

            setSampleMessagesText(
                `You have a new message from {SenderName} at ${teamName}. View it here: {PortalLink}. Reply STOP to unsubscribe.\n\n{RecipientName}, there's a message waiting for you in your secure portal: {PortalLink}. Reply STOP to opt out.\n\nNew business communication from ${teamName}. Read the full message: {PortalLink}. Text STOP to unsubscribe.`
            );

            toast.success("Auto-populated with template values");
        } catch (error) {
            console.error("Auto-populate failed:", error);
            toast.error("Failed to auto-populate");
        } finally {
            setAutoPopulating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">10DLC SMS Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure brand and campaign registration for compliant SMS messaging
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleAutoPopulate}
                        disabled={autoPopulating}
                    >
                        {autoPopulating ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Auto-Populate
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Configuration
                    </Button>
                </div>
            </div>

            {/* Brand Registration Section */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            <CardTitle>Brand Registration</CardTitle>
                        </div>
                        <StatusBadge status={config.brand_status} />
                    </div>
                    <CardDescription>
                        Company information for 10DLC brand verification
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Registration ID</Label>
                            <Input
                                value={config.brand_registration_id || ""}
                                onChange={(e) =>
                                    handleChange("brand_registration_id", e.target.value)
                                }
                                placeholder="registration-xxxxx (from AWS)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={config.brand_status || "PENDING"}
                                onValueChange={(v) => handleChange("brand_status", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="DENIED">Denied</SelectItem>
                                    <SelectItem value="REQUIRES_UPDATE">Requires Update</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input
                                value={config.brand_name || ""}
                                onChange={(e) => handleChange("brand_name", e.target.value)}
                                placeholder="Your Company LLC"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>EIN (Tax ID)</Label>
                            <Input
                                value={config.brand_ein || ""}
                                onChange={(e) => handleChange("brand_ein", e.target.value)}
                                placeholder="XX-XXXXXXX"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Industry Vertical</Label>
                            <Select
                                value={config.brand_vertical || ""}
                                onValueChange={(v) => handleChange("brand_vertical", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select vertical..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {VERTICAL_OPTIONS.map((v) => (
                                        <SelectItem key={v} value={v}>
                                            {v.replace(/_/g, " ")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Company Type</Label>
                            <Select
                                value={config.brand_company_type || ""}
                                onValueChange={(v) => handleChange("brand_company_type", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMPANY_TYPE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Website URL</Label>
                        <Input
                            value={config.brand_website_url || ""}
                            onChange={(e) => handleChange("brand_website_url", e.target.value)}
                            placeholder="https://yourcompany.com"
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>Street Address</Label>
                        <Input
                            value={config.brand_street || ""}
                            onChange={(e) => handleChange("brand_street", e.target.value)}
                            placeholder="123 Main St"
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input
                                value={config.brand_city || ""}
                                onChange={(e) => handleChange("brand_city", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>State</Label>
                            <Input
                                value={config.brand_state || ""}
                                onChange={(e) => handleChange("brand_state", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Postal Code</Label>
                            <Input
                                value={config.brand_postal_code || ""}
                                onChange={(e) => handleChange("brand_postal_code", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Input
                                value={config.brand_country_code || "US"}
                                onChange={(e) => handleChange("brand_country_code", e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Contact Email</Label>
                            <Input
                                type="email"
                                value={config.brand_contact_email || ""}
                                onChange={(e) =>
                                    handleChange("brand_contact_email", e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Phone</Label>
                            <Input
                                value={config.brand_contact_phone || ""}
                                onChange={(e) =>
                                    handleChange("brand_contact_phone", e.target.value)
                                }
                                placeholder="+15551234567"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Support Email</Label>
                            <Input
                                type="email"
                                value={config.brand_support_email || ""}
                                onChange={(e) =>
                                    handleChange("brand_support_email", e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Support Phone</Label>
                            <Input
                                value={config.brand_support_phone || ""}
                                onChange={(e) =>
                                    handleChange("brand_support_phone", e.target.value)
                                }
                                placeholder="+15551234567"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Campaign Registration Section */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            <CardTitle>Campaign Registration</CardTitle>
                        </div>
                        <StatusBadge status={config.campaign_status} />
                    </div>
                    <CardDescription>
                        SMS campaign details and use case for message approval
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Registration ID</Label>
                            <Input
                                value={config.campaign_registration_id || ""}
                                onChange={(e) =>
                                    handleChange("campaign_registration_id", e.target.value)
                                }
                                placeholder="registration-xxxxx (from AWS)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={config.campaign_status || "PENDING"}
                                onValueChange={(v) => handleChange("campaign_status", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="DENIED">Denied</SelectItem>
                                    <SelectItem value="REQUIRES_UPDATE">Requires Update</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Use Case</Label>
                        <Select
                            value={config.campaign_use_case || "ACCOUNT_NOTIFICATION"}
                            onValueChange={(v) => handleChange("campaign_use_case", v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {USE_CASE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Campaign Description</Label>
                        <Textarea
                            value={config.campaign_description || ""}
                            onChange={(e) =>
                                handleChange("campaign_description", e.target.value)
                            }
                            placeholder="Describe what your SMS campaign is used for..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Message Flow (How users opt-in)</Label>
                        <Textarea
                            value={config.campaign_message_flow || ""}
                            onChange={(e) =>
                                handleChange("campaign_message_flow", e.target.value)
                            }
                            placeholder="Describe how recipients opt-in to receive messages..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Sample Messages (separate with blank lines, max 5)</Label>
                        <Textarea
                            value={sampleMessagesText}
                            onChange={(e) => setSampleMessagesText(e.target.value)}
                            placeholder="Sample message 1...&#10;&#10;Sample message 2..."
                            rows={6}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>HELP Response Message</Label>
                        <Textarea
                            value={config.campaign_help_message || ""}
                            onChange={(e) =>
                                handleChange("campaign_help_message", e.target.value)
                            }
                            placeholder="Message sent when user texts HELP..."
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>STOP Response Message</Label>
                        <Textarea
                            value={config.campaign_opt_out_message || ""}
                            onChange={(e) =>
                                handleChange("campaign_opt_out_message", e.target.value)
                            }
                            placeholder="Message sent when user texts STOP..."
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Phone Number Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        <CardTitle>Phone Number</CardTitle>
                    </div>
                    <CardDescription>
                        10DLC phone number assigned after campaign approval
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                value={config.phone_number || ""}
                                onChange={(e) => handleChange("phone_number", e.target.value)}
                                placeholder="+15551234567"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number ID</Label>
                            <Input
                                value={config.phone_number_id || ""}
                                onChange={(e) => handleChange("phone_number_id", e.target.value)}
                                placeholder="phone-pool-xxxx"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Input
                                value={config.phone_number_status || ""}
                                onChange={(e) =>
                                    handleChange("phone_number_status", e.target.value)
                                }
                                placeholder="ACTIVE"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Phone Number ARN</Label>
                        <Input
                            value={config.phone_number_arn || ""}
                            onChange={(e) => handleChange("phone_number_arn", e.target.value)}
                            placeholder="arn:aws:sms-voice:..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Configuration Section */}
            <Card>
                <CardHeader>
                    <CardTitle>SMS Settings</CardTitle>
                    <CardDescription>
                        Enable/disable SMS and set usage limits
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable SMS Sending</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow this team to send SMS messages
                            </p>
                        </div>
                        <Switch
                            checked={config.sms_enabled || false}
                            onCheckedChange={(v) => handleChange("sms_enabled", v)}
                        />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Monthly Budget ($)</Label>
                            <Input
                                type="number"
                                value={config.monthly_budget || 0}
                                onChange={(e) =>
                                    handleChange("monthly_budget", parseFloat(e.target.value) || 0)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Daily Message Limit</Label>
                            <Input
                                type="number"
                                value={config.daily_limit || 100}
                                onChange={(e) =>
                                    handleChange("daily_limit", parseInt(e.target.value) || 100)
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
