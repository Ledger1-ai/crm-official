import SupportClient from "./SupportClient";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";

export const metadata = {
    title: "Support - Ledger1CRM",
    description: "Get help with Ledger1CRM.",
};

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-sans selection:bg-primary/30">
            <MarketingHeader />
            <SupportClient />
            <MarketingFooter />
        </div>
    );
}
