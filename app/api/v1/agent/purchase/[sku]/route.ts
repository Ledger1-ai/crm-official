
import { NextResponse } from "next/server";
import { create402Challenge, validate402Payment } from "@/lib/surge-x402";
import { prismadb } from "@/lib/prisma";

const MOCK_SERVICES: Record<string, { price: string, resource: string }> = {
    "service-consulting-1h": { price: "150.00", resource: "https://cal.com/meeting-link" },
    "service-api-access-mo": { price: "49.99", resource: "sk_live_agent_key_xyz" },
    "data-contact-enrichment": { price: "25.00", resource: "{ enriched_data: [] }" }
};

export async function GET(req: Request, props: { params: Promise<{ sku: string }> }) {
    try {
        const params = await props.params;
        const sku = params.sku;
        const service = MOCK_SERVICES[sku];

        if (!service) {
            return new NextResponse("Service Not Found", { status: 404 });
        }

        // 0. Fetch Merchant Wallet for the challenge
        const integration = await prismadb.tenant_Integrations.findFirst({
            where: { surge_enabled: true }
        });

        const merchantWallet = integration?.surge_merchant_id || "0x_merchant_wallet_missing";

        // 1. Check for Payment Authorization Header
        const authHeader = req.headers.get("Authorization") || "";
        const isPayment = authHeader.startsWith("Payment ");

        let paymentValid = false;

        if (isPayment) {
            const proof = authHeader.replace("Payment ", "");
            paymentValid = await validate402Payment(proof, service.price, merchantWallet);
        }

        if (paymentValid) {
            // 2. Determine Action based on SKU
            return NextResponse.json({
                success: true,
                message: "Payment Accepted",
                resource: service.resource
            });
        }

        // 3. If No Payment or Invalid: Return 402 Challenge
        const challenge = create402Challenge("tenant_default", service.price, sku);
        if (challenge) challenge.recipient = merchantWallet;

        return NextResponse.json(challenge, {
            status: 402,
            headers: {
                "WWW-Authenticate": `Payment token="usdc", amount="${service.price}", network="base", recipient="${merchantWallet}"`
            }
        });

    } catch (error: any) {
        console.error("[AgentAPI] Purchase Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
