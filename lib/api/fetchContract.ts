import apiService, { RequestParams } from '@/lib/core';
import {
  ContractFilters,
  ContractResponse,
  ContractsResponse,
  CreateContractPayload,
  UpdateContractPayload,
} from '@/types/contract';

const convertContractFilters = (filters?: ContractFilters): RequestParams => {
  if (!filters) return {};

  const params: RequestParams = {}; 
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;
    if (filters?.status) params.status = filters.status;
    return params;
}

export const contractsService = {
  getContracts: async (filters?: ContractFilters): Promise<ContractsResponse> => {
    const params = convertContractFilters(filters);
    const response = await apiService.get<ContractsResponse>('/contracts', params);
    return response.data;
  },

  getContractDetails: async (contractId: string): Promise<ContractResponse> => {
    const response = await apiService.get<ContractResponse>(`/contracts/${contractId}`);
    return response.data;
  },

  createContract: async (contractData: CreateContractPayload): Promise<ContractResponse> => {
    const response = await apiService.post<ContractResponse>('/contracts', contractData);
    return response.data;
  },

  updateContract: async (contractId: string, contractData: UpdateContractPayload): Promise<ContractResponse> => {
    const response = await apiService.patch<ContractResponse>(`/contracts/${contractId}`, contractData);
    return response.data;
  },
};
