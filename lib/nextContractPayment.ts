import {contractDateFromParts, formatContractDate, parseContractDate, resolveContractEndDate} from './contractDates.ts';

type Payment = {due_date: string; status: string; paid_at: string | null};
export function nextContractPayment(input: {
  startDate: string; endDate?: string | null; leaseDurationMonths?: number | null;
  dueDay: number | null; paymentFrequency: string; payments?: readonly Payment[];
  nextPaymentDueDate?: string; status?: string;
}): string | null {
  if (input.status === 'CANCELLED' || input.status === 'COMPLETED') return null;
  const start = parseContractDate(input.startDate);
  if (!start) return null;
  const end = resolveContractEndDate({...input, endDate: input.endDate, leaseDurationMonths: input.leaseDurationMonths});
  const payments = input.payments ?? [];
  const paid = new Set(payments.filter(row => row.paid_at || row.status.toUpperCase() === 'PAID').map(row => row.due_date));
  const inTerm = (date: string) => date >= input.startDate && (!end || date <= end);
  const recorded = payments.filter(row => !paid.has(row.due_date) && inTerm(row.due_date)).map(row => row.due_date);
  const step = ({MONTHLY: 1, QUARTERLY: 3, YEARLY: 12} as Record<string, number>)[input.paymentFrequency];
  if (step && input.dueDay != null && Number.isInteger(input.dueDay) && input.dueDay >= 1 && input.dueDay <= 31) {
    // At most one candidate per paid record plus the initial partial period.
    for (let index = 0; index <= paid.size + 1; index++) {
      const candidate = formatContractDate(contractDateFromParts(start.getUTCFullYear(), start.getUTCMonth() + index * step, input.dueDay));
      if (end && candidate > end) break;
      if (inTerm(candidate) && !paid.has(candidate)) {recorded.push(candidate); break;}
    }
  } else if (input.paymentFrequency === 'CUSTOM' && input.nextPaymentDueDate && inTerm(input.nextPaymentDueDate) && !paid.has(input.nextPaymentDueDate)) {
    recorded.push(input.nextPaymentDueDate);
  }
  return recorded.sort()[0] ?? null;
}
