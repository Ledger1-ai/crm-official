import "../globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://crm.basalthq.com"),
    title: 'BasaltEcho - Real-Time AI Voice Conversations',
    description: 'Professional-grade, ultra-low latency voice AI powered by Azure OpenAI. Pay per second with ETH.',
};

export default function VoiceHubLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
