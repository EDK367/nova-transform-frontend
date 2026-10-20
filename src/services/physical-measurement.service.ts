import api from './api';
import {
  ApiResponse,
  CreatePhysicalMeasurementRequest,
  PageResponse,
  PhysicalMeasurementResponse,
  UpdatePhysicalMeasurementRequest,
} from '@/types';

export const physicalMeasurementService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    memberId?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<PhysicalMeasurementResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<PhysicalMeasurementResponse>>>('/api/v1/physical-measurements', {
      params,
    });
    return response.data.data;
  },

  getById: async (id: number): Promise<PhysicalMeasurementResponse> => {
    const response = await api.get<ApiResponse<PhysicalMeasurementResponse>>(`/api/v1/physical-measurements/${id}`);
    return response.data.data;
  },

  create: async (data: CreatePhysicalMeasurementRequest): Promise<PhysicalMeasurementResponse> => {
    const response = await api.post<ApiResponse<PhysicalMeasurementResponse>>('/api/v1/physical-measurements', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdatePhysicalMeasurementRequest): Promise<PhysicalMeasurementResponse> => {
    const response = await api.put<ApiResponse<PhysicalMeasurementResponse>>(`/api/v1/physical-measurements/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/physical-measurements/${id}`);
  },
};
