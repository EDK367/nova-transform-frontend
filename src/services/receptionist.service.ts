import api from './api';
import {
  ApiResponse,
  CreateReceptionistRequest,
  PageResponse,
  ReceptionistResponse,
  UpdateReceptionistRequest,
} from '@/types';

export const receptionistService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    branchId?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<ReceptionistResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<ReceptionistResponse>>>('/api/v1/receptionists', {
      params,
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<ReceptionistResponse> => {
    const response = await api.get<ApiResponse<ReceptionistResponse>>(`/api/v1/receptionists/${id}`);
    return response.data.data;
  },

  create: async (data: CreateReceptionistRequest): Promise<ReceptionistResponse> => {
    const response = await api.post<ApiResponse<ReceptionistResponse>>('/api/v1/receptionists', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateReceptionistRequest): Promise<ReceptionistResponse> => {
    const response = await api.put<ApiResponse<ReceptionistResponse>>(`/api/v1/receptionists/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/receptionists/${id}`);
  },
};
