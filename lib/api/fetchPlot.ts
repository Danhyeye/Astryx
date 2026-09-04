import apiService, { RequestParams } from '@/lib/core';
import {
  CreatePlotPayload,
  PlotFilters,
  PlotResponse,
  PlotsResponse,
  UpdatePlotPayload,
} from '@/types/plot';

const convertPlotFilters = (filters?: PlotFilters): RequestParams => {
  if (!filters) return {};

  const params: RequestParams = {}; 
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;
    if (filters?.status) params.status = filters.status;
    return params;
}

export const plotsService = {
  getPlots: async (filters?: PlotFilters): Promise<PlotsResponse> => {
    const params = convertPlotFilters(filters);
    const response = await apiService.get<PlotsResponse>('/plots', params);
    return response.data;
  },

  getPlotDetails: async (plotId: string): Promise<PlotResponse> => {
    const response = await apiService.get<PlotResponse>(`/plots/${plotId}`);
    return response.data;
  },

  createPlot: async (plotData: CreatePlotPayload): Promise<PlotResponse> => {
    const response = await apiService.post<PlotResponse>('/plots', plotData);
    return response.data;
  },

  updatePlot: async (plotId: string, plotData: UpdatePlotPayload): Promise<PlotResponse> => {
    const response = await apiService.patch<PlotResponse>(`/plots/${plotId}`, plotData);
    return response.data;
  },

  deletePlot: async (plotId: string): Promise<PlotResponse> => {
    const response = await apiService.delete<PlotResponse>(`/plots/${plotId}`);
    return response.data;
  }
};
