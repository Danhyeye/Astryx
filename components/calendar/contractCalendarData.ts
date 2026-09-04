import type {Contract, PaymentFrequency} from '@/types/contract';

export type ContractCalendarEvent = {
  id: string;
  contractId: string;
  contractLabel: string;
  customerName: string;
  targetLabel: string;
  date: string;
  amount: number;
  frequency: PaymentFrequency;
  status: Contract['status'];
  startDate: string;
  endDate: string;
};

export type ContractOption = {
  label: string;
  value: string;
};

const FREQUENCY_MONTH_STEP: Partial<Record<PaymentFrequency, number>> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  YEARLY: 12,
};

const DAY_MS = 86_400_000;

function parseUtcDate(value: string | null | undefined): Date | null {
  if (value == null || value === '') {
    return null;
  }

  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function dateFromParts(
  year: number,
  monthIndex: number,
  day: number,
): Date {
  const clampedDay = Math.min(day, daysInUtcMonth(year, monthIndex));
  return new Date(Date.UTC(year, monthIndex, clampedDay));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function addUtcMonths(date: Date, months: number): Date {
  return dateFromParts(
    date.getUTCFullYear(),
    date.getUTCMonth() + months,
    date.getUTCDate(),
  );
}

function resolveContractEndDate(contract: Contract, startDate: Date): Date | null {
  const endDate = parseUtcDate(contract.end_date);

  if (endDate != null) {
    return endDate;
  }

  if (contract.lease_duration_months > 0) {
    return addUtcDays(addUtcMonths(startDate, contract.lease_duration_months), -1);
  }

  return null;
}

function first<T>(items: readonly T[] | null | undefined): T | null {
  return items?.[0] ?? null;
}

function customerNameOf(contract: Contract): string {
  return first(contract.customers)?.name || 'Unknown customer';
}

function targetLabelOf(contract: Contract): string {
  const plot = first(contract.plots);
  const land = first(contract.lands) ?? first(plot?.lands);
  const landName = land?.name ?? 'No land';

  if (plot?.plot_number) {
    return `${landName} / Plot ${plot.plot_number}`;
  }

  return landName;
}

function contractLabelOf(contract: Contract): string {
  return `${customerNameOf(contract)} - ${targetLabelOf(contract)}`;
}

function dueDayOf(contract: Contract): number {
  return contract.due_day > 0
    ? contract.due_day
    : contract.payment_due_day;
}

export function eventDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : parseUtcDate(value);
  return date == null ? '' : toIsoDate(date);
}

export function buildContractOptions(
  contracts: readonly Contract[],
): ContractOption[] {
  return contracts
    .map(contract => ({
      label: contractLabelOf(contract),
      value: contract.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, {
      sensitivity: 'base',
    }));
}

export function buildContractCalendarEvents(
  contracts: readonly Contract[],
): ContractCalendarEvent[] {
  const events: ContractCalendarEvent[] = [];

  for (const contract of contracts) {
    const startDate = parseUtcDate(contract.start_date);
    const endDate =
      startDate == null ? null : resolveContractEndDate(contract, startDate);
    const monthStep = FREQUENCY_MONTH_STEP[contract.payment_frequency];

    if (startDate == null || endDate == null || monthStep == null) {
      continue;
    }

    const dueDay = dueDayOf(contract);
    const contractLabel = contractLabelOf(contract);
    const customerName = customerNameOf(contract);
    const targetLabel = targetLabelOf(contract);

    for (let monthOffset = 0; ; monthOffset += monthStep) {
      const dueDate = dateFromParts(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth() + monthOffset,
        dueDay,
      );

      if (dueDate > endDate) {
        break;
      }

      if (dueDate >= startDate) {
        const date = toIsoDate(dueDate);

        events.push({
          id: `${contract.id}:${date}`,
          contractId: contract.id,
          contractLabel,
          customerName,
          targetLabel,
          date,
          amount: contract.rent_amount,
          frequency: contract.payment_frequency,
          status: contract.status,
          startDate: toIsoDate(startDate),
          endDate: toIsoDate(endDate),
        });
      }
    }
  }

  return events.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return a.contractLabel.localeCompare(b.contractLabel, undefined, {
      sensitivity: 'base',
    });
  });
}
