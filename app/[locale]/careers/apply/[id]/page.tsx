import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";
import { prismadb } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ApplicationForm } from "./_components/ApplicationForm"; // Client form

export default async function ApplyPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const job = await prismadb.jobPosting.findUnique({
        where: { id: params.id },
    });

    if (!job) notFound();

    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

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

                <BasaltFooter />
            </div>
        </div>
    );
}
