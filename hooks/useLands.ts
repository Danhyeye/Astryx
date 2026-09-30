
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { landsService } from "@/lib/api/fetchLand";
import type { CreateLandPayload, UpdateLandPayload } from '@/types/land';

export function useLandDetail(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["landDetail", id],
    queryFn: () => landsService.getLandDetails(id),
    enabled,
  });
}

export function useCreateLand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLandPayload) => landsService.createLand(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lands"] });
    },
  });
}

export function useUpdateLand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLandPayload }) =>
      landsService.updateLand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lands"] });
    },
  });
}

export function useDeleteLand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => landsService.deleteLand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lands"] });
    },
  });
}
