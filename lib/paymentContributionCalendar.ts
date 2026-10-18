import {formatContractDate} from './contractDates.ts';
import type {ContractPayment} from '../types/contract';

export type PaymentDayState = 'paid' | 'upcoming' | 'overdue';
export type ContributionDay = {date: string; state: PaymentDayState | 'past' | 'future' | 'outside'; payment?: ContractPayment};

export function paymentDayState(payment: Pick<ContractPayment, 'status' | 'due_date' | 'remaining'>, today: string): PaymentDayState {
  if (payment.status === 'PAID') return 'paid';
  return payment.due_date < today && payment.remaining > 0 ? 'overdue' : 'upcoming';
}

/** Monday-first weeks, padded only at the edges of the selected calendar year. */
export function buildPaymentContributionYear(payments: readonly ContractPayment[], year: number, today: string, startDate: string, endDate: string | null): (ContributionDay | null)[][] {
  const byDate = new Map(payments.map(payment => [payment.due_date, payment]));
  const cells: (ContributionDay | null)[] = [];
  const first = new Date(Date.UTC(year, 0, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  for (let i = 0; i < offset; i++) cells.push(null);
  for (const day = new Date(first); day.getUTCFullYear() === year; day.setUTCDate(day.getUTCDate() + 1)) {
    const date = formatContractDate(day);
    const payment = byDate.get(date);
    const state = payment ? paymentDayState(payment, today)
      : date < startDate || (endDate && date > endDate) ? 'outside'
      : date < today ? 'past' : 'future';
    cells.push({date, state, ...(payment ? {payment} : {})});
  }
  while (cells.length % 7) cells.push(null);
  return Array.from({length: cells.length / 7}, (_, index) => cells.slice(index * 7, index * 7 + 7));
}
