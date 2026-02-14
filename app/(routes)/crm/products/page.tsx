import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "../../components/ui/Container";
import { getProducts } from "@/actions/crm/products";
import ProductsClient from "./components/ProductsClient";

export default async function ProductsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const products = await getProducts();

    return (
        <Container
            title="Products Catalog"
            description="Manage your product catalog, bundles, and pricing."
        >
            <ProductsClient initialProducts={JSON.parse(JSON.stringify(products))} />
        </Container>
    );
}
