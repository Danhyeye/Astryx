import {useMemo} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { contractsService } from "@/lib/api/fetchContract";
import type {
  ContractFilters,
  CreateContractPayload,
  UpdateContractPayload,
} from "@/types/contract";

export function normalizeFilters(filters: ContractFilters): ContractFilters {
  const normalized: ContractFilters = {};

  if (filters.page !== undefined) normalized.page = filters.page;
  if (filters.pageSize !== undefined) normalized.pageSize = filters.pageSize;
  if (filters.status !== undefined) normalized.status = filters.status;
  return normalized;
}

export function useContracts(filters: ContractFilters, enabled: boolean = true) {
  const {page, pageSize, status} = filters;
  const normalizedFilters = useMemo(
    () => normalizeFilters({page, pageSize, status}),
    [page, pageSize, status],
  );
  
  return useQuery({
    queryKey: ["contracts", normalizedFilters],
    queryFn: () => contractsService.getContracts(normalizedFilters),
    enabled,
  });
}

export function useContractDetail(contractId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["contractDetail", contractId],
    queryFn: () => contractsService.getContractDetails(contractId),
    enabled,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateContractPayload) => contractsService.createContract(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, data}: {id: string; data: UpdateContractPayload}) =>
      contractsService.updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
}
