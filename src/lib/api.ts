import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hms-srv.hamoodtech.com/api/v1';

export const api = axios.create({
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // Token might be invalid or expired. Clear storage.
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
      } else if (error.response.status === 403) {
        // Permission denied
        toast.error("You do not have permission to perform this action.");
      }
    }
    return Promise.reject(error);
  }
);
