import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL 


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
      const status = error.response.status;
      const backendMessage = error.response.data?.message;

      if (status === 401) {
        // Token might be invalid or expired. Clear storage.
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
      } else if (status === 403) {
        // Permission denied
        toast.error(backendMessage || "You do not have permission to perform this action.");
      } else if (backendMessage && [400, 404, 409, 422, 500].includes(status)) {
        // Show the backend's descriptive error message to the user
        toast.error(backendMessage);
      }
    } else if (error.request) {
      // Network error — request was made but no response received
      toast.error("Network error. Please check your connection.");
    }
    return Promise.reject(error);
  }
);
