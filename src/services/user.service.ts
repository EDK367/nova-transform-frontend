import api from './api';
import {
  ApiResponse,
  AssignRolePermissionsRequest,
  CreatePermissionRequest,
  CreateRoleRequest,
  CreateUserRequest,
  CreateUserResponse,
  PageResponse,
  PermissionResponse,
  RoleResponse,
  UpdatePermissionRequest,
  UpdateRoleRequest,
  UpdateUserRequest,
  UserResponse,
} from '@/types';

export const userService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    order?: string;
  }): Promise<PageResponse<UserResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<UserResponse>>>('/api/v1/users', {
      params,
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<UserResponse> => {
    const response = await api.get<ApiResponse<UserResponse>>(`/api/v1/users/${id}`);
    return response.data.data;
  },

  create: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await api.post<ApiResponse<CreateUserResponse>>('/api/v1/users', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
    const response = await api.put<ApiResponse<UserResponse>>(`/api/v1/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/users/${id}`);
  },

  // Roles Management
  getRoles: async (): Promise<RoleResponse[]> => {
    const response = await api.get<ApiResponse<RoleResponse[]>>('/api/v1/roles');
    return response.data.data;
  },

  getRoleById: async (id: number): Promise<RoleResponse> => {
    const response = await api.get<ApiResponse<RoleResponse>>(`/api/v1/roles/${id}`);
    return response.data.data;
  },

  createRole: async (data: CreateRoleRequest): Promise<RoleResponse> => {
    const response = await api.post<ApiResponse<RoleResponse>>('/api/v1/roles', data);
    return response.data.data;
  },

  updateRole: async (id: number, data: UpdateRoleRequest): Promise<RoleResponse> => {
    const response = await api.put<ApiResponse<RoleResponse>>(`/api/v1/roles/${id}`, data);
    return response.data.data;
  },

  updateRolePermissions: async (id: number, data: AssignRolePermissionsRequest): Promise<RoleResponse> => {
    const response = await api.put<ApiResponse<RoleResponse>>(`/api/v1/roles/${id}/permissions`, data);
    return response.data.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/roles/${id}`);
  },

  // Permissions Catalog Management
  getPermissions: async (module?: string): Promise<PermissionResponse[]> => {
    const response = await api.get<ApiResponse<PermissionResponse[]>>('/api/v1/permissions', {
      params: module ? { module } : undefined,
    });
    return response.data.data;
  },

  createPermission: async (data: CreatePermissionRequest): Promise<PermissionResponse> => {
    const response = await api.post<ApiResponse<PermissionResponse>>('/api/v1/permissions', data);
    return response.data.data;
  },

  updatePermission: async (id: number, data: UpdatePermissionRequest): Promise<PermissionResponse> => {
    const response = await api.put<ApiResponse<PermissionResponse>>(`/api/v1/permissions/${id}`, data);
    return response.data.data;
  },

  deletePermission: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/permissions/${id}`);
  },
};
