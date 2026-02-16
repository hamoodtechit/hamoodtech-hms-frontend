import { api } from '@/lib/api';
import { CreateUserPayload, UpdateUserPayload, UserListResponse, UserResponse } from '@/types/user';

export const userService = {
  getUsers: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
  }): Promise<UserListResponse> => {
    const response = await api.get<UserListResponse>('/users', { params });
    return response.data;
  },

  createUser: async (data: CreateUserPayload): Promise<UserResponse> => {
    const response = await api.post<UserResponse>('/users', data);
    return response.data;
  },

  getUser: async (id: string): Promise<UserResponse> => {
    const response = await api.get<UserResponse>(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserPayload): Promise<UserResponse> => {
    const response = await api.patch<UserResponse>(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/users/${id}`);
    return response.data;
  }
};
