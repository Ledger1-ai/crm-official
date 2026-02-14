import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getWorkflow } from "@/actions/crm/workflows";
import { WorkflowEditor } from "../components/WorkflowEditor";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function WorkflowEditorPage({ params }: Props) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const { id } = await params;
    const workflow = await getWorkflow(id);

    if (!workflow) {
        notFound();
    }

    return <WorkflowEditor workflow={workflow} />;
}
