import type { ApiResponse } from "./api-response";

export type Customer = {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    created_at: string;
    updated_at: string;
};
       
export type CustomerFilters = {
  page?: number;
  pageSize?: number;
}

export type CreateCustomerPayload = {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

export type CustomerResponse = ApiResponse<Customer>;

export type CustomersResponse = ApiResponse<Customer[]>;
