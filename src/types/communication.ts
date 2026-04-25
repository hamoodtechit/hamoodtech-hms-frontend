export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

export interface Notice {
    id: string;
    title: string;
    content: string;
    departmentId?: string | null;
    branchId?: string | null;
    attachmentUrl?: string | null;
    createdAt: string;
}

export interface NotificationResponse {
    success: boolean;
    message: string;
    data: Notification[];
    meta: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        unreadCount: number;
    };
}
