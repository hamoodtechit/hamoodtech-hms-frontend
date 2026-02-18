import {
    PermissionsResponse,
    Role,
    RoleDetailResponse,
    RolePayload,
    RolesResponse
} from '@/types/role';
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const roleService = {
  getPermissions: async (): Promise<PermissionsResponse> => {
    const response = await api.get<PermissionsResponse>('/permissions');
    return response.data;
  },

  getRoles: async (): Promise<RolesResponse> => {
    const response = await api.get<RolesResponse>('/roles');
    return response.data;
  },

  getRole: async (id: string): Promise<RoleDetailResponse> => {
    const response = await api.get<RoleDetailResponse>(`/roles/${id}`);
    return response.data;
  },

  createRole: async (data: RolePayload): Promise<Role> => {
    const response = await api.post('/roles', data);
    return response.data;
  },

  updateRole: async (id: string, data: Partial<RolePayload>): Promise<Role> => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};
