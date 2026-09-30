
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { plotsService } from "@/lib/api/fetchPlot";
import { CreatePlotPayload, UpdatePlotPayload } from "@/types/plot";

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
