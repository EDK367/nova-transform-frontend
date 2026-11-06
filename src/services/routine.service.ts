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
    const payload = {
      assignmentId: data.assignmentId,
      name: data.name,
      description: data.description,
    };

    const response = await api.post<
      ApiResponse<RoutineResponse>
    >('/api/v1/routines', payload);

    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdateRoutineRequest
  ): Promise<RoutineResponse> => {
    const payload = {
      name: data.name,
      description: data.description,
      active: data.active,
    };

    const response = await api.put<
      ApiResponse<RoutineResponse>
    >(`/api/v1/routines/${id}`, payload);

    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/routines/${id}`);
  },

  getExercises: async (
    routineId?: number
  ): Promise<RoutineExerciseResponse[]> => {
    type ApiRoutineExercise = RoutineExerciseResponse & {
      reps?: number;
      rest?: number;
      trainingDay?: string;
    };

    const response = await api.get<
      ApiResponse<ApiRoutineExercise[]>
    >('/api/v1/routine-exercises', {
      params: routineId ? { routineId } : undefined,
    });

    return response.data.data.map((item) => ({
      ...item,
      repetitions: item.reps ?? item.repetitions,
      restSeconds: item.rest ?? item.restSeconds,
      notes: item.trainingDay ?? item.notes,
    }));
  },

  addExercise: async (
    routineId: number,
    data: AddRoutineExerciseRequest
  ): Promise<RoutineExerciseResponse> => {
    const payload = {
      routineId,
      exerciseId: data.exerciseId,
      trainingDay: data.trainingDay || data.notes || 'General',
      sets: data.sets,
      reps: data.repetitions,
      rest: data.restSeconds,
      weight: data.weight,
    };

    const response = await api.post<
      ApiResponse<RoutineExerciseResponse>
    >('/api/v1/routine-exercises', payload);

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
