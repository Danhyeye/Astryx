export function seedInvoiceRows(payments, schedules) {
  const alreadyPaid = new Set(schedules.filter(row => row.invoices.length > 0).map(row => row.id));
  const vietnamDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return payments.filter(row => row.status === 'paid' && row.paid_at && row.amount > 0 && !alreadyPaid.has(row.id))
    .map(row => ({id: row.id, payment_schedule_id: row.id,
      payment_date: vietnamDate.format(new Date(row.paid_at)), amount: row.amount, created_at: row.paid_at}));
}
