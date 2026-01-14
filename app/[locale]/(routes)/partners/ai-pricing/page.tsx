
import { prismadb } from "@/lib/prisma";
import { AiProvider } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { AiPricingTable } from "./_components/AiPricingTable";

import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { PartnersNavigation } from "../_components/PartnersNavigation";
import { getPlans } from "@/actions/plans/plan-actions";

// ... existing imports ...

const AiPricingPage = async () => {
    const [models, plans] = await Promise.all([
        prismadb.aiModel.findMany({
            orderBy: [{ provider: 'asc' }, { name: 'asc' }]
        }),
        getPlans()
    ]);

    return (
        <Container
            title="AI Model Pricing & Configuration"
            description="Manage pricing and active status for AI models."
        >
            <div className="p-4 space-y-6">
                <PartnersNavigation
                    availablePlans={plans as any}
                    showBackButton={true}
                    hideCreateTeam={true}
                    hideModelPricing={true}
                    hideManagePlans={true}
                />
                <div className="rounded-md">
                    <AiPricingTable models={models} />
                </div>
            </div>
        </Container>
    );
};

export default AiPricingPage;
