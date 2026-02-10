import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNotifications } from "@/actions/crm/notifications";
import { NotificationsClient } from "./components/NotificationsClient";
import { Bell } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
    title: "Notifications | CRM",
    description: "Manage your alerts and activity"
};

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const notifications = await getNotifications();

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg">
                        <Bell className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-sm text-muted-foreground">
                            Stay up to date with your CRM activity
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                <Suspense fallback={<div>Loading notifications...</div>}>
                    <NotificationsClient initialNotifications={JSON.parse(JSON.stringify(notifications))} />
                </Suspense>
            </div>
        </div>
    );
}
