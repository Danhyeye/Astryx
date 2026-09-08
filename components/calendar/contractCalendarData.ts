import type {Contract, PaymentFrequency} from '@/types/contract';
import {
  contractDateFromParts,
  formatContractDate,
  parseContractDate,
  resolveContractEndDate,
} from '../../lib/contractDates.ts';

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

function first<T>(items: readonly T[] | null | undefined): T | null {
  return items?.[0] ?? null;
}

function customerNameOf(contract: Contract): string {
  return first(contract.customers)?.name || 'Khách hàng chưa xác định';
}

function targetLabelOf(contract: Contract): string {
  const plot = first(contract.plots);
  const land = first(contract.lands) ?? first(plot?.lands);
  const landName = land?.name ?? 'Chưa có khu đất';

  if (plot?.plot_number) {
    return `${landName} / Lô đất ${plot.plot_number}`;
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
  const date = value instanceof Date ? value : parseContractDate(value);
  return date == null ? '' : formatContractDate(date);
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

/** One nearest unpaid date per active contract. Payment rows are authoritative when present. */
export function buildContractCalendarEvents(
  contracts: readonly Contract[],
  now: Date = new Date(),
): ContractCalendarEvent[] {
  // Business dates follow Vietnam, including around UTC midnight.
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const today = parseContractDate(todayKey)!;
  const events: ContractCalendarEvent[] = [];
  for (const contract of contracts) {
    const start = parseContractDate(contract.start_date);
    if (!start || contract.status !== 'ACTIVE') continue;
    const end = parseContractDate(
      resolveContractEndDate({
        startDate: contract.start_date,
        endDate: contract.end_date,
        leaseDurationMonths: contract.lease_duration_months,
      }),
    );
    const valid = (date: Date | null): date is Date => date != null && date >= today && date >= start && (end == null || date <= end);
    let due: Date | null = null;
    let amount = contract.rent_amount;
    if (contract.payments?.length) {
      const payment = [...contract.payments]
        .filter(payment => payment.status.toUpperCase() !== 'PAID' && !payment.paid_at && valid(parseContractDate(payment.due_date)))
        .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
      if (payment) {due = parseContractDate(payment.due_date); amount = payment.amount;}
    } else {
      const explicit = parseContractDate(contract.next_payment_due_date);
      if (valid(explicit)) due = explicit;
      else {
        const step = FREQUENCY_MONTH_STEP[contract.payment_frequency];
        const day = dueDayOf(contract);
        if (step != null && day >= 1 && day <= 31) {
          const months = Math.max(0, (today.getUTCFullYear() - start.getUTCFullYear()) * 12 + today.getUTCMonth() - start.getUTCMonth());
          const offset = Math.floor(months / step) * step;
          // At most the current anchored period and the next are needed.
          for (const monthOffset of [offset, offset + step]) {
            const candidate = contractDateFromParts(start.getUTCFullYear(), start.getUTCMonth() + monthOffset, day);
            if (valid(candidate)) {due = candidate; break;}
          }
        }
      }
    }
    if (due == null) continue;
    const date = formatContractDate(due);
    events.push({id: `${contract.id}:${date}`, contractId: contract.id,
      contractLabel: contractLabelOf(contract), customerName: customerNameOf(contract),
      targetLabel: targetLabelOf(contract), date, amount, frequency: contract.payment_frequency,
      status: contract.status, startDate: formatContractDate(start), endDate: end ? formatContractDate(end) : '',
    });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.contractLabel.localeCompare(b.contractLabel, 'vi'));
}

/** Full due-day schedule for the displayed month, including payment history. */
export function buildContractMonthEvents(
  contracts: readonly Contract[],
  month: string,
): ContractCalendarEvent[] {
  const monthStart = parseContractDate(month.slice(0, 7) + '-01');
  if (!monthStart) return [];
  const year = monthStart.getUTCFullYear();
  const monthIndex = monthStart.getUTCMonth();
  const monthEnd = contractDateFromParts(year, monthIndex, 31);
  const events: ContractCalendarEvent[] = [];
  for (const contract of contracts) {
    const start = parseContractDate(contract.start_date);
    if (!start || contract.status === 'CANCELLED') continue;
    const end = parseContractDate(resolveContractEndDate({
      startDate: contract.start_date, endDate: contract.end_date,
      leaseDurationMonths: contract.lease_duration_months,
    }));
    const valid = (date: Date | null): date is Date =>
      date != null && date >= start && (!end || date <= end) &&
      date >= monthStart && date <= monthEnd;
    const dates = new Map<string, number>();
    const step = FREQUENCY_MONTH_STEP[contract.payment_frequency];
    if (step) {
      const offset = (year - start.getUTCFullYear()) * 12 + monthIndex - start.getUTCMonth();
      const day = dueDayOf(contract);
      if (offset >= 0 && offset % step === 0 && Number.isInteger(day) && day >= 1 && day <= 31) {
        const due = contractDateFromParts(year, monthIndex, day);
        if (valid(due)) {
          const key = formatContractDate(due);
          const payment = contract.payments?.find(payment => payment.due_date === key);
          dates.set(key, payment?.amount ?? contract.rent_amount);
        }
      }
    } else if (contract.payment_frequency === 'CUSTOM') {
      for (const payment of contract.payments ?? []) {
        const due = parseContractDate(payment.due_date);
        if (valid(due)) dates.set(formatContractDate(due), payment.amount);
      }
      if (!contract.payments?.length) {
        const due = parseContractDate(contract.next_payment_due_date);
        if (valid(due)) dates.set(formatContractDate(due), contract.rent_amount);
      }
    }
    for (const [date, amount] of dates) {
      events.push({
        id: `${contract.id}:${date}`, contractId: contract.id,
        contractLabel: contractLabelOf(contract), customerName: customerNameOf(contract),
        targetLabel: targetLabelOf(contract), date, amount,
        frequency: contract.payment_frequency, status: contract.status,
        startDate: formatContractDate(start), endDate: end ? formatContractDate(end) : '',
      });
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.contractLabel.localeCompare(b.contractLabel, 'vi'));
}
