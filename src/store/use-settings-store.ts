import { settingsService } from '@/services/settings-service';
import { AppointmentConfig, GeneralConfig, PharmacyConfig, Setting } from '@/types/settings';
import { create } from 'zustand';

interface SettingsState {
    general: GeneralConfig | null;
    pharmacy: PharmacyConfig | null;
    appointments: AppointmentConfig | null;
    loading: boolean;
    error: string | null;
    
    fetchSettings: () => Promise<void>;
    getSetting: <T>(name: 'general' | 'pharmacy' | 'appointments') => T | null;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    general: null,
    pharmacy: null,
    appointments: null,
    loading: false,
    error: null,

    fetchSettings: async () => {
        try {
            set({ loading: true, error: null });
            const response = await settingsService.getSettings();
            
            if (response.success && response.data) {
                const general = response.data.find((s: Setting) => s.name === 'general')?.configs as GeneralConfig;
                const pharmacy = response.data.find((s: Setting) => s.name === 'pharmacy')?.configs as PharmacyConfig;
                const appointments = response.data.find((s: Setting) => s.name === 'appointments')?.configs as AppointmentConfig;

                set({ 
                    general: general || null, 
                    pharmacy: pharmacy || null, 
                    appointments: appointments || null 
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            set({ error: 'Failed to load application settings' });
            // toast.error('Failed to load application settings'); // Optional: decide if we want to toast on global load fail
        } finally {
            set({ loading: false });
        }
    },

    getSetting: <T>(name: 'general' | 'pharmacy' | 'appointments') => {
        return get()[name] as T | null;
    }
}));
