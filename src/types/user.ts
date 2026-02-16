export interface UserRole {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  fullName: string;
  fullNameBangla?: string;
  profilePhotoUrl?: string | null;
  isActive: boolean;
  roleId: string;
  role?: UserRole;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  roleId: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface UserListResponse {
  success: boolean;
  message: string;
  data: User[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
}
