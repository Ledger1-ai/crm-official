"use client";

import { useSession } from "next-auth/react";
import { SWRConfig } from "swr";
import { useEffect, useState } from "react";

export const SWRSessionProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session } = useSession();
    const [provider, setProvider] = useState<any>(undefined);

    useEffect(() => {
        if (!session?.user?.email) return;

        // Initialize provider only on client side with user spacing
        const key = `app-swr-cache-${session.user.email}`;

        const localStorageProvider = () => {
            const map = new Map(JSON.parse(sessionStorage.getItem(key) || "[]"));

            // Before unloading, save back to sessionStorage
            window.addEventListener("beforeunload", () => {
                try {
                    const appCache = JSON.stringify(Array.from(map.entries()));
                    sessionStorage.setItem(key, appCache);
                } catch (e) {
                    console.warn('Failed to save SWR cache to sessionStorage:', e);
                }
            });

            return map;
        };

        setProvider(() => localStorageProvider);
    }, [session?.user?.email]);

    if (!provider) {
        return <>{children}</>;
    }

    return (
        <SWRConfig value={{ provider }}>
            {children}
        </SWRConfig>
    );
};
