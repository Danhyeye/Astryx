import type {ContractStatus, PaymentFrequency} from '../types/contract';

export type DatabaseContractStatus = Lowercase<ContractStatus>;
export type DatabasePaymentFrequency = Lowercase<PaymentFrequency>;
type ContractRelationRef = {id: string} | null | undefined;
type ContractTargetInput = {
  land?: ContractRelationRef;
  plot?: ContractRelationRef;
};
type ContractTargetDatabaseValues = {
  land_id: string | null;
  plot_id: string | null;
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

export function contractTargetToDatabase({
  land,
  plot,
}: ContractTargetInput): ContractTargetDatabaseValues {
  if (plot != null) {
    return {
      land_id: null,
      plot_id: plot.id,
    };
  }

  return {
    land_id: land?.id ?? null,
    plot_id: null,
  };
}

export function contractTargetPatchToDatabase({
  land,
  plot,
}: ContractTargetInput): Partial<ContractTargetDatabaseValues> {
  if (plot !== undefined) {
    return {
      land_id: null,
      plot_id: plot?.id ?? null,
    };
  }

  if (land !== undefined) {
    return {
      land_id: land?.id ?? null,
      plot_id: null,
    };
  }

  return {};
}
