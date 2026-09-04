import apiService, { RequestParams } from '@/lib/core';
import {
  LandFilters,
  LandsResponse,
  LandResponse,
  CreateLandPayload,
  UpdateLandPayload,
} from '@/types/land';

const convertLandFilters = (filters?: LandFilters): RequestParams => {
  if (!filters) return {};

  const params: RequestParams = {}; 
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;
    return params;
}

export const landsService = {
  getLands: async (filters?: LandFilters): Promise<LandsResponse> => {
    const params = convertLandFilters(filters);
    const response = await apiService.get<LandsResponse>('/lands', params);
    return response.data;
  },

  getLandDetails: async (id: string): Promise<LandResponse> => {
    const response = await apiService.get<LandResponse>(`/lands/${id}`);
    return response.data;
  },

  createLand: async (data: CreateLandPayload): Promise<LandResponse> => {
    const response = await apiService.post<LandResponse>('/lands', data);
    return response.data;
  },

  updateLand: async (id: string, data: UpdateLandPayload): Promise<LandResponse> => {
    const response = await apiService.patch<LandResponse>(`/lands/${id}`, data);
    return response.data;
  },

  deleteLand: async (id: string): Promise<LandResponse> => {
    const response = await apiService.delete<LandResponse>(`/lands/${id}`);
    return response.data;
  }
};
