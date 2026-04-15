import {
  PermissionsResponse,
  Role,
  RoleDetailResponse,
  RolePayload,
  RolesResponse
} from '@/types/role';
import { api } from '@/lib/api';

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
