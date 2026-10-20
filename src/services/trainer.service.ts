import api from './api';
import {
  ApiResponse,
  CreateTrainerRequest,
  PageResponse,
  SpecializationResponse,
  TrainerResponse,
  TrainerSpecializationResponse,
  UpdateTrainerRequest,
} from '@/types';

export const trainerService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    branchId?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<TrainerResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<TrainerResponse>>>('/api/v1/trainers', {
      params,
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<TrainerResponse> => {
    const response = await api.get<ApiResponse<TrainerResponse>>(`/api/v1/trainers/${id}`);
    return response.data.data;
  },

  create: async (data: CreateTrainerRequest): Promise<TrainerResponse> => {
    const response = await api.post<ApiResponse<TrainerResponse>>('/api/v1/trainers', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateTrainerRequest): Promise<TrainerResponse> => {
    const response = await api.put<ApiResponse<TrainerResponse>>(`/api/v1/trainers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/trainers/${id}`);
  },

  getSpecializations: async (trainerId: string): Promise<TrainerSpecializationResponse[]> => {
    const response = await api.get<ApiResponse<TrainerSpecializationResponse[]>>(`/api/v1/trainer-specializations/trainer/${trainerId}`);
    return response.data.data;
  },

  assignSpecialization: async (trainerId: string, specializationId: number): Promise<TrainerSpecializationResponse> => {
    const response = await api.post<ApiResponse<TrainerSpecializationResponse>>('/api/v1/trainer-specializations', {
      trainerId,
      specializationId,
    });
    return response.data.data;
  },

  removeSpecialization: async (trainerId: string, specializationId: number): Promise<void> => {
    await api.delete(`/api/v1/trainer-specializations/trainer/${trainerId}/specialization/${specializationId}`);
  },
};
