import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FileText, Briefcase, BookOpen, Settings, Globe, Users, Share2 } from "lucide-react";
import SignOutButton from "./_components/SignOutButton";

export default async function AdminDashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    const { locale } = params;
    const session = await getServerSession(authOptions);

    if (!session) {
        return redirect(`/${locale}/cms/login`);
    }

    // Check for admin status
    // Note: session.user.isAdmin is populated in auth.ts
    // if (!session.user.isAdmin) {
    //     // If logged in but not admin, redirect to login with error
    //     return redirect(`/${locale}/cms/login?error=unauthorized`);
    // }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L1</div>
                    <span className="font-bold text-lg">CMS</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <NavLink href={`/${locale}/cms`} icon={<LayoutDashboard />} label="Dashboard" />

                    <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Recruitment</div>
                    <NavLink href={`/${locale}/cms/applications`} icon={<Users />} label="Applications" />

                    <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</div>
                    <NavLink href={`/${locale}/cms/blog`} icon={<FileText />} label="Blog" />
                    <NavLink href={`/${locale}/cms/careers`} icon={<Briefcase />} label="Jobs (Postings)" />
                    <NavLink href={`/${locale}/cms/docs`} icon={<BookOpen />} label="Documentation" />
                    <NavLink href={`/${locale}/cms/footer`} icon={<Globe />} label="Footer" />
                    <NavLink href={`/${locale}/cms/social`} icon={<Share2 />} label="Social Media" />

                    <div className="pt-4 pb-2 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">System</div>
                    <NavLink href={`/${locale}/cms/users`} icon={<Users />} label="Users" />
                    <NavLink href={`/${locale}/cms/settings`} icon={<Settings />} label="Settings" />
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
                            {session.user.image && <img src={session.user.image} alt="User" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session.user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                        </div>
                    </div>
                    <SignOutButton callbackUrl={`/${locale}/cms`} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
            <span className="h-5 w-5">{icon}</span>
            {label}
        </Link>
    );
}

