"use client";

import { useState, useEffect } from "react";

export function useUnreadMessages() {
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const fetchUnreadCount = async () => {
        try {
            const res = await fetch("/api/messages/unread");
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error("Failed to fetch unread messages", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        // Poll every 60 seconds
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    return { unreadCount, loading, refresh: fetchUnreadCount };
}
