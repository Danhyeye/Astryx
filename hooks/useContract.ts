
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsService } from "@/lib/api/fetchContract";
import type { CreateContractPayload, UpdateContractPayload } from "@/types/contract";

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
      queryClient.invalidateQueries({ queryKey: ["contractAvailability"] });
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      queryClient.invalidateQueries({ queryKey: ["contractDetail"] });
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
      queryClient.invalidateQueries({ queryKey: ["contractAvailability"] });
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      queryClient.invalidateQueries({ queryKey: ["contractDetail"] });
    },
  });
}
