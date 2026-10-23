import { toPage } from './page-adapter';
import api from './api';
import {
  ApiResponse,
  CreateExerciseRequest,
  ExerciseResponse,
  PageResponse,
  UpdateExerciseRequest,
} from '@/types';

export const exerciseService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    muscleGroup?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<ExerciseResponse>> => {
    const response = await api.get<
      ApiResponse<ExerciseResponse[]>
    >('/api/v1/exercises', {
      params: {
        muscleGroup: params?.muscleGroup,
      },
    });

    const exercises = response.data.data.map((item) => ({
      ...item,
      active: true,
    }));

    return toPage(exercises, params);
  },

  getById: async (id: number): Promise<ExerciseResponse> => {
    const response = await api.get<
      ApiResponse<ExerciseResponse>
    >(`/api/v1/exercises/${id}`);

    return response.data.data;
  },

  create: async (
    data: CreateExerciseRequest
  ): Promise<ExerciseResponse> => {
    const response = await api.post<
      ApiResponse<ExerciseResponse>
    >('/api/v1/exercises', data);

    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdateExerciseRequest
  ): Promise<ExerciseResponse> => {
    const response = await api.put<
      ApiResponse<ExerciseResponse>
    >(`/api/v1/exercises/${id}`, data);

    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/exercises/${id}`);
  },
};
