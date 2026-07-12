import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { useNotificationStore } from '@/store/use-notification-store';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { DIAGNOSTIC_KEYS } from './diagnostic-queries';
import { SALES_KEYS } from './sales-queries';

// Use standard API URL but without the /api/v1 suffix for socket
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://hms-srv-dev.genify.live';

export const useNotificationSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const { addNotification } = useNotificationStore();
    const queryClient = useQueryClient();

    useEffect(() => {
        const token = Cookies.get('accessToken');
        if (!token) return;

        // Initialize socket
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        

        socket.on('notification:received', (notification) => {
            
            addNotification(notification);
            
            // Show toast
            toast(notification.title || 'New Notification', {
                description: notification.message,
                action: {
                    label: 'View',
                    onClick: () => {
                        if (notification.link) {
                            window.location.href = notification.link;
                        } else {
                            window.dispatchEvent(new CustomEvent('notification:open'));
                        }
                    },
                },
            });
        });

        // When a sale is returned, refresh diagnostic reports & sales data
        socket.on('sale:returned', (data) => {
            console.log('[Socket] sale:returned event received:', data);
            
            // Add a small delay to ensure backend database transaction is fully committed
            setTimeout(() => {
                // Forcefully invalidate diagnostic reports immediately
                queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.all });
                
                // Forcefully invalidate sales queries immediately
                queryClient.invalidateQueries({ queryKey: SALES_KEYS.all });
            }, 500);
            
            toast.info('Sale Return Processed', {
                description: data?.invoiceNumber 
                    ? `Sale ${data.invoiceNumber} has been returned. Reports updated.`
                    : 'A sale return has been processed. Reports updated.',
            });
        });

        // When a new sale is created, refresh diagnostic reports & sales data
        socket.on('sale:created', (data) => {
            console.log('[Socket] sale:created event received:', data);
            
            // Add a small delay to ensure backend database transaction is fully committed
            setTimeout(() => {
                // Forcefully invalidate diagnostic reports to show new tests
                queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.all });
                
                // Forcefully invalidate sales queries
                queryClient.invalidateQueries({ queryKey: SALES_KEYS.all });
            }, 500);
            
            toast.success('New Sale Created', {
                description: data?.invoiceNumber 
                    ? `Sale ${data.invoiceNumber} has been created. Reports updated.`
                    : 'A new sale has been created. Reports updated.',
            });
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

       

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [addNotification, queryClient]);

    return socketRef.current;
};

