import { toPage } from './page-adapter';
import api from './api';
import {
  ApiResponse,
  CreatePhysicalMeasurementRequest,
  PageResponse,
  PhysicalMeasurementResponse,
  UpdatePhysicalMeasurementRequest,
} from '@/types';

export const physicalMeasurementService = {
  getAll: async (params?: {
    page?: number;
    size?: number;
    memberId?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PageResponse<PhysicalMeasurementResponse>> => {
    type ApiMeasurement = Omit<
      PhysicalMeasurementResponse,
      'measurementDate'
    > & {
      date: string;
      weight?: number;
      height?: number;
      muscleMass?: number;
      waist?: number;
      arm?: number;
      leg?: number;
      observations?: string;
    };

    const response = await api.get<
      ApiResponse<ApiMeasurement[]>
    >('/api/v1/physical-measurements', {
      params: {
        memberId: params?.memberId,
      },
    });

    const measurements = response.data.data.map((item) => ({
      ...item,
      measurementDate: item.date,
      weightKg: item.weight,
      heightCm:
        item.height == null
          ? undefined
          : item.height * 100,
      muscleMassKg: item.muscleMass,
      waistCm: item.waist,
      armCm: item.arm,
      thighCm: item.leg,
      notes: item.observations,
    }));

    return toPage(measurements, params);
  },

  getById: async (
    id: number
  ): Promise<PhysicalMeasurementResponse> => {
    const response = await api.get<
      ApiResponse<PhysicalMeasurementResponse>
    >(`/api/v1/physical-measurements/${id}`);

    return response.data.data;
  },

  create: async (
    data: CreatePhysicalMeasurementRequest
  ): Promise<PhysicalMeasurementResponse> => {
    const response = await api.post<
      ApiResponse<PhysicalMeasurementResponse>
    >('/api/v1/physical-measurements', data);

    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdatePhysicalMeasurementRequest
  ): Promise<PhysicalMeasurementResponse> => {
    const response = await api.put<
      ApiResponse<PhysicalMeasurementResponse>
    >(`/api/v1/physical-measurements/${id}`, data);

    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/physical-measurements/${id}`);
  },
};
