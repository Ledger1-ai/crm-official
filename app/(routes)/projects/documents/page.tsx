import React, { Suspense } from "react";
import Container from "../../components/ui/Container";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SuspenseLoading from "@/components/loadings/suspense";
import { getDocuments } from "@/actions/documents/get-documents";
import { DocumentsDataTable } from "./table-components/data-table";
import { columns } from "./table-components/columns";
import ModalDropzone from "@/app/(routes)/documents/components/modal-dropzone";
import { NavigationCard } from "@/components/NavigationCard";
import { FileText, Image, File } from "lucide-react";

export const maxDuration = 300;

const DocumentsPage = async () => {
    const session = await getServerSession(authOptions);

    if (!session) return redirect("/sign-in");

    // Server-side fetch
    const documents = await getDocuments();

    return (
        <Container
            title="Documents"
            description="All documents across your campaigns"
        >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3 flex-shrink-0">
                <ModalDropzone
                    buttonLabel="Upload pdf"
                    fileType="pdfUploader"
                    customTrigger={<NavigationCard card={{
                        title: "Upload PDF",
                        description: "Upload PDF documents",
                        icon: FileText,
                        color: "from-red-500/20 to-orange-500/20",
                        iconColor: "text-red-400"
                    }} />}
                />
                <ModalDropzone
                    buttonLabel="Upload images"
                    fileType="imageUploader"
                    customTrigger={<NavigationCard card={{
                        title: "Upload Images",
                        description: "Upload image files",
                        icon: Image,
                        color: "from-blue-500/20 to-indigo-500/20",
                        iconColor: "text-blue-400"
                    }} />}
                />
                <ModalDropzone
                    buttonLabel="Upload other files"
                    fileType="docUploader"
                    customTrigger={<NavigationCard card={{
                        title: "Upload Other",
                        description: "Upload other file types",
                        icon: File,
                        color: "from-green-500/20 to-emerald-500/20",
                        iconColor: "text-green-400"
                    }} />}
                />
            </div>
            <Suspense fallback={<SuspenseLoading />}>
                {/* @ts-ignore */}
                <DocumentsDataTable data={documents} columns={columns} />
            </Suspense>
        </Container>
    );
};

export default DocumentsPage;
