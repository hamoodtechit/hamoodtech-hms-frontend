import { create } from 'zustand';
import { Notice } from '@/types/communication';
import { communicationService } from '@/services/communication-service';

interface NoticeStore {
    selectedNoticeId: string | null;
    selectedNotice: Notice | null;
    isLoading: boolean;
    isOpen: boolean;
    openNotice: (id: string) => Promise<void>;
    closeNotice: () => void;
}

export const useNoticeStore = create<NoticeStore>((set) => ({
    selectedNoticeId: null,
    selectedNotice: null,
    isLoading: false,
    isOpen: false,

    openNotice: async (id: string) => {
        set({ selectedNoticeId: id, isOpen: true, isLoading: true, selectedNotice: null });
        try {
            const response = await communicationService.getNoticeDetails(id);
            if (response.success) {
                set({ selectedNotice: response.data, isLoading: false });
            } else {
                set({ isLoading: false, isOpen: false });
            }
        } catch (error) {
            console.error('Failed to fetch notice details:', error);
            set({ isLoading: false, isOpen: false });
        }
    },

    closeNotice: () => {
        set({ isOpen: false, selectedNoticeId: null, selectedNotice: null });
    },
}));
