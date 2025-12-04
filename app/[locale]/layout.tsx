import "./globals.css";

import { Metadata } from "next";
import { Inter } from "next/font/google";

import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createTranslator, NextIntlClientProvider } from "next-intl";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/app/providers/ThemeProvider";

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

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  const messages = await getLocales(locale);
  const t = createTranslator({ locale, messages });

  const title = t("RootLayout.title");
  const description = t("RootLayout.description");
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ledger1crm.com";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | Ledger1CRM`,
    },
    description,
    keywords: ["CRM", "AI CRM", "Sales Automation", "Next.js CRM"],
    authors: [{ name: "Ledger1CRM Team" }],
    creator: "Ledger1CRM",
    publisher: "Ledger1CRM",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title: "Ledger1 – AI Sales & Support Engine",
      description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
      url: "https://crm.ledger1.ai",
      siteName: "Ledger1",
      locale: locale,
      type: "website",
      images: [
        {
          url: "https://crm.ledger1.ai/social-preview.jpg",
          width: 1200,
          height: 630,
          alt: "Ledger1 – AI Sales & Support Engine",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Ledger1 – AI Sales & Support Engine",
      description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
      creator: "@Ledger1AI",
      images: ["https://crm.ledger1.ai/social-preview.jpg"],
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon-16x16.png",
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
  const messages = await getLocales(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, height=device-height, initial-scale=1"
        />
      </head>
      <body className={inter.className + " min-h-screen"}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
