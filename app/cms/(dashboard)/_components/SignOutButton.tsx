"use client";

import { signOut } from "next-auth/react";
import { clearUserCache } from "@/lib/cache-utils";
import { LogOut } from "lucide-react";

export default function SignOutButton({ callbackUrl }: { callbackUrl: string }) {
    return (
        <button
            onClick={() => { clearUserCache(); signOut({ callbackUrl }); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
        >
            <LogOut className="h-4 w-4" /> Sign Out
        </button>
    );
}
