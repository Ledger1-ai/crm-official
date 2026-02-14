import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import DocsSidebar from "./components/DocsSidebar";

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30 flex flex-col">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>
            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <div className="flex-grow">
                    <main className="py-20 md:py-32 container mx-auto px-4">
                        <div className="flex flex-col lg:flex-row gap-12">
                            {/* Sidebar */}
                            <DocsSidebar />

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>

                <BasaltFooter />
            </div>
        </div>
    );
}
