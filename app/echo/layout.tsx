import "../[locale]/globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
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
