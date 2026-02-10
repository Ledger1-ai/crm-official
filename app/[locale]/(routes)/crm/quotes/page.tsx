import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "../../components/ui/Container";
import { getQuotes } from "@/actions/crm/quotes";
import QuotesClient from "./components/QuotesClient";

export const metadata = {
    title: "Quotes | CRM",
    description: "Manage your sales quotes and proposals."
};

export default async function QuotesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const quotes = await getQuotes();

    return (
        <Container
            title="Quotes & Proposals"
            description="View and manage all customer quotes and status tracking."
        >
            <QuotesClient initialQuotes={JSON.parse(JSON.stringify(quotes))} />
        </Container>
    );
}
