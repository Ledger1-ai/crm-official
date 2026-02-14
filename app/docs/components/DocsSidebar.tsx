import Link from "next/link";
import { prismadb } from "@/lib/prisma";
import { BookOpen, ChevronRight } from "lucide-react";

export default async function DocsSidebar() {
    const docs = await prismadb.docArticle.findMany({
        orderBy: { order: "asc" },
        select: {
            id: true,
            title: true,
            slug: true,
            category: true,
        },
    });

    // Group by category
    const docsByCategory = docs.reduce((acc: any, doc: any) => {
        (acc[doc.category] = acc[doc.category] || []).push(doc);
        return acc;
    }, {});

    return (
        <aside className="w-full lg:w-64 flex-shrink-0 lg:border-r border-white/10 lg:pr-6 mb-8 lg:mb-0">
            <nav className="space-y-8">
                {Object.entries(docsByCategory).map(([category, articles]: [string, any]) => (
                    <div key={category}>
                        <h3 className="flex items-center text-sm font-semibold text-white uppercase tracking-wider mb-3">
                            <BookOpen className="mr-2 h-4 w-4 text-primary" />
                            {category}
                        </h3>
                        <ul className="space-y-1 border-l border-white/10 ml-2 pl-3">
                            {articles.map((doc: any) => (
                                <li key={doc.id}>
                                    <Link
                                        href={`/docs/${doc.slug}`}
                                        className="block py-1.5 text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-all"
                                    >
                                        {doc.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
