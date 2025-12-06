import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Import cards from CMS for now as they are shared components in practice
import GptCard from "@/app/[locale]/cms/(dashboard)/_components/GptCard";
import ResendCard from "@/app/[locale]/cms/(dashboard)/_components/ResendCard";
import OpenAiCard from "@/app/[locale]/cms/(dashboard)/_components/OpenAiCard";

const AnyLink = Link as any;
const AnyButton = Button as any;

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <Container
      title="Administration"
      description="Here you can setup your Ledger1CRM instance"
    >
      <div className="space-y-8">
        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <AnyLink href="/admin/users">
            <AnyButton variant="outline" className="text-cyan-400 border-cyan-800 hover:bg-cyan-950">
              Users administration
            </AnyButton>
          </AnyLink>
          <AnyLink href="/admin/modules">
            <AnyButton variant="outline" className="text-cyan-400 border-cyan-800 hover:bg-cyan-950">
              Modules administration
            </AnyButton>
          </AnyLink>
        </div>

        {/* Cards Grid */}
        <div className="flex flex-wrap gap-6">
          <GptCard />
          <ResendCard />
          <OpenAiCard />
        </div>
      </div>
    </Container>
  );
}
