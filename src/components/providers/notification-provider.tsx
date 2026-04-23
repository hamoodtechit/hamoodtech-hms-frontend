"use client"

import { useNotificationSocket } from "@/hooks/use-notification-socket";
import { useNotificationStore } from "@/store/use-notification-store";
import { useEffect } from "react";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { fetchNotifications } = useNotificationStore();
    
    // Initialize socket connection
    useNotificationSocket();

    // Initial fetch of notifications to get the current unread count
    useEffect(() => {
        fetchNotifications(1, 10);
    }, [fetchNotifications]);

    return <>{children}</>;
}
