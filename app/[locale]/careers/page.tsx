import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, Heart, Coffee, Laptop } from "lucide-react";
import Link from "next/link";
import { prismadb } from "@/lib/prisma";
import { CareersGrid } from "./_components/CareersGrid";
export const metadata = {
    title: "Careers - Ledger1CRM",
    description: "Join the team building the future of AI CRM.",
};

export default async function CareersPage() {
    const jobs = await prismadb.jobPosting.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
    });



    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-sans selection:bg-primary/30">
            <MarketingHeader />

            <main>
                {/* Hero Section */}
                <section className="py-20 md:py-32 text-center">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Build the <span className="text-primary">Future</span> with Us
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                            We&apos;re a remote-first team of engineers, designers, and dreamers building the next generation of business software.
                        </p>
                        <Link href="#positions">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                                View Open Positions
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Culture Section */}
                <section className="py-20 bg-white/5">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold mb-12 text-center">Life at Ledger1</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <CultureCard
                                icon={<Laptop className="h-8 w-8 text-primary" />}
                                title="Remote First"
                                description="Work from anywhere in the world. We believe in output, not hours in a chair. We have team members in 12+ countries."
                            />
                            <CultureCard
                                icon={<DollarSign className="h-8 w-8 text-green-500" />}
                                title="Competitive Pay"
                                description="We pay top-tier salaries and offer generous equity packages. Everyone is an owner here."
                            />
                            <CultureCard
                                icon={<Heart className="h-8 w-8 text-red-500" />}
                                title="Health & Wellness"
                                description="Comprehensive health insurance, mental health support, and a monthly wellness stipend."
                            />
                            <CultureCard
                                icon={<Coffee className="h-8 w-8 text-yellow-500" />}
                                title="Flexible Hours"
                                description="Night owl? Early bird? Work when you're most productive. We trust you to manage your own schedule."
                            />
                            <CultureCard
                                icon={<Clock className="h-8 w-8 text-purple-500" />}
                                title="Unlimited PTO"
                                description="Take the time you need to recharge. We have a minimum vacation policy to ensure you actually take it."
                            />
                            <CultureCard
                                icon={<MapPin className="h-8 w-8 text-pink-500" />}
                                title="Company Retreats"
                                description="We fly the whole team out twice a year to amazing locations for a week of bonding and strategy."
                            />
                        </div>
                    </div>
                </section>

                {/* Open Positions */}
                <section id="positions" className="py-20">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <h2 className="text-3xl font-bold mb-12 text-center">Open Positions</h2>

                        {jobs.length === 0 ? (
                            <div className="text-center text-gray-500">
                                No open positions at the moment. Please check back later!
                            </div>
                        ) : (
                            <CareersGrid jobs={jobs} />
                        )}
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
}

function CultureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="p-6 rounded-2xl bg-[#0F0F1A] border border-white/10 hover:border-primary/30 transition-colors">
            <div className="mb-4 bg-white/5 p-3 rounded-lg w-fit">{icon}</div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    );
}

function JobCard({ title, department, location, type, applyLink }: any) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between hover:border-primary/30 transition-colors group cursor-pointer">
            <div className="mb-4 md:mb-0">
                <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{title}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {location}</span>
                    <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {type}</span>
                </div>
            </div>
            <Link href={applyLink || "#"}>
                <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white">
                    Apply Now
                </Button>
            </Link>
        </div>
    );
}

