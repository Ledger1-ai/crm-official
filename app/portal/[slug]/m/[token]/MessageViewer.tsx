"use client";

/**
 * MessageViewer - Premium Portal Message Viewer
 * Mobile-optimized with stunning light/dark mode support and glass morphism
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Mail, Clock, User, Building2, Moon, Sun, Check, ExternalLink } from 'lucide-react';

interface Portal {
    id: string;
    portal_name: string | null;
    portal_slug: string;
    logo_url: string | null;
    logo_type?: string | null;
    project_symbol_id?: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    accent_color?: string | null;
    welcome_message: string | null;
    show_sender_info: boolean;
    theme_mode?: 'LIGHT' | 'DARK' | 'AUTO';
    dark_primary_color?: string | null;
    dark_secondary_color?: string | null;
    dark_accent_color?: string | null;
    enable_glass_effect?: boolean;
    background_blur?: number | null;
}

interface Message {
    id: string;
    subject: string;
    body_text: string;
    body_html: string | null;
    mobile_html: string | null;
    sender_name: string | null;
    sender_email: string | null;
    sender_avatar: string | null;
    sentAt: Date;
}

interface Recipient {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    company: string | null;
    phone: string | null;
}

interface MessageViewerProps {
    portal: Portal;
    message: Message;
    recipient: Recipient;
    deviceType: 'mobile' | 'tablet' | 'desktop';
}

export default function MessageViewer({ portal, message, recipient, deviceType }: MessageViewerProps) {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Determine initial theme based on portal settings and system preference
    useEffect(() => {
        setMounted(true);
        if (portal.theme_mode === 'DARK') {
            setIsDark(true);
        } else if (portal.theme_mode === 'LIGHT') {
            setIsDark(false);
        } else {
            // AUTO mode - check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(prefersDark);
        }
    }, [portal.theme_mode]);

    // Listen for system theme changes in AUTO mode
    useEffect(() => {
        if (portal.theme_mode !== 'AUTO') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [portal.theme_mode]);

    // Colors based on theme
    const primaryColor = isDark
        ? (portal.dark_primary_color || portal.primary_color || '#F54029')
        : (portal.primary_color || '#F54029');
    const secondaryColor = isDark
        ? (portal.dark_secondary_color || '#1f2937')
        : (portal.secondary_color || '#f5f5f5');
    const accentColor = isDark
        ? (portal.dark_accent_color || '#10b981')
        : (portal.accent_color || '#10b981');

    const enableGlass = portal.enable_glass_effect !== false;
    const blurAmount = portal.background_blur || 20;

    const greeting = recipient.first_name ? `Hi ${recipient.first_name}` : 'Hello';
    const displayHtml = message.body_html || message.body_text;

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-pulse flex gap-2">
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen transition-colors duration-500 ${isDark ? 'dark' : ''}`}
            style={{
                background: isDark
                    ? `radial-gradient(ellipse at top, ${primaryColor}15 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${accentColor}10 0%, transparent 50%), linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)`
                    : `radial-gradient(ellipse at top, ${primaryColor}08 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${accentColor}05 0%, transparent 50%), linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)`,
            }}
        >
            {/* Animated background orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-30 animate-pulse"
                    style={{
                        background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 70%)`,
                        animationDuration: '4s'
                    }}
                />
                <div
                    className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-20 animate-pulse"
                    style={{
                        background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
                        animationDuration: '6s',
                        animationDelay: '2s'
                    }}
                />
            </div>

            {/* Header */}
            <header
                className={`sticky top-0 z-50 border-b transition-all duration-300 ${enableGlass
                        ? isDark
                            ? 'bg-slate-900/70 border-slate-700/50'
                            : 'bg-white/70 border-slate-200/50'
                        : isDark
                            ? 'bg-slate-900 border-slate-700'
                            : 'bg-white border-slate-200'
                    }`}
                style={{ backdropFilter: enableGlass ? `blur(${blurAmount}px) saturate(180%)` : undefined }}
            >
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {portal.logo_url ? (
                            <img
                                src={portal.logo_url}
                                alt={portal.portal_name || 'Portal'}
                                className="h-8 w-auto"
                            />
                        ) : (
                            <div
                                className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
                                    boxShadow: `0 4px 14px ${primaryColor}40`
                                }}
                            >
                                {(portal.portal_name || 'P')[0]}
                            </div>
                        )}
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {portal.portal_name || 'Message Portal'}
                        </span>
                    </div>

                    {/* Theme Toggle */}
                    {portal.theme_mode === 'AUTO' && (
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className={`p-2 rounded-xl transition-all duration-300 ${isDark
                                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-3xl mx-auto px-4 py-6">
                {/* Welcome Section */}
                {portal.welcome_message && (
                    <div
                        className={`mb-6 p-4 rounded-2xl text-sm border transition-all duration-300 ${enableGlass
                                ? isDark
                                    ? 'bg-slate-800/50 border-slate-700/50'
                                    : 'bg-white/50 border-slate-200/50'
                                : isDark
                                    ? 'bg-slate-800 border-slate-700'
                                    : 'bg-white border-slate-200'
                            }`}
                        style={{
                            backdropFilter: enableGlass ? `blur(${blurAmount}px)` : undefined,
                            color: primaryColor
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${primaryColor}15` }}
                            >
                                <Check className="w-4 h-4" style={{ color: primaryColor }} />
                            </div>
                            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                                {portal.welcome_message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Message Card */}
                <div
                    className={`rounded-3xl overflow-hidden border transition-all duration-300 ${enableGlass
                            ? isDark
                                ? 'bg-slate-800/60 border-slate-700/50 shadow-2xl shadow-black/20'
                                : 'bg-white/80 border-slate-200/50 shadow-2xl shadow-slate-200/50'
                            : isDark
                                ? 'bg-slate-800 border-slate-700 shadow-xl'
                                : 'bg-white border-slate-200 shadow-xl'
                        }`}
                    style={{ backdropFilter: enableGlass ? `blur(${blurAmount}px)` : undefined }}
                >
                    {/* Message Header */}
                    <div className={`p-5 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                        <div className="flex items-start gap-4">
                            {message.sender_avatar ? (
                                <img
                                    src={message.sender_avatar}
                                    alt={message.sender_name || 'Sender'}
                                    className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                                />
                            ) : (
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}aa 100%)`,
                                        boxShadow: `0 4px 14px ${primaryColor}30`
                                    }}
                                >
                                    {(message.sender_name || 'S')[0]}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                {portal.show_sender_info && message.sender_name && (
                                    <p className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {message.sender_name}
                                    </p>
                                )}
                                <p className={`text-sm flex items-center gap-2 mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <Clock className="w-4 h-4" />
                                    {format(new Date(message.sentAt), 'MMMM d, yyyy • h:mm a')}
                                </p>
                            </div>
                        </div>

                        {/* Subject */}
                        <h1 className={`mt-5 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {message.subject}
                        </h1>
                    </div>

                    {/* Message Body */}
                    <div className="p-5">
                        {/* Greeting */}
                        <p className={`text-lg mb-4 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                            {greeting},
                        </p>

                        {/* Content */}
                        {message.body_html ? (
                            <div
                                className={`prose prose-sm max-w-none ${isDark
                                        ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-a:text-emerald-400 prose-strong:text-white'
                                        : 'prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-emerald-600 prose-strong:text-slate-900'
                                    }`}
                                dangerouslySetInnerHTML={{ __html: displayHtml }}
                            />
                        ) : (
                            <div className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {message.body_text}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recipient Info Card */}
                <div
                    className={`mt-6 p-5 rounded-2xl border transition-all duration-300 ${enableGlass
                            ? isDark
                                ? 'bg-slate-800/40 border-slate-700/50'
                                : 'bg-white/50 border-slate-200/50'
                            : isDark
                                ? 'bg-slate-800/80 border-slate-700'
                                : 'bg-slate-50 border-slate-200'
                        }`}
                    style={{ backdropFilter: enableGlass ? `blur(${blurAmount / 2}px)` : undefined }}
                >
                    <p className={`text-xs uppercase tracking-wider font-semibold mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Sent to
                    </p>
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                                <Mail className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            </div>
                            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {recipient.email}
                            </span>
                        </div>
                        {recipient.first_name && (
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                                    <User className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                </div>
                                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {recipient.first_name} {recipient.last_name}
                                </span>
                            </div>
                        )}
                        {recipient.company && (
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                                    <Building2 className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                                </div>
                                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {recipient.company}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className={`mt-10 text-center pb-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                        style={{
                            backgroundColor: isDark ? `${primaryColor}15` : `${primaryColor}08`,
                            color: primaryColor
                        }}
                    >
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: accentColor }}
                        />
                        Secure message from {portal.portal_name || 'your portal'}
                    </div>
                    <p className="mt-4 text-xs">
                        Reply STOP to opt out of future messages.
                    </p>
                </footer>
            </main>
        </div>
    );
}
