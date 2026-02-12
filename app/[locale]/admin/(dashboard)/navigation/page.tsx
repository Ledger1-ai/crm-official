
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModules } from "@/actions/get-modules";
import { getNavigationConfig } from "@/actions/navigation/get-navigation-config";
import { getDictionary } from "@/dictionaries";
import { prismadb } from "@/lib/prisma";
import { DEFAULT_NAV_STRUCTURE } from "@/lib/navigation-defaults";
import { NavigationEditor } from "./_components/NavigationEditor";
import { redirect } from "next/navigation";

export default async function NavigationPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return redirect(`/${locale}/admin/login`);
    }

    // Fetch all necessary data for the editor
    const [modules, dbNavConfig, dict, user] = await Promise.all([
        getModules(),
        getNavigationConfig(),
        getDictionary(session.user.userLanguage as any),
        prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_id: true, team_role: true, is_admin: true, assigned_team: { select: { slug: true } } }
        })
    ]);

    if (!modules || !dict || !user) {
        return <div>Error loading editor data.</div>;
    }

    const teamRole = user.team_role || "MEMBER";
    const isPartnerAdmin = user.is_admin || teamRole === "PLATFORM_ADMIN" || user.assigned_team?.slug === "basalthq";

    // Only admins can access this page
    if (teamRole === "MEMBER") {
        return redirect(`/${locale}/dashboard`);
    }

    const features: string[] = []; // In a real app, resolve features from team's plan

    return (
        <div className="h-full">
            <NavigationEditor
                initialStructure={dbNavConfig || DEFAULT_NAV_STRUCTURE}
                modules={modules}
                dict={dict}
                features={features}
                isPartnerAdmin={isPartnerAdmin}
                teamRole={teamRole}
            />
        </div>
    );
}
