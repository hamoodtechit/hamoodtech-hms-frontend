export interface GeneralConfig {
    email: string;
    phone: string;
    address: string;
    currency: string;
    timezone: string;
    hospitalName: string;
    currencySymbol: string;
}

export interface PharmacyConfig {
    vatPercentage: number;
    enableStockAlerts: boolean;
    lowStockThreshold: number;
}

export interface AppointmentConfig {
    endTime: string;
    startTime: string;
    weekendDays: string[];
    slotDuration: number;
}

export type SettingName = 'general' | 'pharmacy' | 'appointments';

export interface Setting<T = any> {
    id: string;
    name: SettingName;
    configs: T;
    createdAt: string;
    updatedAt: string;
}

export interface SettingsResponse {
    success: boolean;
    message: string;
    data: Setting[];
}

export interface SingleSettingResponse<T> {
    success: boolean;
    message: string;
    data: Setting<T>;
}
