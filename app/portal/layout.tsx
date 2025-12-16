import "@/app/[locale]/globals.css";

export const metadata = {
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
