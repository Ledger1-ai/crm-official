"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

function AnalyticsTrackerContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Ensure we have a consistent Visitor ID for this browser
        let visitorId = localStorage.getItem('cms_visitor_id');
        if (!visitorId) {
            visitorId = uuidv4();
            localStorage.setItem('cms_visitor_id', visitorId);
        }

        // Debounce tracking
        const timeoutId = setTimeout(() => {
            const trackPage = async () => {
                try {
                    await fetch('/api/analytics/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            path: pathname,
                            userAgent: navigator.userAgent,
                            visitorId: visitorId // Send stable ID
                        })
                    });
                } catch (error) {
                    console.error("Tracking failed", error);
                }
            };
            trackPage();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [pathname, searchParams]);

    return null;
}

export function AnalyticsTracker() {
    return (
        <Suspense fallback={null}>
            <AnalyticsTrackerContent />
        </Suspense>
    );
}
