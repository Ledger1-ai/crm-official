"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, ExternalLink } from "lucide-react";
import {
    FaXTwitter, FaDiscord, FaLinkedin, FaInstagram, FaFacebook,
    FaYoutube, FaTiktok, FaGithub, FaTelegram, FaReddit, FaThreads, FaMastodon,
    FaAppStore, FaGooglePlay, FaEnvelope, FaPhone
} from "react-icons/fa6";

interface SocialSettings {
    id?: string;
    xTwitterUrl: string;
    discordUrl: string;
    linkedinUrl: string;
    instagramUrl: string;
    facebookUrl: string;
    youtubeUrl: string;
    tiktokUrl: string;
    githubUrl: string;
    telegramUrl: string;
    redditUrl: string;
    threadsUrl: string;
    mastodonUrl: string;
    emailSupport: string;
    emailSales: string;
    phoneNumber: string;
    appStoreUrl: string;
    playStoreUrl: string;
    newsletterEnabled: boolean;
    ctaText: string;
}

const defaultSettings: SocialSettings = {
    xTwitterUrl: "",
    discordUrl: "",
    linkedinUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    githubUrl: "",
    telegramUrl: "",
    redditUrl: "",
    threadsUrl: "",
    mastodonUrl: "",
    emailSupport: "",
    emailSales: "",
    phoneNumber: "",
    appStoreUrl: "",
    playStoreUrl: "",
    newsletterEnabled: true,
    ctaText: "Stay Updated",
};

export default function SocialAdminPage() {
    const [settings, setSettings] = useState<SocialSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/social");
            const data = await res.json();
            setSettings({ ...defaultSettings, ...data });
        } catch (error) {
            toast.error("Failed to fetch settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/social", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (!res.ok) throw new Error("Failed to save");
            toast.success("Social settings saved!");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof SocialSettings, value: string | boolean) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Social Media Settings</h1>
                    <p className="text-slate-400 mt-1">Manage all your social links in one place.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </button>
            </div>

            {/* Primary Social Platforms */}
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5 font-medium text-white">
                    Primary Social Platforms
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SocialInput icon={<FaXTwitter />} label="X (Twitter)" value={settings.xTwitterUrl} onChange={v => updateField("xTwitterUrl", v)} placeholder="https://x.com/..." />
                    <SocialInput icon={<FaDiscord />} label="Discord" value={settings.discordUrl} onChange={v => updateField("discordUrl", v)} placeholder="https://discord.gg/..." />
                    <SocialInput icon={<FaLinkedin />} label="LinkedIn" value={settings.linkedinUrl} onChange={v => updateField("linkedinUrl", v)} placeholder="https://linkedin.com/company/..." />
                    <SocialInput icon={<FaInstagram />} label="Instagram" value={settings.instagramUrl} onChange={v => updateField("instagramUrl", v)} placeholder="https://instagram.com/..." />
                    <SocialInput icon={<FaFacebook />} label="Facebook" value={settings.facebookUrl} onChange={v => updateField("facebookUrl", v)} placeholder="https://facebook.com/..." />
                    <SocialInput icon={<FaYoutube />} label="YouTube" value={settings.youtubeUrl} onChange={v => updateField("youtubeUrl", v)} placeholder="https://youtube.com/@..." />
                </div>
            </div>

            {/* Secondary Social Platforms */}
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5 font-medium text-white">
                    More Platforms
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SocialInput icon={<FaTiktok />} label="TikTok" value={settings.tiktokUrl} onChange={v => updateField("tiktokUrl", v)} placeholder="https://tiktok.com/@..." />
                    <SocialInput icon={<FaGithub />} label="GitHub" value={settings.githubUrl} onChange={v => updateField("githubUrl", v)} placeholder="https://github.com/..." />
                    <SocialInput icon={<FaTelegram />} label="Telegram" value={settings.telegramUrl} onChange={v => updateField("telegramUrl", v)} placeholder="https://t.me/..." />
                    <SocialInput icon={<FaReddit />} label="Reddit" value={settings.redditUrl} onChange={v => updateField("redditUrl", v)} placeholder="https://reddit.com/r/..." />
                    <SocialInput icon={<FaThreads />} label="Threads" value={settings.threadsUrl} onChange={v => updateField("threadsUrl", v)} placeholder="https://threads.net/@..." />
                    <SocialInput icon={<FaMastodon />} label="Mastodon" value={settings.mastodonUrl} onChange={v => updateField("mastodonUrl", v)} placeholder="https://mastodon.social/@..." />
                </div>
            </div>

            {/* Contact & App Stores */}
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5 font-medium text-white">
                    Contact & Downloads
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SocialInput icon={<FaEnvelope />} label="Support Email" value={settings.emailSupport} onChange={v => updateField("emailSupport", v)} placeholder="support@..." />
                    <SocialInput icon={<FaEnvelope />} label="Sales Email" value={settings.emailSales} onChange={v => updateField("emailSales", v)} placeholder="sales@..." />
                    <SocialInput icon={<FaPhone />} label="Phone Number" value={settings.phoneNumber} onChange={v => updateField("phoneNumber", v)} placeholder="+1 (555) 123-4567" />
                    <SocialInput icon={<FaAppStore />} label="App Store URL" value={settings.appStoreUrl} onChange={v => updateField("appStoreUrl", v)} placeholder="https://apps.apple.com/..." />
                    <SocialInput icon={<FaGooglePlay />} label="Play Store URL" value={settings.playStoreUrl} onChange={v => updateField("playStoreUrl", v)} placeholder="https://play.google.com/..." />
                </div>
            </div>

            {/* Newsletter Settings */}
            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5 font-medium text-white">
                    Newsletter & CTA
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="newsletter"
                            checked={settings.newsletterEnabled}
                            onChange={e => updateField("newsletterEnabled", e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="newsletter" className="font-medium">Enable Newsletter Signup</label>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-300 block mb-1">CTA Button Text</label>
                        <input
                            className="w-full max-w-md p-2 border rounded bg-slate-900 border-white/10 text-white placeholder:text-slate-500"
                            value={settings.ctaText}
                            onChange={e => updateField("ctaText", e.target.value)}
                            placeholder="Stay Updated"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SocialInput({ icon, label, value, onChange, placeholder }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <span className="text-lg text-slate-200">{icon}</span> {label}
            </label>
            <div className="flex gap-2">
                <input
                    className="flex-1 p-2 border rounded bg-slate-900 border-white/10 text-white placeholder:text-slate-500 text-sm focus:border-blue-500 transition-colors"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                />
                {value && (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="p-2 border border-white/10 rounded hover:bg-white/10 text-white">
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-white" />
                    </a>
                )}
            </div>
        </div>
    );
}
