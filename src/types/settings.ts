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

export interface TaxConfig {
  taxName: string;
  taxPercentage: number;
  isTaxInclusive: boolean;
  taxRegistrationNumber: string;
}

export interface FinanceConfig {
  paymentMethodAccounts: {
    card?: { id?: string; name: string };
    cash?: { id?: string; name: string };
    Nagad?: { id?: string; name: string };
    bKash?: { id?: string; name: string };
    Rocket?: { id?: string; name: string };
    cheque?: { id?: string; name: string };
    online?: { id?: string; name: string };
    "Bank Transfer"?: { id?: string; name: string };
    [key: string]: { id?: string; name: string } | undefined;
  };
}

export type SettingName = 'general' | 'pharmacy' | 'appointments' | 'finance' | 'tax';

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
