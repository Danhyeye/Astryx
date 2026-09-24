import {contractToday, parseContractDate, formatContractDate} from './contractDates.ts';
import type {Invoice} from '../types/contract';

export type PaymentSource = {
  id?: string;
  due_date: string;
  amount: number;
  invoices?: Invoice[] | null;
};

/** Invoice amounts are authoritative; legacy paid flags are deliberately ignored. */
export function derivePayment(payment: PaymentSource, today = contractToday()) {
  const invoices = payment.invoices ?? [];
  const totalCents = invoices.reduce((sum, invoice) => sum + Math.round(Number(invoice.amount) * 100), 0);
  const dueCents = Math.round(Number(payment.amount) * 100);
  const paid = totalCents >= dueCents && invoices.length > 0;
  return {
    ...payment, invoices,
    total_paid: totalCents / 100,
    remaining: Math.max(0, dueCents - totalCents) / 100,
    status: paid ? 'PAID' : totalCents > 0 ? 'PARTIALLY_PAID' : payment.due_date < today ? 'OVERDUE' : 'PENDING',
    paid_at: paid ? invoices.map(invoice => invoice.payment_date).sort().at(-1) ?? null : null,
  };
}

export function validateInvoice(input: {amount: number; remaining: number; paymentDate: string}, today = contractToday()): string | null {
  const {amount, remaining, paymentDate} = input;
  if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) {
    return 'Số tiền thanh toán phải lớn hơn 0 và có tối đa 2 chữ số thập phân.';
  }
  if (Math.round(amount * 100) > Math.round(remaining * 100)) return 'Số tiền thanh toán vượt quá số tiền còn lại.';
  const date = parseContractDate(paymentDate);
  if (!date || formatContractDate(date) !== paymentDate) return 'Vui lòng chọn ngày thanh toán hợp lệ.';
  if (paymentDate > today) return 'Ngày thanh toán không được ở tương lai.';
  return null;
}
