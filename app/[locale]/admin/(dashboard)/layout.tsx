import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { redirect } from "next/navigation";
import getAllCommits from "@/actions/github/get-repo-commits";

import { ReactNode } from "react";

import Header from "@/app/[locale]/(routes)/components/Header";
import SideBar from "@/app/[locale]/(routes)/components/SideBar";
import Footer from "@/app/[locale]/(routes)/components/Footer";

const AnyFooter = Footer as any;

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

    return (
        <div className="flex h-screen overflow-hidden">
            <SideBar build={build} />
            <div className="flex flex-col h-full w-full overflow-hidden">
                <Header
                    id={session.user.id as string}
                    name={session.user.name as string}
                    email={session.user.email as string}
                    avatar={session.user.image as string}
                    lang={session.user.userLanguage as string}
                />
                <div className="flex-grow overflow-y-auto h-full p-5">
                    {children}
                </div>
                <AnyFooter />
            </div>
        </div>
    );
}
