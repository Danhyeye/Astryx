import {isValidISODate, resolveContractEndDate} from './contractDates.ts';
import {buildContractPaymentSchedule} from './contractPaymentSchedule.ts';
import type {Contract, ContractPayment} from '../types/contract';

export function validatePaymentPeriod({contract, payment, dueDate, amount}: {
  contract: Contract; payment: Pick<ContractPayment, 'id' | 'due_date' | 'amount'> & {total_paid?: number}; dueDate: string; amount: number;
}): string | null {
  if (!isValidISODate(dueDate)) return 'Vui lòng chọn ngày đến hạn hợp lệ.';
  const end = resolveContractEndDate({startDate: contract.start_date, endDate: contract.end_date, leaseDurationMonths: contract.lease_duration_months});
  if (dueDate !== payment.due_date && (dueDate < contract.start_date || (end && dueDate > end))) return 'Ngày đến hạn phải nằm trong thời hạn hợp đồng.';
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) return 'Số tiền phải lớn hơn 0, không vượt quá 999,999,999,999.99 VND và có tối đa 2 chữ số thập phân.';
  if (amount < Math.min(payment.amount, payment.total_paid ?? 0)) return 'Không thể giảm số tiền dưới mức đã ghi nhận.';
  if (dueDate !== payment.due_date && buildContractPaymentSchedule(contract, dueDate.slice(0, 7)).some(row => row.due_date === dueDate)) return 'Ngày đến hạn đã có kỳ thanh toán khác. Vui lòng chọn ngày khác.';
  return null;
}
