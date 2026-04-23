import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { useNotificationStore } from '@/store/use-notification-store';
import { toast } from 'sonner';

// Use standard API URL but without the /api/v1 suffix for socket
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://hms-srv-dev.genify.live';

export const useNotificationSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        const token = Cookies.get('accessToken');
        if (!token) return;

        // Initialize socket
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('Connected to Notification Server:', socket.id);
        });

        socket.on('notification:received', (notification) => {
            console.log('New Notification Received:', notification);
            addNotification(notification);
            
            // Show toast
            toast(notification.title || 'New Notification', {
                description: notification.content,
                action: {
                    label: 'View',
                    onClick: () => {
                        // Forward to notification page or open dropdown
                        window.dispatchEvent(new CustomEvent('notification:open'));
                    },
                },
            });
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from Notification Server:', reason);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [addNotification]);

    return socketRef.current;
};
