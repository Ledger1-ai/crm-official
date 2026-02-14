import "@/app/globals.css";

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://crm.basalthq.com"),
    title: "Message Portal",
    description: "Secure message viewing portal",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="antialiased">{children}</body>
        </html>
    );
}
