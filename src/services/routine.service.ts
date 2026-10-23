import { toPage } from './page-adapter';
import api from './api';
import {
  AddRoutineExerciseRequest,
  ApiResponse,
  CreateRoutineRequest,
  PageResponse,
  RoutineExerciseResponse,
  RoutineResponse,
  UpdateRoutineRequest,
} from '@/types';

export const routineService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    trainerId?: string;
    memberId?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<RoutineResponse>> => {
    const response = await api.get<
      ApiResponse<RoutineResponse[]>
    >('/api/v1/routines', {
      params: {
        memberId: params?.memberId,
      },
    });

    const routines = response.data.data.filter(
      (item) =>
        !params?.trainerId ||
        item.trainerId === params.trainerId
    );

    return toPage(routines, params);
  },

  getById: async (id: number): Promise<RoutineResponse> => {
    const response = await api.get<
      ApiResponse<RoutineResponse>
    >(`/api/v1/routines/${id}`);

    return response.data.data;
  },

  create: async (
    data: CreateRoutineRequest
  ): Promise<RoutineResponse> => {
    const response = await api.post<
      ApiResponse<RoutineResponse>
    >('/api/v1/routines', data);

    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdateRoutineRequest
  ): Promise<RoutineResponse> => {
    const response = await api.put<
      ApiResponse<RoutineResponse>
    >(`/api/v1/routines/${id}`, data);

    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/routines/${id}`);
  },

  getExercises: async (
    routineId: number
  ): Promise<RoutineExerciseResponse[]> => {
    const response = await api.get<
      ApiResponse<RoutineExerciseResponse[]>
    >(`/api/v1/routine-exercises/routine/${routineId}`);

    return response.data.data;
  },

  addExercise: async (
    routineId: number,
    data: AddRoutineExerciseRequest
  ): Promise<RoutineExerciseResponse> => {
    const response = await api.post<
      ApiResponse<RoutineExerciseResponse>
    >('/api/v1/routine-exercises', {
      routineId,
      ...data,
    });

    return response.data.data;
  },

  removeExercise: async (
    routineExerciseId: number
  ): Promise<void> => {
    await api.delete(
      `/api/v1/routine-exercises/${routineExerciseId}`
    );
  },
};
