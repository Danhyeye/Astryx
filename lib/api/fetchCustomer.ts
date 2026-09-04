import apiService, { RequestParams } from '@/lib/core';
import {
  CreateCustomerPayload,
  CustomerFilters,
  CustomerResponse,
  CustomersResponse,
  UpdateCustomerPayload,
} from '@/types/customer';

const convertCustomerFilters = (filters?: CustomerFilters): RequestParams => {
  if (!filters) return {};

  const params: RequestParams = {}; 
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;
    return params;
}

export const customersService = {
  getCustomers: async (filters?: CustomerFilters): Promise<CustomersResponse> => {
    const params = convertCustomerFilters(filters);
    const response = await apiService.get<CustomersResponse>('/customers', params);
    return response.data;
  },

  getCustomerDetails: async (customerId: string): Promise<CustomerResponse> => {
    const response = await apiService.get<CustomerResponse>(`/customers/${customerId}`);
    return response.data;
  },

  createCustomer: async (customerData: CreateCustomerPayload): Promise<CustomerResponse> => {
    const response = await apiService.post<CustomerResponse>('/customers', customerData);
    return response.data;
  },
  
  updateCustomer: async (customerId: string, customerData: UpdateCustomerPayload): Promise<CustomerResponse> => {
    const response = await apiService.patch<CustomerResponse>(`/customers/${customerId}`, customerData);
    return response.data;
  },

  deleteCustomer: async (customerId: string): Promise<CustomerResponse> => {
    const response = await apiService.delete<CustomerResponse>(`/customers/${customerId}`);
    return response.data;
  }
};
