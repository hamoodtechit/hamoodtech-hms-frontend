import { settingsService } from '@/services/settings-service';
import { AppointmentConfig, FinanceConfig, GeneralConfig, PharmacyConfig, Setting, TaxConfig } from '@/types/settings';
import { create } from 'zustand';

interface SettingsState {
    general: GeneralConfig | null;
    pharmacy: PharmacyConfig | null;
    appointments: AppointmentConfig | null;
    finance: FinanceConfig | null;
    tax: TaxConfig | null;
    loading: boolean;
    error: string | null;
    
    fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    general: null,
    pharmacy: null,
    appointments: null,
    finance: null,
    tax: null,
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
                const finance = response.data.find((s: Setting) => s.name === 'finance')?.configs as FinanceConfig;
                const tax = response.data.find((s: Setting) => s.name === 'tax')?.configs as TaxConfig;

                set({ 
                    general: general || null, 
                    pharmacy: pharmacy || null, 
                    appointments: appointments || null,
                    finance: finance || null,
                    tax: tax || null
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
