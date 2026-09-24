import {derivePayment, type PaymentSource} from './invoices.ts';
import type {Contract} from '../types/contract';
import {buildContractMonthEvents} from '../components/calendar/contractCalendarData.ts';
import {resolveContractEndDate} from './contractDates.ts';

export function buildContractPaymentSchedule(contract: Contract, throughMonth: string) {
  const end = resolveContractEndDate({startDate: contract.start_date, endDate: contract.end_date, leaseDurationMonths: contract.lease_duration_months});
  const lastMonth = (end || throughMonth).slice(0, 7);
  const rows = new Map<string, PaymentSource>();
  const [year, month] = contract.start_date.slice(0, 7).split('-').map(Number);
  const [lastYear, last] = lastMonth.split('-').map(Number);
  for (let index = year * 12 + month - 1; index <= lastYear * 12 + last - 1; index++) {
    const key = `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`;
    for (const event of buildContractMonthEvents([contract], key)) {
      rows.set(event.date, {due_date: event.date, amount: event.amount, invoices: []});
    }
  }
  if (contract.payment_frequency === 'CUSTOM' && contract.status !== 'CANCELLED') {
    const due = contract.next_payment_due_date;
    if (due && due >= contract.start_date && (!end || due <= end)) {
      rows.set(due, {due_date: due, amount: contract.rent_amount, invoices: []});
    }
  }
  // Retain recorded payments even if the contract's dates or frequency changed.
  for (const payment of contract.payments ?? []) rows.set(payment.due_date, payment);
  return [...rows.values()].map(payment => derivePayment(payment)).sort((a, b) => a.due_date.localeCompare(b.due_date));
}
