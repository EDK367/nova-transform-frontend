import api from './api';
import { toPage } from './page-adapter';
import type {
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
    const response = await api.get<
      ApiResponse<ReceptionistResponse[]>
    >('/api/v1/receptionists');

    const receptionists = response.data.data ?? [];

    const filtered = receptionists
      .map((r) => ({
        ...r,
        userId: r.id,
      }))
      .filter(
        (r) =>
          params?.branchId == null ||
          r.branchId === params.branchId
      );

    return toPage(filtered, params);
  },

  getById: async (
    id: string
  ): Promise<ReceptionistResponse> => {
    const response = await api.get<
      ApiResponse<ReceptionistResponse>
    >(`/api/v1/receptionists/${id}`);

    return {
      ...response.data.data,
      userId: response.data.data.id,
    };
  },

  create: async (
    data: CreateReceptionistRequest
  ): Promise<ReceptionistResponse> => {
    const response = await api.post<
      ApiResponse<ReceptionistResponse>
    >('/api/v1/receptionists', data);

    return response.data.data;
  },

  update: async (
    id: string,
    data: UpdateReceptionistRequest
  ): Promise<ReceptionistResponse> => {
    const response = await api.put<
      ApiResponse<ReceptionistResponse>
    >(`/api/v1/receptionists/${id}`, data);

    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/receptionists/${id}`);
  },
};
