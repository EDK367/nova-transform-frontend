import { toPage } from './page-adapter';
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
    type ApiLog = Omit<
      WorkoutLogResponse,
      'logDate' | 'setsCompleted' | 'repsCompleted'
    > & {
      date: string;
      actualSets: number;
      actualReps: number;
      actualWeight?: number;
      observation?: string;
    };

    const response = await api.get<ApiResponse<ApiLog[]>>(
      '/api/v1/workout-logs',
      {
        params: {
          memberId: params?.memberId,
        },
      }
    );

    const logs = response.data.data
      .map((item) => ({
        ...item,
        logDate: item.date,
        setsCompleted: item.actualSets,
        repsCompleted: item.actualReps,
        weightUsed: item.actualWeight,
        notes: item.observation,
      }))
      .filter(
        (item) =>
          !params?.exerciseId ||
          item.exerciseId === params.exerciseId
      );

    return toPage(logs, params);
  },

  getById: async (
    id: number
  ): Promise<WorkoutLogResponse> => {
    const response = await api.get<
      ApiResponse<WorkoutLogResponse>
    >(`/api/v1/workout-logs/${id}`);

    return response.data.data;
  },

  create: async (
    data: CreateWorkoutLogRequest
  ): Promise<WorkoutLogResponse> => {
    const payload = {
      memberId: data.memberId,
      routineExerciseId: data.routineExerciseId ?? data.exerciseId,
      date: data.logDate
        ? data.logDate.includes('T')
          ? new Date(data.logDate).toISOString()
          : `${data.logDate}T12:00:00Z`
        : new Date().toISOString(),
      actualSets: data.setsCompleted,
      actualReps: data.repsCompleted,
      actualWeight: data.weightUsed,
      observation: data.notes,
    };

    const response = await api.post<
      ApiResponse<WorkoutLogResponse>
    >('/api/v1/workout-logs', payload);

    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdateWorkoutLogRequest
  ): Promise<WorkoutLogResponse> => {
    const response = await api.put<
      ApiResponse<WorkoutLogResponse>
    >(`/api/v1/workout-logs/${id}`, data);

    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/workout-logs/${id}`);
  },
};
