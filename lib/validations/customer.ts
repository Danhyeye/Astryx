import {isVietnamPhone, isValidEmail, normalizeVietnamPhone, PHONE_ERROR, EMAIL_ERROR} from '../../utils/contact.ts';
import { z } from "zod";

z.config(z.locales.vi());

export const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().trim().refine(value => value === '' || isVietnamPhone(value), PHONE_ERROR).transform(value => value === '' ? null : normalizeVietnamPhone(value)).nullable().optional(),
  email: z.string().trim().refine(value => value === '' || isValidEmail(value), EMAIL_ERROR).transform(value => value || null).nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const customerUpdateSchema = customerSchema.partial();

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;