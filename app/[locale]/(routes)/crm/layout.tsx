import CrmSidebar from "./components/CrmSidebar";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function CrmLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    let isMember = false;

    if (session?.user?.id) {
        const user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: { team_role: true }
        });
        isMember = user?.team_role === "MEMBER";
    }

    return (
        <div className="flex h-full w-full overflow-hidden">
            <CrmSidebar isMember={isMember} />
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-32 md:pb-0">
                {children}
            </div>
        </div>
    );
}
