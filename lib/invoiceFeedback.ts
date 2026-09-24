export function invoiceErrorMessage(error: unknown): string {
  const value = error && typeof error === 'object' ? error as {code?: string; message?: string} : {};
  if (value.code === '42501') return 'Bạn chưa có quyền ghi nhận thanh toán. Kiểm tra tài khoản hoặc liên hệ người quản lý.';
  if (value.code === 'P0002') return 'Không tìm thấy hợp đồng hoặc kỳ thanh toán. Đóng biểu mẫu và tải lại hợp đồng.';
  if (value.code === '22023') {
    if (value.message?.includes('vượt quá')) return 'Số tiền vượt quá số tiền còn lại. Kiểm tra số dư đã cập nhật và nhập lại số tiền thực nhận.';
    if (value.message?.includes('tương lai')) return 'Ngày nhận tiền không được ở tương lai. Chọn hôm nay hoặc ngày đã nhận tiền trước đó.';
    return 'Thông tin không còn phù hợp với kỳ thanh toán. Kiểm tra ngày, số tiền và lịch sử hóa đơn trước khi thử lại.';
  }
  return 'Chưa xác nhận được khoản tiền đã lưu. Kiểm tra kết nối rồi thử lại với cùng thông tin; yêu cầu này được bảo vệ khỏi ghi nhận trùng. Nếu đóng biểu mẫu, hãy kiểm tra lịch sử hóa đơn trước khi tạo khoản mới.';
}
