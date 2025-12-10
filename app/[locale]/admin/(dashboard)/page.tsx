import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prismadb } from "@/lib/prisma"; // Added prisma import

// Import cards from CMS for now as they are shared components in practice
import ResendCard from "@/app/[locale]/cms/(dashboard)/_components/ResendCard";
import TeamAiSettings from "@/app/[locale]/(routes)/settings/team/_components/TeamAiSettings";

const AnyLink = Link as any;
const AnyButton = Button as any;

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  // Fetch user to get teamId
  const user = await prismadb.users.findUnique({
    where: { email: session?.user?.email || "" },
    include: { assigned_team: true }
  });

  const teamId = user?.assigned_team?.id;

  return (
    <Container
      title="Administration"
      description="Here you can setup your Ledger1CRM instance"
    >
      <div className="space-y-8">
        {/* Cards Grid */}
        <div className="flex flex-wrap gap-6">
          <div className="w-full lg:w-1/2">
            {teamId ? (
              <TeamAiSettings teamId={teamId} />
            ) : (
              <div className="p-4 border rounded bg-muted/20">
                No Team Assigned. Cannot configure AI.
              </div>
            )}
          </div>
          <ResendCard />
        </div>
      </div>
    </Container>
  );
}
