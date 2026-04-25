import { create } from 'zustand';
import { communicationService } from '@/services/communication-service';
import { Notification } from '@/types/communication';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    meta: {
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
    fetchNotifications: (page?: number, limit?: number) => Promise<void>;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    meta: {
        totalItems: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
    },

    fetchNotifications: async (page = 1, limit = 20) => {
        set({ isLoading: true });
        try {
            const response = await communicationService.getNotifications(page, limit);
            if (response.success) {
                set({
                    notifications: response.data,
                    unreadCount: response.meta.unreadCount,
                    meta: {
                        totalItems: response.meta.totalItems,
                        page: response.meta.page,
                        pageSize: response.meta.pageSize,
                        totalPages: response.meta.totalPages,
                    },
                    isLoading: false
                });
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            set({ isLoading: false });
        }
    },

    addNotification: (notification) => {
        set((state) => {
            // Prevent duplicate notifications if already fetched/added
            if (state.notifications.some(n => n.id === notification.id)) return state;
            
            return {
                notifications: [notification, ...state.notifications],
                unreadCount: state.unreadCount + 1,
            };
        });
    },

    markAsRead: async (id) => {
        try {
            await communicationService.markAsRead(id);
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await communicationService.markAllAsRead();
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
                unreadCount: 0,
            }));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    },

    reset: () => {
        set({
            notifications: [],
            unreadCount: 0,
            isLoading: false,
            meta: {
                totalItems: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            },
        });
    },
}));
