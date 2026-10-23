
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
    const response = await api.get<ApiResponse<BranchResponse[]>>(
      '/api/v1/branches'
    );

    const branches = response.data.data ?? [];

    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const sortBy = params?.sortBy ?? 'name';
    const sortDirection = params?.sortDirection ?? 'asc';

    const sorted = [...branches].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'id') {
        comparison = a.id - b.id;
      } else if (sortBy === 'address') {
        comparison = (a.address ?? '').localeCompare(
          b.address ?? '',
          'es'
        );
      } else {
        comparison = a.name.localeCompare(b.name, 'es');
      }

      return sortDirection === 'desc'
        ? -comparison
        : comparison;
    });

    return {
      content: sorted.slice(page * size, (page + 1) * size),
      page,
      size,
      totalElements: sorted.length,
      totalPages: Math.ceil(sorted.length / size),
    };
  },

  getById: async (id: number): Promise<BranchResponse> => {
    const response = await api.get<ApiResponse<BranchResponse>>(
      `/api/v1/branches/${id}`
    );
    return response.data.data;
  },

  create: async (data: CreateBranchRequest): Promise<BranchResponse> => {
    const response = await api.post<ApiResponse<BranchResponse>>(
      '/api/v1/branches',
      data
    );
    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdateBranchRequest
  ): Promise<BranchResponse> => {
    const response = await api.put<ApiResponse<BranchResponse>>(
      `/api/v1/branches/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/branches/${id}`);
  },
};
