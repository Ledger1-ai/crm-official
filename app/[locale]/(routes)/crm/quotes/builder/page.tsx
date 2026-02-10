import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "../../../components/ui/Container";
import { getProducts } from "@/actions/crm/products";
import { prismadb } from "@/lib/prisma";
import QuoteBuilderClient from "./components/QuoteBuilderClient";

export const metadata = {
    title: "Quote Builder | CRM",
    description: "Create professional sales quotes with guided configuration."
};

export default async function QuoteBuilderPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const teamId = (session.user as any).team_id;

    // Fetch necessary data for the builder
    const [products, accounts, contacts] = await Promise.all([
        getProducts(),
        prismadb.crm_Accounts.findMany({ where: { team_id: teamId }, select: { id: true, name: true } }),
        prismadb.crm_Contacts.findMany({ where: { team_id: teamId }, select: { id: true, first_name: true, last_name: true, account: true } })
    ]);

    return (
        <Container
            title="Create Sales Quote"
            description="Configure products, quantities, and discounts to generate a new proposal."
        >
            <QuoteBuilderClient
                products={JSON.parse(JSON.stringify(products))}
                accounts={JSON.parse(JSON.stringify(accounts))}
                contacts={JSON.parse(JSON.stringify(contacts))}
            />
        </Container>
    );
}
