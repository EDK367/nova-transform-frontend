import api from './api';
import { AuthResponse, LoginRequest, MeResponse } from '@/types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    // Backend returns AuthResponse directly (not wrapped in ApiResponse for login)
    const response = await api.post<AuthResponse>('/api/v1/auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<MeResponse> => {
    const response = await api.get<MeResponse>('/api/v1/auth/me');
    return response.data;
  },
};
