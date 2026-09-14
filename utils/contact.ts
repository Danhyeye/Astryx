import {z} from 'zod';

export const PHONE_ERROR = 'Nhập số điện thoại Việt Nam hợp lệ, ví dụ 0912345678 hoặc +84912345678.';
export const EMAIL_ERROR = 'Nhập email hợp lệ, ví dụ ten@example.com.';

/** Accept domestic or +84 numbers, including common display separators. */
export function normalizeVietnamPhone(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, '');
  return compact.startsWith('+84') ? '0' + compact.slice(3) : compact;
}

export function isVietnamPhone(value: string): boolean {
  const phone = normalizeVietnamPhone(value);
  return /^(?:0[35789]\d{8}|02\d{9})$/.test(phone);
}

const emailSchema = z.string().email();
export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value.trim()).success;
}
