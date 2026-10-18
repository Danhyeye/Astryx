import {rentYearLimit, validRentYears} from '../contractRent.ts';
import {PAYMENT_FREQUENCIES as paymentFrequencies} from '../paymentFrequency.ts';
import {z} from 'zod';
import {
  isValidISODate,
  isPendingStartDateValid,
  resolveContractEndDate,
} from '../contractDates.ts';

z.config(z.locales.vi());

export const contractStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export {PAYMENT_FREQUENCIES as paymentFrequencies} from '../paymentFrequency.ts';

const relationRef = z.object({id: z.string().uuid()});
const isoDate = z.string().refine(isValidISODate, {
  message: 'Ngày phải có định dạng YYYY-MM-DD và tồn tại trên lịch.',
});
const optionalISODate = isoDate.nullable().optional();

const paymentFrequencySchema = z.enum(paymentFrequencies);
const contractStatusSchema = z.enum(contractStatuses);
const contractShape = {
  customer: relationRef,
  land: relationRef,
  plots: z.array(relationRef).refine(plots => new Set(plots.map(plot => plot.id)).size === plots.length, {message: 'Không được chọn trùng lô đất.'}),
  deposit_amount: z.number().nonnegative(),
  rent_amount: z.number().nonnegative(),
  annual_rent_increase_percent: z.number().nonnegative().optional(),
  rent_year_basis: z.enum(['calendar', 'anniversary']).optional(),
  rent_years: z.array(z.object({year: z.number().int().min(1).max(9999), increase_percent: z.number().nonnegative()}).strict())
    .refine(validRentYears, {message: 'Mỗi năm chỉ được thiết lập một lần.'}).optional(),
  due_day: z.number().int().min(1).max(31),
  lease_duration_months: z.number().int().positive().nullable().optional(),
  payment_frequency: paymentFrequencySchema,
  payment_due_day: z.number().int().min(1).max(31).nullable().optional(),
  next_payment_due_date: optionalISODate,
  start_date: isoDate,
  end_date: optionalISODate,
  status: contractStatusSchema,
  notes: z.string().nullable().optional(),
};
const contractBaseSchema = z.object({
  ...contractShape,
  plots: contractShape.plots.default([]),
  payment_frequency: paymentFrequencySchema.default('MONTHLY'),
  status: contractStatusSchema.default('ACTIVE'),
}).strict();

function contractSchemaWithContext({
  allowCustomWithoutNextDue,
}: {
  allowCustomWithoutNextDue: boolean;
}) {
  return contractBaseSchema.superRefine((contract, context) => {
    const {start_date: startDate, end_date: endDate} = contract;
    if (!isPendingStartDateValid(contract.status, startDate)) {
      context.addIssue({code: 'custom', path: ['start_date'], message: 'Hợp đồng chờ hiệu lực phải có ngày bắt đầu sau hôm nay (giờ Việt Nam).'});
    }
    const nextDate = contract.next_payment_due_date;
    const effectiveEndDate = resolveContractEndDate({
      startDate,
      endDate,
      leaseDurationMonths: contract.lease_duration_months,
    });

    if (!validRentYears(contract.rent_years ?? [], rentYearLimit(startDate, effectiveEndDate, contract.rent_year_basis))) {
      context.addIssue({code: 'custom', path: ['rent_years'], message: 'Khoảng năm áp dụng không được vượt quá thời hạn hợp đồng.'});
    }

    if (endDate != null && endDate < startDate) {
      context.addIssue({
        code: 'custom',
        path: ['end_date'],
        message: 'Ngày kết thúc không được trước ngày bắt đầu.',
      });
    }

    if (
      nextDate != null &&
      (nextDate < startDate ||
        (effectiveEndDate != null && nextDate > effectiveEndDate))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['next_payment_due_date'],
        message: 'Ngày thanh toán tiếp theo phải nằm trong thời hạn hợp đồng.',
      });
    }

    if (
      contract.payment_frequency === 'CUSTOM' &&
      nextDate == null &&
      !allowCustomWithoutNextDue
    ) {
      context.addIssue({
        code: 'custom',
        path: ['next_payment_due_date'],
        message: 'Hợp đồng có chu kỳ tùy chỉnh cần ngày thanh toán tiếp theo.',
      });
    }
  });
}

export const contractSchema = contractSchemaWithContext({
  allowCustomWithoutNextDue: false,
});

export const contractUpdateSchema = z.object(contractShape).partial().strict();

export type ContractInput = z.infer<typeof contractBaseSchema>;
export type ContractUpdateInput = z.infer<typeof contractUpdateSchema>;

export function validateContractUpdate(
  existing: ContractInput,
  update: ContractUpdateInput,
  {hasPersistedPayments}: {hasPersistedPayments: boolean},
) {
  return contractSchemaWithContext({
    allowCustomWithoutNextDue: hasPersistedPayments,
  }).safeParse({...existing, ...update});
}
