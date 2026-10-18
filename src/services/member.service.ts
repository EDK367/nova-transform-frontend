import api from './api';
import {
  ApiResponse,
  CreateMemberRequest,
  CreateMemberResponse,
  MemberResponse,
  PageResponse,
} from '@/types';

export const memberService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    order?: string;
  }): Promise<PageResponse<MemberResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<MemberResponse>>>('/api/v1/members', {
      params,
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<MemberResponse> => {
    const response = await api.get<ApiResponse<MemberResponse>>(`/api/v1/members/${id}`);
    return response.data.data;
  },

  create: async (data: CreateMemberRequest): Promise<CreateMemberResponse> => {
    const response = await api.post<ApiResponse<CreateMemberResponse>>('/api/v1/members', data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/members/${id}`);
  },
};
