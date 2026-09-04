import {useMemo} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import { landsService } from "@/lib/api/fetchLand";
import type {CreateLandPayload, LandFilters, UpdateLandPayload} from '@/types/land';

export function normalizeFilters(filters: LandFilters): LandFilters {
  const normalized: LandFilters = {};

  if (filters.page !== undefined) normalized.page = filters.page;
  if (filters.pageSize !== undefined) normalized.pageSize = filters.pageSize;
  return normalized;
}

export function useLands(filters: LandFilters, enabled: boolean = true) {
  const {page, pageSize} = filters;
  const normalizedFilters = useMemo(
    () => normalizeFilters({page, pageSize}),
    [page, pageSize],
  );
  
  return useQuery({
    queryKey: ["lands", normalizedFilters],
    queryFn: () => landsService.getLands(normalizedFilters),
    enabled,
  });
}

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
