"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CareersModal } from "@/components/careers/CareersModal";

interface JobPosting {
    id: string;
    title: string;
    department: string;
    location: string;
    type: string;
    description: string | null;
    summary: string | null;
    content: string | null;
    requirements: string | null;
    active: boolean;
    applyLink: string | null;
}

interface CareersGridProps {
    jobs: JobPosting[];
}

export function CareersGrid({ jobs }: CareersGridProps) {
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

    // Group by department
    const jobsByDept = jobs.reduce((acc: any, job) => {
        (acc[job.department] = acc[job.department] || []).push(job);
        return acc;
    }, {});

    return (
        <>
            <div className="space-y-6">
                {Object.entries(jobsByDept).map(([dept, deptJobs]: [string, any]) => (
                    <div key={dept} className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/5">
                        <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-primary rounded-full" />
                            {dept}
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {deptJobs.map((job: JobPosting) => (
                                <div
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className="group bg-[#0A0A0B] border border-white/10 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="mb-4 md:mb-0 pl-2">
                                        <h4 className="text-xl font-bold text-white group-hover:text-primary transition-colors mb-2">{job.title}</h4>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span className="flex items-center bg-white/5 px-2 py-1 rounded"><MapPin className="h-3.5 w-3.5 mr-1.5" /> {job.location}</span>
                                            <span className="flex items-center bg-white/5 px-2 py-1 rounded"><Clock className="h-3.5 w-3.5 mr-1.5" /> {job.type}</span>
                                        </div>
                                    </div>

                                    <Button variant="outline" className="border-white/10 hover:bg-primary hover:text-white hover:border-primary transition-all group-hover:scale-105">
                                        View Details
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <CareersModal
                job={selectedJob}
                isOpen={!!selectedJob}
                onClose={() => setSelectedJob(null)}
            />
        </>
    );
}
