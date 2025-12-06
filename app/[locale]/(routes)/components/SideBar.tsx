import { getModules } from "@/actions/get-modules";
import { prismadb } from "@/lib/prisma";

import ModuleMenu from "./ModuleMenu";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary } from "@/dictionaries";

const SideBar = async ({ build }: { build: number }) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  const [modules, user] = await Promise.all([
    getModules(),
    (prismadb.users as any).findUnique({
      where: { id: session.user.id },
      include: { assigned_team: true }
    })
  ]);

  if (!modules) return null;

  //Get user language
  const lang = session.user.userLanguage;

  //Fetch translations from dictionary
  const dict = await getDictionary(lang as "en" | "cz" | "de");

  if (!dict) return null;

  const subscriptionPlan = (user as any)?.assigned_team?.subscription_plan || "FREE";

  return <ModuleMenu modules={modules} dict={dict} build={build} subscriptionPlan={subscriptionPlan} />;
};
export default SideBar;
