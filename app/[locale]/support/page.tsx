// @ts-nocheck
export const dynamic = "force-dynamic";
import SupportClient from "./SupportClient";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";

export const metadata = {
    title: "Support - BasaltCRM",
    description: "Get help with BasaltCRM.",
};

export default function SupportPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />
                <SupportClient />
                <BasaltFooter />
            </div>
        </div>
    );
}
