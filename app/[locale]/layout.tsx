import "./globals.css";

import { Metadata } from "next";
import { Inter } from "next/font/google";

import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { ToastProvider } from "@/app/providers/ToastProvider";
import NextTopLoader from "nextjs-toploader";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import SuspensionCheck from "@/components/SuspensionCheck";
import { SessionProvider } from "@/app/providers/SessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

async function getLocales(locale: string) {
  try {
    return (await import(`@/locales/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
}

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

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  const messages = await getLocales(locale);
  const t = createTranslator({ locale, messages });

  const title = t("RootLayout.title");
  const description = t("RootLayout.description");
  const siteUrl = getSafeBaseUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | BasaltCRM`,
    },
    description,
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
      locale: locale,
      type: "website",
      images: [
        {
          url: "https://crm.basalthq.com/social-preview.jpg",
          width: 1200,
          height: 630,
          alt: "BasaltCRM – AI Sales & Support Engine",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "BasaltCRM – AI Sales & Support Engine",
      description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
      creator: "@BasaltHQ",
      images: ["https://crm.basalthq.com/social-preview.jpg"],
    },
    icons: {
      icon: "/favicon-32x32.png",
      shortcut: "/favicon-32x32.png",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    alternates: {
      canonical: "/",
      languages: {
        "en-US": "/en",
        "de-DE": "/de",
      },
    },
  };
}

export default async function RootLayout(props: Props) {
  const params = await props.params;
  const { locale } = params;
  const { children } = props;

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getLocales(locale);
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, height=device-height, initial-scale=1"
        />
        <link rel="stylesheet" href="https://use.typekit.net/eur3bvn.css" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <NextTopLoader color="#2563EB" showSpinner={false} />
        <AnalyticsTracker />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider session={session}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
              {/* Team Suspension Check */}
              <SuspensionCheck />
              <ToastProvider />
            </ThemeProvider>
          </SessionProvider>
        </NextIntlClientProvider>
        <Toaster />
        <SonnerToaster />
      </body>
    </html >
  );
}
