export function customerContactConflict(error: {code?: string; message?: string}): string | null {
  if (error.code !== '23505') return null;
  if (error.message?.includes('customers_phone_unique')) return 'Số điện thoại này đã tồn tại trong cơ sở dữ liệu.';
  if (error.message?.includes('customers_email_unique')) return 'Email này đã tồn tại trong cơ sở dữ liệu.';
  return 'Thông tin khách hàng này đã tồn tại trong cơ sở dữ liệu.';
}
