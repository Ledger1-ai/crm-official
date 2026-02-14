import { getDocuments } from "@/actions/documents/get-documents";
import { getUnassignedDocuments } from "@/actions/documents/get-unassigned-documents";
import Container from "../components/ui/Container";
import { DocumentsDataTable } from "./components/data-table";
import { columns } from "./components/columns";
import ModalDropzone from "./components/modal-dropzone";
import { Documents } from "@prisma/client";
import { getDocumentsByBoardId } from "@/actions/documents/get-documents-by-boardId";
import { NavigationCard } from "@/components/NavigationCard";
import { FileText, Image, File, AlertCircle, List } from "lucide-react";
import Link from "next/link";

const DocumentsPage = async ({ searchParams }: { searchParams?: Promise<{ [k: string]: string | string[] | undefined }> }) => {
  const params = searchParams ? await searchParams : undefined;
  const boardIdParam = params?.boardId;
  const unassignedParam = params?.unassigned;
  let documents: Documents[];
  if (typeof unassignedParam === "string" && unassignedParam === "true") {
    documents = await getUnassignedDocuments();
  } else if (typeof boardIdParam === "string" && boardIdParam) {
    documents = await getDocumentsByBoardId(boardIdParam);
  } else {
    documents = await getDocuments();
  }

  if (!documents) {
    return <div>Something went wrong</div>;
  }

  return (
    <Container
      title="Documents"
      description={"Everything you need to know about company documents"}
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
        <Link href="?unassigned=true" className="block h-full">
          <NavigationCard card={{
            title: "Unassigned",
            description: "Show unassigned docs",
            icon: AlertCircle,
            color: "from-yellow-500/20 to-amber-500/20",
            iconColor: "text-yellow-400"
          }} />
        </Link>
        <Link href="/documents" className="block h-full">
          <NavigationCard card={{
            title: "All Documents",
            description: "Show all documents",
            icon: List,
            color: "from-gray-500/20 to-slate-500/20",
            iconColor: "text-gray-400"
          }} />
        </Link>
      </div>

      {typeof boardIdParam === "string" && boardIdParam && (
        <div className="mb-3 text-xs text-muted-foreground">Filtering by project: {boardIdParam}</div>
      )}
      {typeof unassignedParam === "string" && unassignedParam === "true" && (
        <div className="mb-3 text-xs text-muted-foreground">Filtering: Unassigned documents</div>
      )}

      <DocumentsDataTable data={documents} columns={columns} />
    </Container>
  );
};

export default DocumentsPage;
