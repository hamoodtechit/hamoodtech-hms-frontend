import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hms-srv.hamoodtech.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token header to every request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors (e.g., token expired)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token might be invalid or expired. Clear storage and redirect to login if not already there.
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      // Optional: Redirect to login page
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export interface SetupPayload {
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
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

  getSetupStatus: async () => {
      // Based on user request, this is a GET request to /setup/status
      try {
        const response = await api.get('/setup/status');
        return response.data;
      } catch (error) {
          // If the endpoint doesn't exist or errors, we might assume setup is needed or handle it gracefully
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
