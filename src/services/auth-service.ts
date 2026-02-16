import { api } from '@/lib/api';
import Cookies from 'js-cookie';

export interface SetupPayload {
  hospital: {
    name: string;
    nameBangla?: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
    website?: string;
    licenseNumber?: string;
    taxRegistration?: string;
  };
  settings: {
    currency: string;
    currencySymbol: string;
    timezone: string;
    vatPercentage: number;
    lowStockThreshold: number;
  };
  admin: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    fullNameBangla?: string;
  };
}

export interface SetupStatusResponse {
  success: boolean;
  message: string;
  data: {
    isSetupComplete: boolean;
  };
}

export interface ChangePasswordPayload {
  oldPassword?: string;
  newPassword: string;
  confirmPassword?: string;
  [key: string]: unknown;
}

export const authService = {
  login: async (usernameOrEmail: string, password: string) => {
    const response = await api.post('/auth/login', { usernameOrEmail, password });
    if (response.data.success) {
        Cookies.set('accessToken', response.data.data.accessToken, { expires: 7 }); // Expires in 7 days
        Cookies.set('refreshToken', response.data.data.refreshToken, { expires: 30 });
    }
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getSetupStatus: async (): Promise<SetupStatusResponse> => {
      try {
        const response = await api.get<SetupStatusResponse>('/setup/status');
        return response.data;
      } catch (error) {
          console.error("Failed to check setup status", error);
          throw error;
      }
  },

  setupSystem: async (data: SetupPayload) => {
      const response = await api.post('/setup', data);
      return response.data;
  },

  changePassword: async (data: ChangePasswordPayload) => {
      const response = await api.post('/auth/change-password', data);
      return response.data;
  },
  
  logout: () => {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
  }
};
