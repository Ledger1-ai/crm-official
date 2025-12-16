"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, ArrowRight, Shield, MessageSquare, Loader2, Sun, Moon } from "lucide-react";

interface PortalConfig {
    id: string;
    portal_name: string;
    portal_slug: string;
    welcome_message?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    theme_mode?: "LIGHT" | "DARK" | "AUTO";
    dark_primary_color?: string;
    dark_secondary_color?: string;
    dark_accent_color?: string;
    enable_glass_effect?: boolean;
    background_blur?: number;
}

interface Props {
    portal: PortalConfig;
}

export default function PortalLanding({ portal }: Props) {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDark, setIsDark] = useState(false);

    // Initialize dark mode based on portal settings and system preference
    useEffect(() => {
        if (portal.theme_mode === "DARK") {
            setIsDark(true);
        } else if (portal.theme_mode === "LIGHT") {
            setIsDark(false);
        } else {
            // AUTO mode - check system preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setIsDark(prefersDark);
        }
    }, [portal.theme_mode]);

    // Get theme-aware colors
    const primaryColor = isDark ? (portal.dark_primary_color || portal.primary_color || "#0f766e") : (portal.primary_color || "#0f766e");
    const secondaryColor = isDark ? (portal.dark_secondary_color || "#1f2937") : (portal.secondary_color || "#f5f5f5");
    const accentColor = isDark ? (portal.dark_accent_color || portal.accent_color || "#10b981") : (portal.accent_color || "#10b981");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const cleanPhone = phone.replace(/\D/g, "");

        if (cleanPhone.length < 10) {
            setError("Please enter a valid phone number");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/portal/recipient?phone=${encodeURIComponent(cleanPhone)}&portal_id=${portal.id}`);
            const data = await res.json();

            if (!res.ok || !data.recipient) {
                setError("No messages found for this phone number.");
                setLoading(false);
                return;
            }

            router.push(`/portal/${portal.portal_slug}/m/${data.recipient.access_token}`);
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    const formatPhoneInput = (value: string) => {
        const cleaned = value.replace(/\D/g, "");
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (match) {
            const parts = [match[1], match[2], match[3]].filter(Boolean);
            if (parts.length === 0) return "";
            if (parts.length === 1) return parts[0];
            if (parts.length === 2) return `(${parts[0]}) ${parts[1]}`;
            return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
        }
        return value;
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500"
            style={{
                backgroundColor: isDark ? "#0a0a0a" : "#fafafa",
            }}
        >
            {/* Mesh Gradient Background - More visible */}
            <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                    background: isDark
                        ? `
                            radial-gradient(ellipse 80% 60% at 10% 20%, ${primaryColor}50 0%, transparent 60%),
                            radial-gradient(ellipse 70% 50% at 90% 10%, ${accentColor}40 0%, transparent 55%),
                            radial-gradient(ellipse 60% 70% at 80% 90%, ${primaryColor}35 0%, transparent 50%),
                            radial-gradient(ellipse 50% 50% at 20% 80%, ${accentColor}30 0%, transparent 45%),
                            radial-gradient(circle at 50% 50%, ${primaryColor}15 0%, transparent 80%)
                        `
                        : `
                            radial-gradient(ellipse 80% 60% at 10% 20%, ${primaryColor}40 0%, transparent 60%),
                            radial-gradient(ellipse 70% 50% at 90% 10%, ${accentColor}35 0%, transparent 55%),
                            radial-gradient(ellipse 60% 70% at 80% 90%, ${primaryColor}30 0%, transparent 50%),
                            radial-gradient(ellipse 50% 50% at 20% 80%, ${accentColor}25 0%, transparent 45%),
                            radial-gradient(circle at 50% 50%, ${primaryColor}12 0%, transparent 80%)
                        `,
                }}
            />

            {/* Animated Gradient Orbs */}
            <div
                className="absolute w-[500px] h-[500px] rounded-full blur-[100px] transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle, ${primaryColor}${isDark ? "60" : "45"} 0%, transparent 70%)`,
                    top: "-15%",
                    left: "-10%",
                    animation: "float 8s ease-in-out infinite",
                }}
            />
            <div
                className="absolute w-[400px] h-[400px] rounded-full blur-[80px] transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle, ${accentColor}${isDark ? "50" : "35"} 0%, transparent 70%)`,
                    bottom: "-10%",
                    right: "-5%",
                    animation: "float 10s ease-in-out infinite reverse",
                }}
            />
            <div
                className="absolute w-[300px] h-[300px] rounded-full blur-[60px] transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle, ${primaryColor}${isDark ? "40" : "25"} 0%, transparent 70%)`,
                    top: "40%",
                    right: "20%",
                    animation: "float 12s ease-in-out infinite",
                }}
            />

            {/* Elegant Theme Toggle - Top Right Corner */}
            {portal.theme_mode === "AUTO" && (
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="absolute top-6 right-6 z-20 group"
                    aria-label="Toggle theme"
                >
                    <div
                        className="relative w-14 h-7 rounded-full p-0.5 transition-all duration-300"
                        style={{
                            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                            boxShadow: isDark
                                ? "inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)"
                                : "inset 0 2px 4px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
                        }}
                    >
                        <div
                            className="absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg"
                            style={{
                                left: isDark ? "calc(100% - 26px)" : "2px",
                                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                                boxShadow: isDark
                                    ? `0 2px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)`
                                    : `0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)`,
                            }}
                        >
                            {isDark ? (
                                <Moon className="w-3.5 h-3.5 text-blue-300" />
                            ) : (
                                <Sun className="w-3.5 h-3.5 text-amber-500" />
                            )}
                        </div>
                    </div>
                </button>
            )}

            <div className="w-full max-w-md space-y-8 relative z-10">
                {/* Logo and Header */}
                <div className="text-center space-y-4">
                    {portal.logo_url ? (
                        <div
                            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300"
                            style={{
                                backgroundColor: isDark ? "rgba(30,30,30,0.25)" : "rgba(255,255,255,0.25)",
                                backdropFilter: "blur(24px) saturate(200%)",
                                WebkitBackdropFilter: "blur(24px) saturate(200%)",
                                boxShadow: isDark
                                    ? `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.15)`
                                    : `0 8px 32px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.6)`,
                                border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.5)",
                            }}
                        >
                            <img
                                src={portal.logo_url}
                                alt={portal.portal_name}
                                className="w-[4.5rem] h-[4.5rem] object-contain"
                                style={{
                                    filter: isDark ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                                }}
                            />
                        </div>
                    ) : (
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto transition-all duration-300"
                            style={{
                                backgroundColor: primaryColor,
                                boxShadow: `0 8px 32px ${primaryColor}50, 0 0 0 1px rgba(255,255,255,0.1)`,
                            }}
                        >
                            {(portal.portal_name || "P")[0]}
                        </div>
                    )}
                    <h1
                        className="text-2xl font-bold transition-colors duration-300"
                        style={{ color: isDark ? "#ffffff" : "#111827" }}
                    >
                        {portal.portal_name}
                    </h1>
                    {portal.welcome_message && (
                        <p
                            className="text-sm max-w-sm mx-auto transition-colors duration-300"
                            style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#6b7280" }}
                        >
                            {portal.welcome_message}
                        </p>
                    )}
                </div>

                {/* Phone Entry Form */}
                <div
                    className="rounded-3xl p-8 transition-all duration-300"
                    style={{
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
                        backdropFilter: portal.enable_glass_effect ? `blur(${portal.background_blur || 20}px)` : undefined,
                        boxShadow: isDark
                            ? "0 25px 50px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
                            : "0 25px 50px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)",
                    }}
                >
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto transition-colors duration-300"
                                style={{ backgroundColor: `${primaryColor}${isDark ? "30" : "15"}` }}
                            >
                                <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
                            </div>
                            <h2
                                className="text-lg font-semibold transition-colors duration-300"
                                style={{ color: isDark ? "#ffffff" : "#111827" }}
                            >
                                View Your Messages
                            </h2>
                            <p
                                className="text-sm transition-colors duration-300"
                                style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#6b7280" }}
                            >
                                Enter your phone number to access your secure messages.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label
                                    className="text-sm font-medium transition-colors duration-300"
                                    style={{ color: isDark ? "rgba(255,255,255,0.8)" : "#374151" }}
                                >
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300"
                                        style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}
                                    />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                                        placeholder="(555) 123-4567"
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all text-lg"
                                        style={{
                                            backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#ffffff",
                                            border: error
                                                ? "2px solid #ef4444"
                                                : isDark
                                                    ? "1px solid rgba(255,255,255,0.15)"
                                                    : "1px solid #e5e7eb",
                                            color: isDark ? "#ffffff" : "#111827",
                                        }}
                                    />
                                </div>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || phone.length < 10}
                                className="w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: primaryColor,
                                    boxShadow: `0 4px 14px ${primaryColor}50`,
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        View Messages
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Security Badge */}
                <div
                    className="flex items-center justify-center gap-2 text-sm transition-colors duration-300"
                    style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}
                >
                    <Shield className="w-4 h-4" />
                    <span>Secure & Private Message Portal</span>
                </div>
            </div>

            {/* CSS Animation for floating orbs */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(20px, -20px) scale(1.05);
                    }
                    66% {
                        transform: translate(-10px, 10px) scale(0.95);
                    }
                }
            `}</style>
        </div>
    );
}
