import { prismadb } from "@/lib/prisma";
import AdminDocsSidebar from "./_components/AdminDocsSidebar";

export default async function CMSDocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const docs = await prismadb.docArticle.findMany({
        orderBy: [
            { category: "asc" },
            { order: "asc" },
        ],
        select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            order: true,
        },
    });

    return (
        <div className="flex flex-1 h-full overflow-hidden">
            {/* Persistent Sidebar */}
            <aside className="w-80 flex-shrink-0 h-full border-r border-border overflow-hidden hidden lg:block">
                <AdminDocsSidebar docs={docs} />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-muted/5">
                {children}
            </main>
        </div>
    );
}
