import api from './api';
import {
  ApiResponse,
  CreateUserRequest,
  CreateUserResponse,
  PageResponse,
  RoleResponse,
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

  getRoles: async (): Promise<RoleResponse[]> => {
    const response = await api.get<ApiResponse<RoleResponse[]>>('/api/v1/roles');
    return response.data.data;
  },
};
