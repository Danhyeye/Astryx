import type {ContractStatus, PaymentFrequency} from '../types/contract';

export type DatabaseContractStatus = Lowercase<ContractStatus>;
export type DatabasePaymentFrequency = Lowercase<PaymentFrequency>;
type ContractTargetInput = {
  land?: {id: string};
  plots?: {id: string}[];
};
export function contractStatusToDatabase(
  status: ContractStatus,
): DatabaseContractStatus {
  return status.toLowerCase() as DatabaseContractStatus;
}

export function contractStatusFromDatabase(value: string): ContractStatus {
  return value.toUpperCase() as ContractStatus;
}

export function paymentFrequencyToDatabase(
  frequency: PaymentFrequency,
): DatabasePaymentFrequency {
  return frequency.toLowerCase() as DatabasePaymentFrequency;
}

export function paymentFrequencyFromDatabase(
  value: string,
): PaymentFrequency {
  return value.toUpperCase() as PaymentFrequency;
}

export function contractTargetToDatabase({land, plots = []}: ContractTargetInput) {
  return {land_id: land?.id, plot_ids: plots.map(plot => plot.id), plot_id: null};
}

export function contractTargetPatchToDatabase({land, plots}: ContractTargetInput) {
  return {
    ...(land === undefined ? {} : {land_id: land.id}),
    ...(plots === undefined ? {} : {plot_ids: plots.map(plot => plot.id), plot_id: null}),
  };
}
