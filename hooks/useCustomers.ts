import {useMemo} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { customersService } from "@/lib/api/fetchCustomer";
import {
  CustomerFilters,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from '@/types/customer';

export function normalizeFilters(filters: CustomerFilters): CustomerFilters {
  const normalized: CustomerFilters = {};

  if (filters.page !== undefined) normalized.page = filters.page;
  if (filters.pageSize !== undefined) normalized.pageSize = filters.pageSize;
  return normalized;
}

export function useCustomers(filters: CustomerFilters, enabled: boolean = true) {
  const {page, pageSize} = filters;
  const normalizedFilters = useMemo(
    () => normalizeFilters({page, pageSize}),
    [page, pageSize],
  );
  
  return useQuery({
    queryKey: ["customers", normalizedFilters],
    queryFn: () => customersService.getCustomers(normalizedFilters),
    enabled,
  });
}

export function useCustomerDetail(customerId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["customerDetail", customerId],
    queryFn: () => customersService.getCustomerDetails(customerId),
    enabled,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerPayload) => customersService.createCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, data}: {id: string; data: UpdateCustomerPayload}) =>
      customersService.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customersService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
