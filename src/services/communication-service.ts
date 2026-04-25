import { api } from '@/lib/api';
import { NotificationResponse, Notification, Notice } from '@/types/communication';

export const communicationService = {
    // Notifications
    getNotifications: async (page = 1, limit = 20) => {
        const response = await api.get<NotificationResponse>('/communication/notifications', {
            params: { page, limit },
        });
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await api.patch(`/communication/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.patch('/communication/notifications/read-all');
        return response.data;
    },

    // Notices
    getNotices: async (params: { page?: number; limit?: number; departmentId?: string; branchId?: string; search?: string }) => {
        const response = await api.get('/communication/notices', { params });
        return response.data;
    },

    createNotice: async (data: { 
        title: string; 
        content: string; 
        departmentId?: string | null; 
        branchId?: string | null;
        attachmentUrl?: string | null 
    }) => {
        const response = await api.post('/communication/notices', data);
        return response.data;
    },

    getNoticeDetails: async (id: string) => {
        const response = await api.get(`/communication/notices/${id}`);
        return response.data;
    },

    deleteNotice: async (id: string) => {
        const response = await api.delete(`/communication/notices/${id}`);
        return response.data;
    }
};
