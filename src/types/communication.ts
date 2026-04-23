export interface Notification {
    id: string;
    title: string;
    content: string;
    type: 'individual' | 'department' | 'branch' | 'global';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    isRead: boolean;
    metadata?: any;
    createdAt: string;
}

export interface Notice {
    id: string;
    title: string;
    content: string;
    departmentId?: string;
    attachmentUrl?: string;
    createdBy: string;
    createdAt: string;
}

export interface NotificationResponse {
    success: boolean;
    data: Notification[];
    unreadCount: number;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
