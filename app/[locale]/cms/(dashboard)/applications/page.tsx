import { prismadb } from "@/lib/prisma";
import { ApplicationsClient } from "./_components/ApplicationsClient";

export default async function ApplicationsPage() {
    const applications = await prismadb.jobApplication.findMany({
        orderBy: { createdAt: "desc" },
        include: { job: true }
    });

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Job Applications
                    </h1>
                    <p className="text-slate-400 mt-2">Manage incoming candidates and push to Jira.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm text-slate-300">
                        Total Candidates: <span className="text-white font-bold ml-1">{applications.length}</span>
                    </div>
                </div>
            </div>

            <ApplicationsClient initialApplications={applications} />
        </div>
    );
}
