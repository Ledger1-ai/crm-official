import { getModules } from "@/actions/get-modules";
import { prismadb } from "@/lib/prisma";
import { getCaseStats } from "@/actions/crm/cases/get-case-stats";

import ModuleMenu from "./ModuleMenu";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary } from "@/dictionaries";

const SideBar = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  const [modules, user, caseStats] = await Promise.all([
    getModules(),
    (prismadb.users as any).findUnique({
      where: { id: session.user.id },
      include: {
        assigned_team: {
          include: { assigned_plan: true }
        }
      }
    }),
    getCaseStats(),
  ]);

  if (!modules) return null;

  //Get user language
  const lang = session.user.userLanguage;

  //Fetch translations from dictionary
  const dict = await getDictionary(lang as "en" | "cz" | "de");

  if (!dict) return null;

  const team = (user as any)?.assigned_team;
  let features: string[] = [];

  if (team?.assigned_plan) {
    features = team.assigned_plan.features;
  } else {
    // Fallback import
    const { getSubscriptionPlan } = await import("@/lib/subscription");
    const slug = team?.subscription_plan || "FREE";
    features = getSubscriptionPlan(slug).features;
  }

  const teamRole = (user as any)?.team_role || "MEMBER";
  const isPartnerAdmin = (user as any).is_admin || teamRole === "PLATFORM_ADMIN" || (user as any).assigned_team?.slug === "basalt" || (user as any).assigned_team?.slug === "basalthq";

  return <ModuleMenu
    modules={modules}
    dict={dict}
    features={features}
    isPartnerAdmin={isPartnerAdmin}
    teamRole={teamRole}
    serviceBadge={caseStats?.openCases || 0}
  />;
};
export default SideBar;
