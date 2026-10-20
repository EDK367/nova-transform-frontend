import api from './api';
import {
  ApiResponse,
  BranchResponse,
  CreateBranchRequest,
  PageResponse,
  UpdateBranchRequest,
} from '@/types';

export const branchService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<BranchResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<BranchResponse>>>('/api/v1/branches', {
      params,
    });
    return response.data.data;
  },

  getById: async (id: number): Promise<BranchResponse> => {
    const response = await api.get<ApiResponse<BranchResponse>>(`/api/v1/branches/${id}`);
    return response.data.data;
  },

  create: async (data: CreateBranchRequest): Promise<BranchResponse> => {
    const response = await api.post<ApiResponse<BranchResponse>>('/api/v1/branches', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateBranchRequest): Promise<BranchResponse> => {
    const response = await api.put<ApiResponse<BranchResponse>>(`/api/v1/branches/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/branches/${id}`);
  },
};
