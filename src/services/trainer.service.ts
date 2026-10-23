import api from './api';
import {
  ApiResponse,
  CreateTrainerRequest,
  PageResponse,
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
    const response = await api.get<ApiResponse<TrainerResponse[]>>(
      '/api/v1/trainers'
    );

    const trainers = response.data.data ?? [];

    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const sortBy = params?.sortBy ?? 'firstName';
    const sortDirection = params?.sortDirection ?? 'asc';

    const filtered = trainers
      .map((trainer) => ({
        ...trainer,
        userId: trainer.id,
      }))
      .filter((trainer) => {
        if (params?.branchId == null) {
          return true;
        }

        return Number(trainer.branchId) === params.branchId;
      });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = String(
        a[sortBy as keyof TrainerResponse] ?? ''
      );

      const bValue = String(
        b[sortBy as keyof TrainerResponse] ?? ''
      );

      const comparison = aValue.localeCompare(bValue, 'es');

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

  getById: async (id: string): Promise<TrainerResponse> => {
    const response = await api.get<ApiResponse<TrainerResponse>>(
      `/api/v1/trainers/${id}`
    );

    return {
      ...response.data.data,
      userId: response.data.data.id,
    };
  },

  create: async (
    data: CreateTrainerRequest
  ): Promise<TrainerResponse> => {
    const response = await api.post<ApiResponse<TrainerResponse>>(
      '/api/v1/trainers',
      data
    );

    return response.data.data;
  },

  update: async (
    id: string,
    data: UpdateTrainerRequest
  ): Promise<TrainerResponse> => {
    const response = await api.put<ApiResponse<TrainerResponse>>(
      `/api/v1/trainers/${id}`,
      data
    );

    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/trainers/${id}`);
  },

  getSpecializations: async (
    trainerId: string
  ): Promise<TrainerSpecializationResponse[]> => {
    const response = await api.get<
      ApiResponse<TrainerSpecializationResponse[]>
    >('/api/v1/trainer-specializations', {
      params: { trainerId },
    });

    return response.data.data ?? [];
  },

  assignSpecialization: async (
    trainerId: string,
    specializationId: number
  ): Promise<TrainerSpecializationResponse> => {
    const response = await api.post<
      ApiResponse<TrainerSpecializationResponse>
    >('/api/v1/trainer-specializations', {
      trainerId,
      specializationId,
    });

    return response.data.data;
  },

  removeSpecialization: async (
    trainerId: string,
    specializationId: number
  ): Promise<void> => {
    const response = await api.get<
      ApiResponse<
        (TrainerSpecializationResponse & { id: number })[]
      >
    >('/api/v1/trainer-specializations', {
      params: { trainerId },
    });

    const assignment = response.data.data.find(
      (item) => item.specializationId === specializationId
    );

    if (!assignment) {
      throw new Error('Especialidad no asignada al entrenador');
    }

    await api.delete(
      `/api/v1/trainer-specializations/${assignment.id}`
    );
  },
};
