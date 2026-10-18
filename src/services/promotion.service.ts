import api from './api';
import {
  ApiResponse,
  CreatePromotionRequest,
  PromotionResponse,
  UpdatePromotionRequest,
} from '@/types';

export const promotionService = {
  getAll: async (onlyActive: boolean = false): Promise<PromotionResponse[]> => {
    const response = await api.get<ApiResponse<PromotionResponse[]>>('/api/v1/promotions', {
      params: { onlyActive },
    });
    return response.data.data;
  },

  getById: async (id: number): Promise<PromotionResponse> => {
    const response = await api.get<ApiResponse<PromotionResponse>>(`/api/v1/promotions/${id}`);
    return response.data.data;
  },

  create: async (data: CreatePromotionRequest): Promise<PromotionResponse> => {
    const response = await api.post<ApiResponse<PromotionResponse>>('/api/v1/promotions', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdatePromotionRequest): Promise<PromotionResponse> => {
    const response = await api.put<ApiResponse<PromotionResponse>>(`/api/v1/promotions/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/promotions/${id}`);
  },
};
