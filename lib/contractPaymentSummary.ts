import type {ContractPayment} from '../types/contract';
import {getPaymentBalance} from './invoices.ts';

export function getOverduePayments<T extends Pick<ContractPayment, 'due_date' | 'remaining'>>(payments: readonly T[], today: string): T[] {
  return payments.filter(payment => payment.due_date < today && payment.remaining > 0)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function getOverpaidPayments<T extends Pick<ContractPayment, 'due_date' | 'amount' | 'total_paid'>>(payments: readonly T[]) {
  return payments.map(payment => ({...payment, overpaid: getPaymentBalance(payment.amount, payment.total_paid).overpaid}))
    .filter(payment => payment.overpaid > 0)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}
