import type { ApiResponse } from "./api-response";
import type { Customer } from "./customer";
import type { Land } from "./land";
import type { Plot } from "./plot";

export type ContractStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PaymentFrequency = "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";

export type Contract = {
  id: string;
  deposit_amount: number;
  rent_amount: number;
  due_day: number;
  lease_duration_months: number;
  payment_frequency: PaymentFrequency;
  payment_due_day: number;
  next_payment_due_date: string;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  customers: Customer[];
  lands: Land[];
  plots: Plot[];
};

export type ContractFilters = {
  page?: number;
  pageSize?: number;
  status?: ContractStatus;
};

export type CreateContractPayload = {
  customer: {
    id: string;
  };
  land?: {
    id: string;
  } | null;
  plot?: {
    id: string;
  } | null;
  deposit_amount: number;
  rent_amount: number;
  due_day: number;
  lease_duration_months?: number | null;
  payment_frequency: PaymentFrequency;
  payment_due_day?: number | null;
  next_payment_due_date?: string | null;
  start_date: string;
  end_date?: string | null;
  status: ContractStatus;
  notes?: string | null;
}

export type UpdateContractPayload = Partial<CreateContractPayload>;

export type ContractResponse = ApiResponse<Contract>;

export type ContractsResponse = ApiResponse<Contract[]>;
