import "./globals.css";

import { Metadata } from "next";
import { Inter } from "next/font/google";

import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { ToastProvider } from "@/app/providers/ToastProvider";
import TopLoader from "@/app/components/TopLoader";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import SuspensionCheck from "@/components/SuspensionCheck";
import RecentActivityTracker from "@/components/RecentActivityTracker";
import { SessionProvider } from "@/app/providers/SessionProvider";
import { SWRSessionProvider } from "@/components/providers/swr-session-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

function getSafeBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  const PRODUCTION_FALLBACK = "https://crm.basalthq.com";

  if (!envUrl || envUrl.trim() === "") {
    return PRODUCTION_FALLBACK;
  }

  const trimmed = envUrl.trim();

  // Skip localhost URLs in production
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(trimmed)) {
    return PRODUCTION_FALLBACK;
  }

  // Ensure URL has protocol
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSafeBaseUrl();
  const baseUrl = siteUrl || "https://crm.basalthq.com";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: "BasaltCRM – AI Sales & Support Engine",
      template: `%s | BasaltCRM`,
    },
    description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
    keywords: ["CRM", "AI CRM", "Sales Automation", "Next.js CRM"],
    authors: [{ name: "BasaltCRM Team" }],
    creator: "BasaltCRM",
    publisher: "BasaltCRM",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title: "BasaltCRM – AI Sales & Support Engine",
      description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
      url: "https://crm.basalthq.com",
      siteName: "BasaltCRM",
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "BasaltCRM – AI Sales & Support Engine",
      description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
      creator: "@BasaltHQ",
    },
    icons: {
      icon: "/favicon-32x32.png",
      shortcut: "/favicon-32x32.png",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    alternates: {
      canonical: "/",
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <meta
          name="viewport"
          content="width=device-width, height=device-height, initial-scale=1"
        />
        <link rel="stylesheet" href="https://use.typekit.net/eur3bvn.css" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <TopLoader />
        <AnalyticsTracker />
        <SessionProvider session={session}>
          <SWRSessionProvider>
            <ThemeProvider>
              <RecentActivityTracker />
              {children}
              {/* Team Suspension Check */}
              <SuspensionCheck />
              <ToastProvider />
            </ThemeProvider>
          </SWRSessionProvider>
        </SessionProvider>
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
