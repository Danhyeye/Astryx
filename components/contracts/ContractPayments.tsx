'use client';

import {useMemo, useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import {buildContractPaymentSchedule} from '@/lib/contractPaymentSchedule';
import {contractToday, resolveContractEndDate} from '@/lib/contractDates';
import {PayInvoiceDialog} from './PayInvoiceDialog';
import {PaymentInvoicesDrawer} from './PaymentInvoicesDrawer';
import {PaymentContributionCalendar} from './PaymentContributionCalendar';
import {PaymentBalanceNotes} from './PaymentBalanceNotes';
import type {Contract, Invoice} from '@/types/contract';
import {formatDate, formatMoney} from '@/utils/format';

export function ContractPayments({contract}: {contract: Contract}) {
  const [futureYears, setFutureYears] = useState(1);
  const [selected, setSelected] = useState<{date: string; view: 'pay' | 'invoices'} | null>(null);
  const [recorded, setRecorded] = useState<{invoice: Invoice; date: string} | null>(null);
  const [updatedDate, setUpdatedDate] = useState<string | null>(null);
  const today = contractToday();
  const todayYear = Number(today.slice(0, 4));
  const baseYear = Math.max(todayYear, Number(contract.start_date.slice(0, 4)));
  const throughMonth = `${baseYear + futureYears}-12`;
  const end = resolveContractEndDate({startDate: contract.start_date, endDate: contract.end_date, leaseDurationMonths: contract.lease_duration_months});
  const rows = useMemo(() => buildContractPaymentSchedule(contract, throughMonth, today), [contract, throughMonth, today]);
  const firstYear = Math.min(Number(contract.start_date.slice(0, 4)), Number((rows[0]?.due_date ?? contract.start_date).slice(0, 4)));
  const lastYear = Math.max(firstYear, Number((end ?? `${baseYear + futureYears}-12-31`).slice(0, 4)), Number((rows.at(-1)?.due_date ?? contract.start_date).slice(0, 4)));
  const totalPaid = rows.reduce((sum, row) => sum + row.total_paid, 0);
  const remaining = rows.reduce((sum, row) => sum + row.remaining, 0);
  const upcoming = rows.find(row => row.due_date >= today && row.remaining > 0);
  const selectedPayment = selected ? rows.find(row => row.due_date === selected.date) : undefined;
  return <VStack gap={4} className="min-w-0 w-full">
    <Heading level={2}>Lịch thanh toán</Heading>
    {updatedDate && <Banner key={`updated-${updatedDate}`} status="success" title="Đã cập nhật kỳ thanh toán" description={`Ngày đến hạn ${formatDate(updatedDate, true)}`} isDismissable dismissLabel="Đóng thông báo" onDismiss={() => setUpdatedDate(null)} />}
    <PaymentBalanceNotes payments={rows} today={today} onSelect={payment => setSelected({date: payment.due_date, view: 'invoices'})} />
    {recorded && <Banner key={`recorded-${recorded.invoice.id}`} status="success" title="Đã ghi nhận thanh toán"
      // description={`${formatMoney(recorded.invoice.amount)} · Ngày nhận ${formatDate(recorded.invoice.payment_date, true)} · Kỳ đến hạn ${formatDate(recorded.date, true)}`}
      isDismissable dismissLabel="Đóng thông báo" onDismiss={() => setRecorded(null)}
      endContent={<Button label="Xem hóa đơn" onClick={() => setSelected({date: recorded.date, view: 'invoices'})} />} />}
    {rows.length === 0 && <Text color="secondary">Chưa có ngày đến hạn. Với lịch tùy chỉnh, hãy đặt ngày thanh toán tiếp theo trong hợp đồng.</Text>}
    <VStack gap={1}>
      <Heading level={3}>{firstYear === lastYear ? `Năm ${firstYear}` : `${firstYear} – ${lastYear}`}</Heading>
      <Text color="secondary">{rows.length} kỳ · Đã nhận {formatMoney(totalPaid)} · Còn {formatMoney(remaining)}</Text>
    </VStack>
    <PaymentContributionCalendar payments={rows} firstYear={firstYear} lastYear={lastYear} today={today} startDate={contract.start_date} endDate={end}
      selectedDate={selected?.date} onSelect={payment => setSelected({date: payment.due_date, view: 'invoices'})} />
    <HStack gap={2} wrap="wrap">
      {upcoming && <Button label={`Kỳ tiếp theo · ${formatDate(upcoming.due_date, true)}`} variant="secondary" type="button"
        onClick={() => setSelected({date: upcoming.due_date, view: 'invoices'})} />}
      {!end && contract.status !== 'CANCELLED' && contract.payment_frequency !== 'CUSTOM' && <Button label="Xem thêm 12 tháng" variant="ghost" type="button"
        onClick={() => setFutureYears(years => years + 1)} />}
    </HStack>
    {selectedPayment && selected?.view === 'pay' && <PayInvoiceDialog key={`pay-${selected.date}`} contract={contract} payment={selectedPayment} onRecorded={invoice => {setRecorded({invoice, date: selected.date}); setSelected({date: selected.date, view: 'invoices'});}} onClose={() => setSelected({date: selected.date, view: 'invoices'})} />}
    {selectedPayment && selected?.view === 'invoices' && <PaymentInvoicesDrawer key={`invoices-${selected.date}`} contract={contract} payment={selectedPayment} onClose={() => setSelected(null)} onRecordPayment={() => setSelected({date: selected.date, view: 'pay'})} onUpdated={date => {setUpdatedDate(date); setSelected({date, view: 'invoices'});}} />}
  </VStack>;
}
