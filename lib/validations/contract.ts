import { z } from "zod";

export const contractStatuses = ["ACTIVE", "COMPLETED", "CANCELLED"] as const;
export const paymentFrequencies = ["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"] as const;

const relationRef = z.object({ id: z.string().uuid() });

export const contractSchema = z.object({
  customer: relationRef,
  land: relationRef.nullable().optional(),
  plot: relationRef.nullable().optional(),
  deposit_amount: z.number().nonnegative(),
  rent_amount: z.number().nonnegative(),
  due_day: z.number().int().min(1).max(31),
  lease_duration_months: z.number().int().positive().nullable().optional(),
  payment_frequency: z.enum(paymentFrequencies).default("MONTHLY"),
  payment_due_day: z.number().int().min(1).max(31).nullable().optional(),
  next_payment_due_date: z.string().nullable().optional(),
  start_date: z.string(),
  end_date: z.string().nullable().optional(),
  status: z.enum(contractStatuses).default("ACTIVE"),
  notes: z.string().nullable().optional(),
});

export const contractUpdateSchema = contractSchema.partial();

export type ContractInput = z.infer<typeof contractSchema>;
export type ContractUpdateInput = z.infer<typeof contractUpdateSchema>;