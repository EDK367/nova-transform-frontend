import api from './api';
import {
  ApiResponse,
  AttendanceResponse,
  CreateAttendanceRequest,
  PageResponse,
  UpdateAttendanceExitRequest,
} from '@/types';

export const attendanceService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    branchId?: number;
    memberId?: string;
    date?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<AttendanceResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<AttendanceResponse>>>('/api/v1/attendances', {
      params,
    });
    return response.data.data;
  },

  getMy: async (): Promise<AttendanceResponse[]> => {
    const response = await api.get<ApiResponse<AttendanceResponse[]>>('/api/v1/attendances/my');
    return response.data.data;
  },

  getById: async (id: number): Promise<AttendanceResponse> => {
    const response = await api.get<ApiResponse<AttendanceResponse>>(`/api/v1/attendances/${id}`);
    return response.data.data;
  },

  checkIn: async (data: CreateAttendanceRequest): Promise<AttendanceResponse> => {
    const response = await api.post<ApiResponse<AttendanceResponse>>('/api/v1/attendances', data);
    return response.data.data;
  },

  checkOut: async (id: number, data?: UpdateAttendanceExitRequest): Promise<AttendanceResponse> => {
    const response = await api.put<ApiResponse<AttendanceResponse>>(`/api/v1/attendances/${id}/checkout`, data || {});
    return response.data.data;
  },

  downloadReportPdf: async (params?: { memberId?: string; branchId?: number }): Promise<Blob> => {
    const response = await api.get('/api/v1/reports/attendances/pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
