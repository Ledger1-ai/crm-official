"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { format } from "date-fns";
import { Sun, Moon, MessageSquare, Clock, Smartphone, User, Shield, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";

// Sample demo messages with rich HTML content
const DEMO_MESSAGES = [
    {
        id: "demo-1",
        subject: "Appointment Confirmation",
        bodyPlain: "Hi John! This is a confirmation for your appointment scheduled for tomorrow at 2:00 PM. Please reply 'CONFIRM' to confirm or call us if you need to reschedule.",
        bodyHtml: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <p style="margin: 0 0 16px 0; font-size: 16px;">Hi <strong>John</strong>! 👋</p>
                <p style="margin: 0 0 16px 0; font-size: 16px;">This is a confirmation for your appointment:</p>
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 20px; margin: 16px 0; color: white;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">📅 Appointment Details</p>
                    <p style="margin: 0; font-size: 20px; font-weight: 700;">Tomorrow at 2:00 PM</p>
                </div>
                <p style="margin: 0 0 16px 0; font-size: 16px;">Please reply <strong>'CONFIRM'</strong> to confirm or call us if you need to reschedule.</p>
                <a href="#" style="display: inline-block; background: #0f766e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">Confirm Appointment</a>
            </div>
        `,
        senderName: "Your Team",
        recipientPhone: "+1 (555) 123-4567",
        recipientName: "John Doe",
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
        id: "demo-2",
        subject: "Payment Received - Thank You!",
        bodyPlain: "Thank you for your payment of $150.00. Your account has been credited and your next billing date is January 15, 2025.",
        bodyHtml: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="text-align: center; padding: 24px 0;">
                    <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; line-height: 64px; font-size: 28px;">✓</div>
                </div>
                <h2 style="margin: 0 0 8px 0; font-size: 24px; text-align: center; font-weight: 700;">Payment Received!</h2>
                <p style="margin: 0 0 24px 0; text-align: center; color: #64748b;">Thank you for your payment</p>
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 16px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: #64748b;">Amount Paid</span>
                        <span style="font-weight: 700; font-size: 18px; color: #10b981;">$150.00</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <span style="color: #64748b;">Payment Date</span>
                        <span style="font-weight: 600;">December 15, 2024</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #64748b;">Next Billing</span>
                        <span style="font-weight: 600;">January 15, 2025</span>
                    </div>
                </div>
                <p style="margin: 16px 0 0 0; font-size: 14px; color: #64748b; text-align: center;">Questions? Reply to this message or call us.</p>
            </div>
        `,
        senderName: "Billing Team",
        recipientPhone: "+1 (555) 123-4567",
        recipientName: "John Doe",
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
        id: "demo-3",
        subject: "🎉 Exclusive 20% Off - Just For You!",
        bodyPlain: "As a valued customer, we're offering you an exclusive 20% discount on your next service. Use code VALUED20 when booking. This offer expires in 7 days!",
        bodyHtml: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 16px; padding: 32px; text-align: center; color: white; margin-bottom: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 48px;">🎉</p>
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800;">EXCLUSIVE OFFER</h2>
                    <p style="margin: 0; font-size: 18px; opacity: 0.9;">Just for you, John!</p>
                </div>
                <div style="text-align: center; margin: 24px 0;">
                    <p style="margin: 0 0 12px 0; font-size: 18px; color: #64748b;">Your discount code:</p>
                    <div style="display: inline-block; background: #f8fafc; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 16px 32px;">
                        <span style="font-size: 28px; font-weight: 800; color: #8b5cf6; letter-spacing: 4px;">VALUED20</span>
                    </div>
                    <p style="margin: 16px 0 0 0; font-size: 24px; font-weight: 700; color: #1e293b;">Save 20% on your next service</p>
                </div>
                <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 16px 0; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #92400e;">⏰ Expires in 7 days</p>
                </div>
                <a href="#" style="display: block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 16px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; text-align: center; font-size: 16px;">Book Now & Save 20%</a>
            </div>
        `,
        senderName: "Marketing",
        recipientPhone: "+1 (555) 123-4567",
        recipientName: "John Doe",
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
];

function DemoPreviewContent() {
    const searchParams = useSearchParams();

    // Get settings from query params
    const name = searchParams.get("name") || "Demo Portal";
    const welcome = searchParams.get("welcome") || "Welcome to our secure SMS message portal. Your messages are encrypted and protected.";
    const primary = searchParams.get("primary") || "#0f766e";
    const secondary = searchParams.get("secondary") || "#f5f5f5";
    const accent = searchParams.get("accent") || "#10b981";
    const darkPrimary = searchParams.get("dark_primary") || "#0f766e";
    const darkSecondary = searchParams.get("dark_secondary") || "#1f2937";
    const darkAccent = searchParams.get("dark_accent") || "#10b981";
    const themeMode = searchParams.get("theme") || "AUTO";
    const enableGlass = searchParams.get("glass") !== "0";
    const blur = parseInt(searchParams.get("blur") || "20");
    const logo = searchParams.get("logo") || "";

    // Theme state
    const [isDark, setIsDark] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<typeof DEMO_MESSAGES[0] | null>(null);

    // Initialize theme based on mode
    useEffect(() => {
        if (themeMode === "DARK") {
            setIsDark(true);
        } else if (themeMode === "LIGHT") {
            setIsDark(false);
        } else {
            // AUTO: Check system preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setIsDark(prefersDark);
        }
    }, [themeMode]);

    // Current theme colors
    const currentPrimary = isDark ? darkPrimary : primary;
    const currentSecondary = isDark ? darkSecondary : secondary;
    const currentAccent = isDark ? darkAccent : accent;

    const bgGradient = isDark
        ? `radial-gradient(ellipse at top, ${currentPrimary}15 0%, transparent 50%), linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)`
        : `radial-gradient(ellipse at top, ${currentPrimary}08 0%, transparent 50%), linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)`;

    const cardBg = isDark
        ? enableGlass ? "rgba(30, 41, 59, 0.6)" : "rgba(30, 41, 59, 0.95)"
        : enableGlass ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.95)";

    const textPrimary = isDark ? "#f8fafc" : "#1e293b";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";
    const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";

    // Message list view
    if (!selectedMessage) {
        return (
            <div
                className="min-h-screen transition-all duration-300"
                style={{ background: bgGradient }}
            >
                {/* Floating animated background orbs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
                        style={{
                            background: currentPrimary,
                            top: "10%",
                            left: "10%",
                            animationDuration: "8s"
                        }}
                    />
                    <div
                        className="absolute w-64 h-64 rounded-full opacity-15 blur-3xl animate-pulse"
                        style={{
                            background: currentAccent,
                            bottom: "20%",
                            right: "15%",
                            animationDuration: "10s",
                            animationDelay: "2s"
                        }}
                    />
                </div>

                {/* Header */}
                <header
                    className="sticky top-0 z-50 border-b px-6 py-4"
                    style={{
                        backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.8)",
                        borderBottomColor: borderColor,
                        backdropFilter: enableGlass ? `blur(${blur}px) saturate(180%)` : undefined,
                    }}
                >
                    <div className="max-w-2xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {logo ? (
                                <img src={logo} alt={name} className="h-8 w-auto" />
                            ) : (
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: currentPrimary }}
                                >
                                    {name[0]}
                                </div>
                            )}
                            <div>
                                <h1 className="font-bold text-lg" style={{ color: textPrimary }}>
                                    {name}
                                </h1>
                                <p className="text-xs" style={{ color: textSecondary }}>
                                    Secure Message Portal
                                </p>
                            </div>
                        </div>

                        {themeMode === "AUTO" && (
                            <button
                                onClick={() => setIsDark(!isDark)}
                                className="p-2 rounded-lg transition-colors"
                                style={{
                                    backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                                    color: textSecondary,
                                }}
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </header>

                {/* Main content */}
                <main className="max-w-2xl mx-auto px-6 py-8">
                    {/* Welcome message */}
                    {welcome && (
                        <div
                            className="mb-6 p-4 rounded-2xl"
                            style={{
                                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                                color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                            }}
                        >
                            <p className="text-sm leading-relaxed">{welcome}</p>
                        </div>
                    )}

                    {/* Demo banner */}
                    <div
                        className="mb-6 p-4 rounded-2xl border-2 border-dashed flex items-center gap-3"
                        style={{
                            borderColor: currentAccent,
                            backgroundColor: `${currentAccent}10`,
                        }}
                    >
                        <Shield className="w-5 h-5" style={{ color: currentAccent }} />
                        <div>
                            <p className="font-semibold text-sm" style={{ color: textPrimary }}>
                                Demo Preview Mode
                            </p>
                            <p className="text-xs" style={{ color: textSecondary }}>
                                This is a preview with sample messages. Your actual portal will show real messages.
                            </p>
                        </div>
                    </div>

                    {/* Messages list */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: textSecondary }}>
                            Your Messages ({DEMO_MESSAGES.length})
                        </h2>

                        {DEMO_MESSAGES.map((message) => (
                            <button
                                key={message.id}
                                onClick={() => setSelectedMessage(message)}
                                className="w-full text-left rounded-2xl p-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                style={{
                                    backgroundColor: cardBg,
                                    backdropFilter: enableGlass ? `blur(${blur}px)` : undefined,
                                    boxShadow: isDark
                                        ? "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
                                        : "0 4px 24px rgba(0,0,0,0.06)",
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                                        style={{ backgroundColor: currentPrimary }}
                                    >
                                        {message.senderName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="font-semibold truncate" style={{ color: textPrimary }}>
                                                {message.senderName}
                                            </p>
                                            <span className="text-xs flex-shrink-0" style={{ color: textSecondary }}>
                                                {format(message.sentAt, "MMM d")}
                                            </span>
                                        </div>
                                        <p className="font-medium text-sm mb-1 truncate" style={{ color: textPrimary }}>
                                            {message.subject}
                                        </p>
                                        <p className="text-sm truncate" style={{ color: textSecondary }}>
                                            {message.bodyPlain}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 flex-shrink-0 mt-3" style={{ color: textSecondary }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-8 text-center">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                        style={{
                            backgroundColor: `${currentPrimary}15`,
                            color: currentPrimary,
                        }}
                    >
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: currentAccent }}
                        />
                        Secure Message Portal
                    </div>
                    <p className="mt-3 text-xs" style={{ color: textSecondary }}>
                        Reply STOP to opt out of messages
                    </p>
                </footer>
            </div>
        );
    }

    // Message detail view
    return (
        <div
            className="min-h-screen transition-all duration-300"
            style={{ background: bgGradient }}
        >
            {/* Floating animated background orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
                    style={{
                        background: currentPrimary,
                        top: "10%",
                        left: "10%",
                        animationDuration: "8s"
                    }}
                />
            </div>

            {/* Header */}
            <header
                className="sticky top-0 z-50 border-b px-6 py-4"
                style={{
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.8)",
                    borderBottomColor: borderColor,
                    backdropFilter: enableGlass ? `blur(${blur}px) saturate(180%)` : undefined,
                }}
            >
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <button
                        onClick={() => setSelectedMessage(null)}
                        className="p-2 -ml-2 rounded-lg transition-colors"
                        style={{
                            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                            color: currentPrimary,
                        }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="font-semibold" style={{ color: textPrimary }}>
                            {selectedMessage.subject}
                        </h1>
                        <p className="text-xs" style={{ color: textSecondary }}>
                            From {selectedMessage.senderName}
                        </p>
                    </div>
                    {themeMode === "AUTO" && (
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                                color: textSecondary,
                            }}
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </header>

            {/* Message content */}
            <main className="max-w-2xl mx-auto px-6 py-8">
                {/* Message card */}
                <div
                    className="rounded-3xl overflow-hidden"
                    style={{
                        backgroundColor: cardBg,
                        backdropFilter: enableGlass ? `blur(${blur}px)` : undefined,
                        boxShadow: isDark
                            ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
                            : "0 8px 32px rgba(0,0,0,0.08)",
                    }}
                >
                    {/* Sender info */}
                    <div className="p-6 border-b" style={{ borderBottomColor: borderColor }}>
                        <div className="flex items-start gap-4">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                                style={{ backgroundColor: currentPrimary }}
                            >
                                {selectedMessage.senderName[0]}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-lg" style={{ color: textPrimary }}>
                                    {selectedMessage.senderName}
                                </p>
                                <p className="text-sm flex items-center gap-2 mt-1" style={{ color: textSecondary }}>
                                    <Clock className="w-4 h-4" />
                                    {format(selectedMessage.sentAt, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                                </p>
                            </div>
                        </div>

                        <h2 className="mt-4 text-xl font-bold" style={{ color: textPrimary }}>
                            {selectedMessage.subject}
                        </h2>
                    </div>

                    {/* Message body */}
                    <div className="p-6">
                        {/* Rich HTML content */}
                        <div
                            className="prose max-w-none"
                            style={{
                                color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)",
                                fontSize: "16px",
                                lineHeight: "1.6",
                            }}
                            dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                        />
                    </div>
                </div>

                {/* Recipient info card */}
                <div
                    className="mt-6 rounded-2xl p-5"
                    style={{
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                        border: `1px solid ${borderColor}`,
                    }}
                >
                    <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: textSecondary }}>
                        SMS Sent to
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5" style={{ color: currentPrimary }} />
                            <span className="font-medium" style={{ color: textPrimary }}>
                                {selectedMessage.recipientPhone}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5" style={{ color: textSecondary }} />
                            <span style={{ color: textSecondary }}>
                                {selectedMessage.recipientName}
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center">
                <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                    style={{
                        backgroundColor: `${currentPrimary}15`,
                        color: currentPrimary,
                    }}
                >
                    <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: currentAccent }}
                    />
                    Secure Message Portal
                </div>
                <p className="mt-3 text-xs" style={{ color: textSecondary }}>
                    Reply STOP to opt out of messages
                </p>
            </footer>
        </div>
    );
}

// Loading fallback
function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-teal-600" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Loading preview...</p>
            </div>
        </div>
    );
}

// Main export with Suspense boundary
export default function DemoPreviewPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <DemoPreviewContent />
        </Suspense>
    );
}
