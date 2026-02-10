import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "../../../components/ui/Container";
import { getQuoteById } from "@/actions/crm/quotes";
import QuoteDetailsClient from "./components/QuoteDetailsClient";

export const metadata = {
    title: "Quote Details | CRM",
    description: "View and manage sales quote details."
};

export default async function QuoteDetailsPage(props: { params: Promise<{ quoteId: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const quote = await getQuoteById(params.quoteId);

    if (!quote) {
        redirect("/crm/quotes");
    }

    return (
        <Container
            title={`Quote: ${quote.quoteNumber}`}
            description={quote.title}
        >
            <QuoteDetailsClient quote={JSON.parse(JSON.stringify(quote))} />
        </Container>
    );
}
