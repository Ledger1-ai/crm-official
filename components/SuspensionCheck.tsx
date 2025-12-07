import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import SuspendedOverlay from "@/components/SuspendedOverlay";

const SuspensionCheck = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        include: { assigned_team: true }
    }) as any;

    if (user?.assigned_team?.status === "SUSPENDED") {
        return <SuspendedOverlay reason={user.assigned_team.suspension_reason} />;
    }

    return null;
};

export default SuspensionCheck;
