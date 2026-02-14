import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FileText, Briefcase, BookOpen, Settings, LogOut, Globe } from "lucide-react";
import { headers } from "next/headers";

export const metadata = {
    title: "BasaltCMS Admin",
    description: "Content Management System",
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check if we are on the login page to avoid infinite redirect loop
    // We can't easily check pathname in server component layout without headers hack or middleware
    // But since login page is a child of this layout, we need to handle it.
    // Actually, usually login page should NOT share the protected layout.
    // Best practice: 
    // app/admin/layout.tsx -> Protected
    // app/admin/login/page.tsx -> Public (should be outside this layout or handle it)

    // However, since I moved the whole folder, login is inside.
    // I will check headers to see if we are on login page.
    const headersList = headers();
    // This is a bit hacky. Better approach:
    // Move protected pages to app/admin/(protected)/...
    // and login to app/admin/login/page.tsx
    // But for now, let's try to detect if we are in login.

    // Actually, I'll move the protected content to a group `(dashboard)` inside `admin`.
    // But I just moved everything to `admin`.

    // Let's check session.
    const session = await getServerSession(authOptions);

    // If we are on the login page, we render children without sidebar/protection
    // We can't know for sure in layout.

    // STRATEGY CHANGE:
    // I will create `app/admin/(auth)/login/page.tsx` and `app/admin/(dashboard)/layout.tsx`.
    // But I don't want to move files again right now if I can avoid it.

    // Let's assume this layout applies to everything. 
    // I will use a Client Component wrapper to check pathname? No, that causes flash.

    // Let's just check session. If no session, we render the login page IF the route is /admin/login.
    // But we can't conditionally render based on route in Server Layout easily.

    // CORRECT APPROACH:
    // 1. Create `app/admin/login/page.tsx` (It already exists potentially or I will create it).
    // 2. The layout will wrap it.
    // 3. I will move the protection logic to `app/admin/(dashboard)/layout.tsx` and move all other admin pages into `(dashboard)`.

    // Let's do the move. It's cleaner.
    return (
        <div className="min-h-screen bg-black text-slate-200">
            {children}
        </div>
    );
}
