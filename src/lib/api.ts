import axios from 'axios';
import Cookies from 'js-cookie';

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

// Response interceptor to handle 401 errors (e.g., token expired)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token might be invalid or expired. Clear storage.
      // We avoid window.location.href here to let the auth store/middleware handle redirects if needed
      // or simply let the error propagate so the UI can react.
      // However, commonly we might want to clear cookies here.
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    }
    return Promise.reject(error);
  }
);
