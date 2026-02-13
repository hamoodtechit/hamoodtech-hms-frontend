export interface Permission {
  id: string;
  key: string;
  action: string;
  description: string;
}

export interface PermissionModule {
  [moduleName: string]: Permission[];
}

export interface PermissionsResponse {
  success: boolean;
  message: string;
  data: PermissionModule;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissionCount?: number; // Optional as detail view has permissionsByModule instead
  userCount: number;
  permissionsByModule?: PermissionModule; // Present in detail view
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePayload {
  name: string;
  description: string;
  permissionIds?: string[];
}

export interface RolesResponse {
  success: boolean;
  message: string;
  data: Role[];
}

export interface RoleDetailResponse {
  success: boolean;
  message: string;
  data: Role;
}
