import api from './api';
import {
  ApiResponse,
  CreateSpecializationRequest,
  PageResponse,
  SpecializationResponse,
  UpdateSpecializationRequest,
} from '@/types';

export const specializationService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<SpecializationResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<SpecializationResponse>>>('/api/v1/specializations', {
      params,
    });
    return response.data.data;
  },

  getById: async (id: number): Promise<SpecializationResponse> => {
    const response = await api.get<ApiResponse<SpecializationResponse>>(`/api/v1/specializations/${id}`);
    return response.data.data;
  },

  create: async (data: CreateSpecializationRequest): Promise<SpecializationResponse> => {
    const response = await api.post<ApiResponse<SpecializationResponse>>('/api/v1/specializations', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateSpecializationRequest): Promise<SpecializationResponse> => {
    const response = await api.put<ApiResponse<SpecializationResponse>>(`/api/v1/specializations/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/specializations/${id}`);
  },
};
