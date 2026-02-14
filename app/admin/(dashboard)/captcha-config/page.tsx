
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import Container from "@/app/(routes)/components/ui/Container";
import { CaptchaConfigForm } from "@/app/(routes)/settings/team/_components/CaptchaConfigForm";

export default async function AdminCaptchaConfigPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
        redirect("/");
    }

    // Get current user's team
    const user = await prismadb.users.findUnique({
        where: { email: session.user.email || "" },
        include: { assigned_team: true },
    });

    const teamId = user?.assigned_team?.id;

    if (!teamId) {
        return (
            <Container
                title="Captcha Configuration"
                description="No team found for your account"
            >
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Please contact support to be assigned to a team.
                </div>
            </Container>
        );
    }

    const captchaConfig = await (prismadb as any).teamCaptchaConfig.findUnique({
        where: { team_id: teamId }
    });

    return (
        <Container
            title="Captcha Configuration"
            description="Manage Cloudflare Turnstile keys for your team's forms."
        >
            <div className="max-w-4xl">
                <CaptchaConfigForm
                    teamId={teamId}
                    initialConfig={captchaConfig}
                />
            </div>
        </Container>
    );
}
