import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DocsPage() {
    // Fetch the first article (ordered by 'order')
    const firstDoc = await prismadb.docArticle.findFirst({
        orderBy: [
            { category: 'asc' },
            { order: 'asc' }
        ]
    });

    if (firstDoc) {
        redirect(`/docs/${firstDoc.slug}`);
    }

    // Fallback if no docs exist
    return (
        <div className="p-10 text-center text-gray-400">
            <h1 className="text-2xl font-bold mb-4">Documentation</h1>
            <p>No documentation articles found.</p>
        </div>
    );
}
