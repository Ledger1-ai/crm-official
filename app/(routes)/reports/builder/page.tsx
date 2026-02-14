import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "../../components/ui/Container";
import ReportBuilderClient from "./components/ReportBuilderClient";

export const metadata = {
    title: "Report Builder | CRM",
    description: "Create custom cross-object reports with drag-and-drop ease"
};

export default async function ReportBuilderPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    return (
        <Container
            title="Report Builder"
            description="Design custom reports by selecting objects, fields, and filters."
        >
            <ReportBuilderClient />
        </Container>
    );
}
