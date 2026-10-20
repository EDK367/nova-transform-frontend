import api from './api';
import {
  ApiResponse,
  AssignMemberGoalRequest,
  CreateGoalRequest,
  GoalResponse,
  MemberGoalResponse,
  PageResponse,
  UpdateGoalRequest,
  UpdateMemberGoalRequest,
} from '@/types';

export const goalService = {
  getAllGoals: async (params?: {
    page?: number;
    size?: number;
    category?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<GoalResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<GoalResponse>>>('/api/v1/goals', {
      params,
    });
    return response.data.data;
  },

  getGoalById: async (id: number): Promise<GoalResponse> => {
    const response = await api.get<ApiResponse<GoalResponse>>(`/api/v1/goals/${id}`);
    return response.data.data;
  },

  createGoal: async (data: CreateGoalRequest): Promise<GoalResponse> => {
    const response = await api.post<ApiResponse<GoalResponse>>('/api/v1/goals', data);
    return response.data.data;
  },

  updateGoal: async (id: number, data: UpdateGoalRequest): Promise<GoalResponse> => {
    const response = await api.put<ApiResponse<GoalResponse>>(`/api/v1/goals/${id}`, data);
    return response.data.data;
  },

  deleteGoal: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/goals/${id}`);
  },

  getMemberGoals: async (params?: {
    page?: number;
    size?: number;
    memberId?: string;
    status?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<MemberGoalResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<MemberGoalResponse>>>('/api/v1/member-goals', {
      params,
    });
    return response.data.data;
  },

  getMemberGoalById: async (id: number): Promise<MemberGoalResponse> => {
    const response = await api.get<ApiResponse<MemberGoalResponse>>(`/api/v1/member-goals/${id}`);
    return response.data.data;
  },

  assignMemberGoal: async (data: AssignMemberGoalRequest): Promise<MemberGoalResponse> => {
    const response = await api.post<ApiResponse<MemberGoalResponse>>('/api/v1/member-goals', data);
    return response.data.data;
  },

  updateMemberGoal: async (id: number, data: UpdateMemberGoalRequest): Promise<MemberGoalResponse> => {
    const response = await api.put<ApiResponse<MemberGoalResponse>>(`/api/v1/member-goals/${id}`, data);
    return response.data.data;
  },

  deleteMemberGoal: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/member-goals/${id}`);
  },
};
