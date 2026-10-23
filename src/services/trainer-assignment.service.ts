import { toPage } from './page-adapter';
import api from './api';
import {
  ApiResponse,
  CreateTrainerAssignmentRequest,
  PageResponse,
  TrainerAssignmentResponse,
  UpdateTrainerAssignmentRequest,
} from '@/types';

export const trainerAssignmentService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    trainerId?: string;
    memberId?: string;
    active?: boolean;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<TrainerAssignmentResponse>> => {
    type ApiAssignment = TrainerAssignmentResponse & {
      reason?: string;
    };

    const response = await api.get<ApiResponse<ApiAssignment[]>>(
      '/api/v1/trainer-assignments',
      {
        params: {
          trainerId: params?.trainerId,
          memberId: params?.memberId,
          activeOnly: params?.active,
        },
      }
    );

    const assignments = response.data.data.map((item) => ({
      ...item,
      notes: item.reason,
    }));

    return toPage(assignments, params);
  },

  getById: async (
    id: number
  ): Promise<TrainerAssignmentResponse> => {
    const response = await api.get<
      ApiResponse<TrainerAssignmentResponse>
    >(`/api/v1/trainer-assignments/${id}`);

    return response.data.data;
  },

  create: async (
    data: CreateTrainerAssignmentRequest
  ): Promise<TrainerAssignmentResponse> => {
    const response = await api.post<
      ApiResponse<TrainerAssignmentResponse>
    >('/api/v1/trainer-assignments', data);

    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdateTrainerAssignmentRequest
  ): Promise<TrainerAssignmentResponse> => {
    const response = await api.put<
      ApiResponse<TrainerAssignmentResponse>
    >(`/api/v1/trainer-assignments/${id}`, data);

    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/trainer-assignments/${id}`);
  },
};
