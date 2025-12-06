import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/MarketingFooter";
import { prismadb } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ApplicationForm } from "./_components/ApplicationForm"; // Client form

export default async function ApplyPage({ params }: { params: { id: string } }) {
    const job = await prismadb.jobPosting.findUnique({
        where: { id: params.id },
    });

    if (!job) notFound();

    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-sans selection:bg-primary/30 flex flex-col">
            <MarketingHeader />

            <main className="flex-1 py-32 container mx-auto px-4 max-w-3xl">
                <div className="mb-12 text-center">
                    <span className="text-primary font-medium tracking-wider uppercase text-sm mb-2 block">Apply for</span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                        {job.title}
                    </h1>
                    <p className="text-xl text-gray-400">
                        {job.department} · {job.location} · {job.type}
                    </p>
                </div>

                <div className="bg-[#0A0A0B] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <ApplicationForm jobId={job.id} jobTitle={job.title} />
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}
