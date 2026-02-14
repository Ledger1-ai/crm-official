import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, FileText, Briefcase, BookOpen, Settings, Globe, Users, Share2, Image as ImageIcon, Shield } from "lucide-react";
import SignOutButton from "./_components/SignOutButton";

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return redirect(`/cms/login`);
    }

    // Check for admin status
    // Note: session.user.isAdmin is populated in auth.ts
    // if (!session.user.isAdmin) {
    //     // If logged in but not admin, redirect to login with error
    //     return redirect(`/cms/login?error=unauthorized`);
    // }

    return (
        <div className="flex h-screen bg-black text-slate-200 overflow-hidden relative">
            {/* Ambient Background - Enforced Dark */}
            <div className="absolute inset-0 bg-[#0A0A0B] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] z-0" />

            {/* Sidebar */}
            <aside className="w-64 bg-slate-950/50 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-20">
                <div className="p-6 border-b border-white/10 flex flex-col items-center justify-center gap-3">
                    <div className="relative w-36 h-12">
                        <Image
                            src="/BasaltCRMWideD.png"
                            alt="BasaltCRM"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Systems Live</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <NavLink href={`/cms`} icon={<LayoutDashboard />} label="Dashboard" />

                    <div className="pt-4 pb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recruitment</div>
                    <NavLink href={`/cms/applications`} icon={<Users />} label="Applications" />

                    <div className="pt-4 pb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Content</div>
                    <NavLink href={`/cms/blog`} icon={<FileText />} label="Blog" />
                    {/* Media moved to main dashboard */}
                    <NavLink href={`/cms/careers`} icon={<Briefcase />} label="Jobs (Postings)" />
                    <NavLink href={`/cms/docs`} icon={<BookOpen />} label="Documentation" />
                    <NavLink href={`/cms/footer`} icon={<Globe />} label="Footer" />
                    <NavLink href={`/cms/social`} icon={<Share2 />} label="Social Media" />

                    <div className="pt-4 pb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
                    <NavLink href={`/cms/settings/team`} icon={<Users />} label="Team & Admins" />
                    <NavLink href={`/cms/oauth`} icon={<Shield />} label="Integrations" />
                    <NavLink href={`/cms/settings`} icon={<Settings />} label="Settings" />
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                            {session.user.image && <img src={session.user.image} alt="User" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">{session.user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                        </div>
                    </div>
                    <SignOutButton callbackUrl={`/cms/login`} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative z-10">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-white/5 hover:text-white transition-all duration-200 group"
        >
            <span className="h-5 w-5 text-slate-400 group-hover:text-blue-400 transition-colors">{icon}</span>
            {label}
        </Link>
    );
}
