import {isVietnamPhone, isValidEmail, normalizeVietnamPhone, PHONE_ERROR, EMAIL_ERROR} from '../../utils/contact.ts';
import { z } from "zod";

z.config(z.locales.vi());

export const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string({error: 'Vui lòng nhập số điện thoại.'}).trim().min(1, 'Vui lòng nhập số điện thoại.')
    .refine(value => value === '' || isVietnamPhone(value), PHONE_ERROR).transform(normalizeVietnamPhone),
  email: z.string().trim().refine(value => value === '' || isValidEmail(value), EMAIL_ERROR).transform(value => value.toLowerCase() || null).nullable().optional(),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const customerUpdateSchema = customerSchema.partial();

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
