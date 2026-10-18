import api from './api';
import {
  ApiResponse,
  ClassEnrollmentResponse,
  ClassRatingResponse,
  ClassResponse,
  ClassStatus,
  ClassTypeResponse,
  CreateClassRatingRequest,
  CreateClassRequest,
  CreateClassTypeRequest,
  CreateEnrollmentRequest,
  PageResponse,
  UpdateClassRequest,
  UpdateClassTypeRequest,
  WaitlistResponse,
} from '@/types';

export const classService = {
  // Classes
  getAll: async (params?: {
    page?: number;
    size?: number;
    branchId?: number;
    classTypeId?: number;
    trainerId?: string;
    status?: ClassStatus;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<ClassResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<ClassResponse>>>('/api/v1/classes', {
      params,
    });
    return response.data.data;
  },

  getById: async (id: number): Promise<ClassResponse> => {
    const response = await api.get<ApiResponse<ClassResponse>>(`/api/v1/classes/${id}`);
    return response.data.data;
  },

  create: async (data: CreateClassRequest): Promise<ClassResponse> => {
    const response = await api.post<ApiResponse<ClassResponse>>('/api/v1/classes', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateClassRequest): Promise<ClassResponse> => {
    const response = await api.put<ApiResponse<ClassResponse>>(`/api/v1/classes/${id}`, data);
    return response.data.data;
  },

  cancel: async (id: number): Promise<ClassResponse> => {
    const response = await api.post<ApiResponse<ClassResponse>>(`/api/v1/classes/${id}/cancel`);
    return response.data.data;
  },

  getClassEnrollments: async (id: number): Promise<ClassEnrollmentResponse[]> => {
    const response = await api.get<ApiResponse<ClassEnrollmentResponse[]>>(`/api/v1/classes/${id}/enrollments`);
    return response.data.data;
  },

  getClassWaitlist: async (id: number): Promise<WaitlistResponse[]> => {
    const response = await api.get<ApiResponse<WaitlistResponse[]>>(`/api/v1/classes/${id}/waitlist`);
    return response.data.data;
  },

  getClassRatings: async (id: number): Promise<ClassRatingResponse[]> => {
    const response = await api.get<ApiResponse<ClassRatingResponse[]>>(`/api/v1/classes/${id}/ratings`);
    return response.data.data;
  },

  // Class Types
  getTypes: async (): Promise<ClassTypeResponse[]> => {
    const response = await api.get<ApiResponse<ClassTypeResponse[]>>('/api/v1/class-types');
    return response.data.data;
  },

  getTypeById: async (id: number): Promise<ClassTypeResponse> => {
    const response = await api.get<ApiResponse<ClassTypeResponse>>(`/api/v1/class-types/${id}`);
    return response.data.data;
  },

  createType: async (data: CreateClassTypeRequest): Promise<ClassTypeResponse> => {
    const response = await api.post<ApiResponse<ClassTypeResponse>>('/api/v1/class-types', data);
    return response.data.data;
  },

  updateType: async (id: number, data: UpdateClassTypeRequest): Promise<ClassTypeResponse> => {
    const response = await api.put<ApiResponse<ClassTypeResponse>>(`/api/v1/class-types/${id}`, data);
    return response.data.data;
  },

  deleteType: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/class-types/${id}`);
  },

  // Enrollments
  enroll: async (data: CreateEnrollmentRequest): Promise<ClassEnrollmentResponse> => {
    const response = await api.post<ApiResponse<ClassEnrollmentResponse>>('/api/v1/class-enrollments', data);
    return response.data.data;
  },

  cancelEnrollment: async (id: number): Promise<ClassEnrollmentResponse> => {
    const response = await api.post<ApiResponse<ClassEnrollmentResponse>>(`/api/v1/class-enrollments/${id}/cancel`);
    return response.data.data;
  },

  getMyEnrollments: async (): Promise<ClassEnrollmentResponse[]> => {
    const response = await api.get<ApiResponse<ClassEnrollmentResponse[]>>('/api/v1/class-enrollments/my');
    return response.data.data;
  },

  // Ratings
  createRating: async (data: CreateClassRatingRequest): Promise<ClassRatingResponse> => {
    const response = await api.post<ApiResponse<ClassRatingResponse>>('/api/v1/class-ratings', data);
    return response.data.data;
  },

  getRatingByClassId: async (classId: number): Promise<ClassRatingResponse[]> => {
    const response = await api.get<ApiResponse<ClassRatingResponse[]>>(`/api/v1/class-ratings/class/${classId}`);
    return response.data.data;
  },

  // Waitlist
  getMyWaitlist: async (): Promise<WaitlistResponse[]> => {
    const response = await api.get<ApiResponse<WaitlistResponse[]>>('/api/v1/waitlists/my');
    return response.data.data;
  },

  removeFromWaitlist: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/waitlists/${id}`);
  },
};
