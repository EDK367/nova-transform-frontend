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
    const response = await api.get<
      ApiResponse<SpecializationResponse[]>
    >('/api/v1/specializations');

    const specializations = response.data.data ?? [];

    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const sortBy = params?.sortBy ?? 'name';
    const sortDirection = params?.sortDirection ?? 'asc';

    const sorted = [...specializations].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'id') {
        comparison = a.id - b.id;
      } else {
        const aValue = String(
          a[sortBy as keyof SpecializationResponse] ?? ''
        );

        const bValue = String(
          b[sortBy as keyof SpecializationResponse] ?? ''
        );

        comparison = aValue.localeCompare(bValue, 'es');
      }

      return sortDirection === 'desc'
        ? -comparison
        : comparison;
    });

    return {
      content: sorted.slice(
        page * size,
        (page + 1) * size
      ),
      page,
      size,
      totalElements: sorted.length,
      totalPages: Math.ceil(sorted.length / size),
    };
  },

  getById: async (
    id: number
  ): Promise<SpecializationResponse> => {
    const response = await api.get<
      ApiResponse<SpecializationResponse>
    >(`/api/v1/specializations/${id}`);

    return response.data.data;
  },

  create: async (
    data: CreateSpecializationRequest
  ): Promise<SpecializationResponse> => {
    const response = await api.post<
      ApiResponse<SpecializationResponse>
    >('/api/v1/specializations', data);

    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdateSpecializationRequest
  ): Promise<SpecializationResponse> => {
    const response = await api.put<
      ApiResponse<SpecializationResponse>
    >(`/api/v1/specializations/${id}`, data);

    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/specializations/${id}`);
  },
};
