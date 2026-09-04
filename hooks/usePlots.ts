import {useMemo} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { plotsService } from "@/lib/api/fetchPlot";
import { PlotFilters, CreatePlotPayload, UpdatePlotPayload } from "@/types/plot";

export function normalizeFilters(filters: PlotFilters): PlotFilters {
  const normalized: PlotFilters = {};
  if (filters.page !== undefined) normalized.page = filters.page;
  if (filters.pageSize !== undefined) normalized.pageSize = filters.pageSize;
  if (filters.status !== undefined) normalized.status = filters.status;
  return normalized;
}

export function usePlots(filters: PlotFilters, enabled: boolean = true) {
  const {page, pageSize, status} = filters;
  const normalizedFilters = useMemo(
    () => normalizeFilters({page, pageSize, status}),
    [page, pageSize, status],
  );
  
  return useQuery({
    queryKey: ["plots", normalizedFilters],
    queryFn: () => plotsService.getPlots(normalizedFilters),
    enabled,
  });
}

export function usePlotDetail(plotId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["plotDetail", plotId],
    queryFn: () => plotsService.getPlotDetails(plotId),
    enabled,
  });
}

export function useCreatePlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (plotData: CreatePlotPayload) => plotsService.createPlot(plotData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plots"] });
    },
  });
}

export function useUpdatePlot() {
  const queryClient = useQueryClient();

  return useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdatePlotPayload }) =>
        plotsService.updatePlot(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["plots"] });
      },
    });
}

export function useDeletePlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => plotsService.deletePlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plots"] });
    },
  });
}
