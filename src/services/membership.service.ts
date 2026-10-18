import api from './api';
import {
  ApiResponse,
  BenefitResponse,
  CancelMembershipRequest,
  ChangePlanRequest,
  CreateBenefitRequest,
  CreateMembershipPlanRequest,
  CreateMembershipRequest,
  FreezeMembershipRequest,
  MembershipFreezeResponse,
  MembershipHistoryResponse,
  MembershipPlanResponse,
  MembershipResponse,
  MembershipStatus,
  PageResponse,
  PlanPriceHistoryResponse,
  UpdateBenefitRequest,
  UpdateMembershipPlanRequest,
} from '@/types';

export const membershipService = {
  // Plans
  getPlans: async (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<MembershipPlanResponse[]> => {
    // Backend returns ApiResponse<List<MembershipPlanResponse>> if no page/size, or ApiResponse<PageResponse>
    const response = await api.get<ApiResponse<MembershipPlanResponse[] | PageResponse<MembershipPlanResponse>>>(
      '/api/v1/membership-plans',
      { params }
    );
    const data = response.data.data;
    if (data && 'content' in data) {
      return (data as PageResponse<MembershipPlanResponse>).content;
    }
    return (data as MembershipPlanResponse[]) || [];
  },

  getPlanById: async (id: number): Promise<MembershipPlanResponse> => {
    const response = await api.get<ApiResponse<MembershipPlanResponse>>(`/api/v1/membership-plans/${id}`);
    return response.data.data;
  },

  createPlan: async (data: CreateMembershipPlanRequest): Promise<MembershipPlanResponse> => {
    const response = await api.post<ApiResponse<MembershipPlanResponse>>('/api/v1/membership-plans', data);
    return response.data.data;
  },

  updatePlan: async (id: number, data: UpdateMembershipPlanRequest): Promise<MembershipPlanResponse> => {
    const response = await api.put<ApiResponse<MembershipPlanResponse>>(`/api/v1/membership-plans/${id}`, data);
    return response.data.data;
  },

  deletePlan: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/membership-plans/${id}`);
  },

  getPlanBenefits: async (id: number): Promise<BenefitResponse[]> => {
    const response = await api.get<ApiResponse<BenefitResponse[]>>(`/api/v1/membership-plans/${id}/benefits`);
    return response.data.data;
  },

  addBenefitToPlan: async (planId: number, benefitId: number): Promise<void> => {
    await api.post(`/api/v1/membership-plans/${planId}/benefits/${benefitId}`);
  },

  removeBenefitFromPlan: async (planId: number, benefitId: number): Promise<void> => {
    await api.delete(`/api/v1/membership-plans/${planId}/benefits/${benefitId}`);
  },

  getPriceHistory: async (planId: number): Promise<PlanPriceHistoryResponse[]> => {
    const response = await api.get<ApiResponse<PlanPriceHistoryResponse[]>>(
      `/api/v1/membership-plans/${planId}/price-history`
    );
    return response.data.data;
  },

  // Benefits
  getBenefits: async (): Promise<BenefitResponse[]> => {
    const response = await api.get<ApiResponse<BenefitResponse[]>>('/api/v1/benefits');
    return response.data.data;
  },

  createBenefit: async (data: CreateBenefitRequest): Promise<BenefitResponse> => {
    const response = await api.post<ApiResponse<BenefitResponse>>('/api/v1/benefits', data);
    return response.data.data;
  },

  updateBenefit: async (id: number, data: UpdateBenefitRequest): Promise<BenefitResponse> => {
    const response = await api.put<ApiResponse<BenefitResponse>>(`/api/v1/benefits/${id}`, data);
    return response.data.data;
  },

  deleteBenefit: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/benefits/${id}`);
  },

  // Memberships
  getAll: async (params?: {
    page?: number;
    size?: number;
    status?: MembershipStatus;
    memberId?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<MembershipResponse>> => {
    const response = await api.get<ApiResponse<PageResponse<MembershipResponse>>>('/api/v1/memberships', {
      params,
    });
    return response.data.data;
  },

  getMy: async (): Promise<MembershipResponse[]> => {
    const response = await api.get<ApiResponse<MembershipResponse[]>>('/api/v1/memberships/my');
    return response.data.data;
  },

  getById: async (id: number): Promise<MembershipResponse> => {
    const response = await api.get<ApiResponse<MembershipResponse>>(`/api/v1/memberships/${id}`);
    return response.data.data;
  },

  subscribe: async (data: CreateMembershipRequest): Promise<MembershipResponse> => {
    const response = await api.post<ApiResponse<MembershipResponse>>('/api/v1/memberships', data);
    return response.data.data;
  },

  changePlan: async (id: number, data: ChangePlanRequest): Promise<MembershipResponse> => {
    const response = await api.put<ApiResponse<MembershipResponse>>(`/api/v1/memberships/${id}/change-plan`, data);
    return response.data.data;
  },

  cancel: async (id: number, data: CancelMembershipRequest): Promise<MembershipResponse> => {
    const response = await api.post<ApiResponse<MembershipResponse>>(`/api/v1/memberships/${id}/cancel`, data);
    return response.data.data;
  },

  freeze: async (id: number, data: FreezeMembershipRequest): Promise<MembershipResponse> => {
    const response = await api.post<ApiResponse<MembershipResponse>>(`/api/v1/memberships/${id}/freeze`, data);
    return response.data.data;
  },

  unfreeze: async (id: number): Promise<MembershipResponse> => {
    const response = await api.post<ApiResponse<MembershipResponse>>(`/api/v1/memberships/${id}/unfreeze`);
    return response.data.data;
  },

  getHistory: async (id: number): Promise<MembershipHistoryResponse[]> => {
    const response = await api.get<ApiResponse<MembershipHistoryResponse[]>>(`/api/v1/memberships/${id}/history`);
    return response.data.data;
  },

  getFreezes: async (id: number): Promise<MembershipFreezeResponse[]> => {
    const response = await api.get<ApiResponse<MembershipFreezeResponse[]>>(`/api/v1/memberships/${id}/freezes`);
    return response.data.data;
  },
};
