import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { redirect } from "next/navigation";
import getAllCommits from "@/actions/github/get-repo-commits";
import { prismadb } from "@/lib/prisma";
import AdminSidebar from "./components/AdminSidebar";

import { ReactNode } from "react";

import Header from "@/app/[locale]/(routes)/components/Header";
import SideBar from "@/app/[locale]/(routes)/components/SideBar";
import Footer from "@/app/[locale]/(routes)/components/Footer";

const AnyFooter = Footer as any;
const AnySideBar = SideBar as any;

export default async function AdminDashboardLayout({
    children,
    params,
}: {
    children: any;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        return redirect(`/${locale}/admin/login`);
    }

    // Check for admin status (Global or Team Admin)
    const teamInfo = await getCurrentUserTeamId();

    if (!teamInfo?.isAdmin) {
        return redirect(`/${locale}/admin/login?error=unauthorized`);
    }

    // Fetch build info for sidebar
    const build = await getAllCommits();

    // Check if user is partner admin (BasaltHQ) or global admin
    // We need to fetch the user again with team slug to be sure, or rely on teamInfo if it has slug
    // teamInfo from getCurrentUserTeamId returns { id, name, plan, isAdmin, isOwner }
    // It doesn't seem to return slug. Let's fetch user to be safe and consistent with page.tsx
    const user = await prismadb.users.findUnique({
        where: { email: session.user.email as string },
        include: { assigned_team: true }
    });

    const showModules = user?.is_admin || user?.assigned_team?.slug === "basalthq";

    return (
        <div className="fixed inset-0 flex h-[100dvh] overflow-hidden">
            {/* Removed Global Sidebar for Admin to avoid confusion */}
            {/* Restored Global Sidebar for Admin */}
            <AnySideBar />
            <div className="flex flex-col h-full w-full min-w-0 overflow-hidden">
                <Header
                    id={session.user.id as string}
                    name={session.user.name as string}
                    email={session.user.email as string}
                    avatar={session.user.image as string}
                    lang={session.user.userLanguage as string}
                />
                <div className="flex flex-1 min-h-0 overflow-hidden">
                    <AdminSidebar showModules={!!showModules} />
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5">
                        {children}
                    </div>
                </div>
                <AnyFooter />
            </div>
        </div>
    );
}
