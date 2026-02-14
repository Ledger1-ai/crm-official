import { prismadb } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Layers, Zap, Clock } from "lucide-react";
import Link from "next/link";

export default async function CMSDocsOverviewPage() {
    const docs = await prismadb.docArticle.findMany();
    const totalDocs = docs.length;
    const categories = new Set(docs.map(d => d.category)).size;
    const recentDocs = await prismadb.docArticle.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5
    });

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-white">Documentation Center</h1>
                <p className="text-slate-400 mt-2 text-lg">Manage your entire knowledge base from one unified interface.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-950/50 backdrop-blur-xl border-white/10 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">Total Articles</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{totalDocs}</div>
                        <p className="text-xs text-slate-400 mt-1">
                            Published to public site
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-950/50 backdrop-blur-xl border-white/10 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">Active Categories</CardTitle>
                        <Layers className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{categories}</div>
                        <p className="text-xs text-slate-400 mt-1">
                            Organized topics
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-950/50 backdrop-blur-xl border-white/10 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">API Endpoints</CardTitle>
                        <Zap className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">12</div>
                        <p className="text-xs text-slate-400 mt-1">
                            Documented routes
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <h2 className="text-xl font-semibold text-white">Recently Updated</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {recentDocs.map((doc) => (
                        <Link
                            key={doc.id}
                            href={`/cms/docs/${doc.id}`}
                            className="block"
                        >
                            <div className="flex items-center justify-between p-4 bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-lg hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer">
                                <div>
                                    <h4 className="font-semibold text-white">{doc.title}</h4>
                                    <p className="text-sm text-slate-400">{doc.category} • {doc.slug}</p>
                                </div>
                                <div className="text-sm text-slate-500 font-mono">
                                    {new Date(doc.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
