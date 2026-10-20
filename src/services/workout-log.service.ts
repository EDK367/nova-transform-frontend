import api from './api';
import {
  ApiResponse,
  CreateWorkoutLogRequest,
  PageResponse,
  UpdateWorkoutLogRequest,
  WorkoutLogResponse,
} from '@/types';

export const workoutLogService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    memberId?: string;
    routineId?: number;
    exerciseId?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<WorkoutLogResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<WorkoutLogResponse>>>('/api/v1/workout-logs', {
      params,
    });
    return response.data.data;
  },

  getById: async (id: number): Promise<WorkoutLogResponse> => {
    const response = await api.get<ApiResponse<WorkoutLogResponse>>(`/api/v1/workout-logs/${id}`);
    return response.data.data;
  },

  create: async (data: CreateWorkoutLogRequest): Promise<WorkoutLogResponse> => {
    const response = await api.post<ApiResponse<WorkoutLogResponse>>('/api/v1/workout-logs', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateWorkoutLogRequest): Promise<WorkoutLogResponse> => {
    const response = await api.put<ApiResponse<WorkoutLogResponse>>(`/api/v1/workout-logs/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/workout-logs/${id}`);
  },
};
