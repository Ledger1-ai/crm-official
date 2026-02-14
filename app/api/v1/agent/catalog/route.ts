
import { NextResponse } from "next/server";
import { toUCPProduct } from "@/lib/surge-ucp";
import { prismadb } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        console.log("[AgentAPI] Fetching UCP Catalog...");

        // In a real scenario, we might filter specific "Public" or "Agent-Ready" items.
        // For now, we'll fetch the first 5 invoices to simulate a catalog of "Services Rendered"
        // or effectively "Products" that an agent might query.

        // Better yet: If you had a Product model, we'd use that. 
        // As fallback, we'll construct a mock catalog of standard CRM services.

        const catalog = [
            {
                id: "service-consulting-1h",
                name: "CRM Consulting (1 Hour)",
                description: "Expert consultation for CRM optimization.",
                amount: 150.00
            },
            {
                id: "service-api-access-mo",
                name: "Premium API Access",
                description: "Monthly subscription for high-rate limit API keys.",
                amount: 49.99
            },
            {
                id: "data-contact-enrichment",
                name: "Contact Enrichment",
                description: "Enrich 100 contacts with social data.",
                amount: 25.00
            }
        ];

        const ucpCatalog = catalog.map(item => toUCPProduct(item));

        return NextResponse.json({
            "@context": "https://ucp.network/v1",
            "@type": "Catalog",
            products: ucpCatalog
        });

    } catch (error: any) {
        console.error("[AgentAPI] Error fetching catalog:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
