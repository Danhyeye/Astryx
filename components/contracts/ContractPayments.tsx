'use client';

import {useMemo, useState} from 'react';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {List, ListItem} from '@astryxdesign/core/List';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Pagination} from '@astryxdesign/core/Pagination';
import {Table, proportional} from '@astryxdesign/core/Table';
import {Text} from '@astryxdesign/core/Text';
import {EntityStatus} from '@/components/table-filter/EntityStatus';
import {buildContractPaymentSchedule} from '@/lib/contractPaymentSchedule';
import {contractToday, resolveContractEndDate} from '@/lib/contractDates';
import {PayInvoiceDialog} from './PayInvoiceDialog';
import {PaymentInvoicesDrawer} from './PaymentInvoicesDrawer';
import type {Contract, ContractPayment, Invoice} from '@/types/contract';
import {formatDate, formatMoney} from '@/utils/format';

export function ContractPayments({contract}: {contract: Contract}) {
  const isWide = useMediaQuery('(min-width: 768px)');
  const [page, setPage] = useState(1);
  const [futureYears, setFutureYears] = useState(1);
  const [selected, setSelected] = useState<{date: string; view: 'pay' | 'invoices'} | null>(null);
  const [recorded, setRecorded] = useState<{invoice: Invoice; date: string} | null>(null);
  const today = contractToday();
  const base = contract.start_date > contractToday() ? contract.start_date : contractToday();
  const throughMonth = `${Number(base.slice(0, 4)) + futureYears}-${base.slice(5, 7)}`;
  const end = resolveContractEndDate({startDate: contract.start_date, endDate: contract.end_date, leaseDurationMonths: contract.lease_duration_months});
  const rows = useMemo(() => buildContractPaymentSchedule(contract, throughMonth, today), [contract, throughMonth, today]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 12)));
  const selectedPayment = selected ? rows.find(row => row.due_date === selected.date) : undefined;
  const visibleRows = rows.slice((currentPage - 1) * 12, currentPage * 12);
  const statusOf = (row: ContractPayment) => <VStack gap={1} hAlign="start">
    <EntityStatus variant={row.status === 'PAID' ? 'green' : row.status === 'PARTIALLY_PAID' ? 'orange' : row.status === 'OVERDUE' ? 'red' : 'neutral'}
      label={row.status === 'PAID' ? 'Đã thanh toán' : row.status === 'PARTIALLY_PAID' ? 'Thanh toán một phần' : row.status === 'OVERDUE' ? 'Quá hạn' : 'Chưa thanh toán'} />
    {row.status === 'PARTIALLY_PAID' && <Text color="secondary">Còn {formatMoney(row.remaining)}{row.due_date < contractToday() ? ' · Quá hạn' : ''}</Text>}
  </VStack>;
  const actionsOf = (row: ContractPayment) => <VStack gap={2} hAlign={isWide ? 'start' : 'stretch'}>
    {row.remaining > 0 && <Button className="min-h-11" size="lg" variant="secondary" label="Ghi nhận thanh toán" width={isWide ? undefined : '100%'}
      aria-label={`Ghi nhận thanh toán kỳ ${formatDate(row.due_date, true)}`}
      onClick={() => setSelected({date: row.due_date, view: 'pay'})} />}
    {row.invoices.length > 0 && <Button className="min-h-11" size="lg" variant="ghost" label="Xem hóa đơn" width={isWide ? undefined : '100%'}
      aria-label={`Xem hóa đơn kỳ ${formatDate(row.due_date, true)}`}
      onClick={() => setSelected({date: row.due_date, view: 'invoices'})} />}
  </VStack>;
  return <VStack gap={4}>
    <Heading level={2}>Lịch thanh toán</Heading>
    {recorded && <Banner key={recorded.invoice.id} status="success" title="Đã ghi nhận thanh toán"
      description={`${formatMoney(recorded.invoice.amount)} · Ngày nhận ${formatDate(recorded.invoice.payment_date, true)} · Kỳ đến hạn ${formatDate(recorded.date, true)}`}
      isDismissable dismissLabel="Đóng thông báo" onDismiss={() => setRecorded(null)}
      endContent={<Button label="Xem hóa đơn" onClick={() => setSelected({date: recorded.date, view: 'invoices'})} />} />}

    {!end && contract.payment_frequency !== 'CUSTOM' && <Text color="secondary">Lịch dự kiến đến tháng {throughMonth.slice(5, 7)}/{throughMonth.slice(0, 4)}. Có thể xem thêm các kỳ tiếp theo.</Text>}
    {rows.length === 0 ? <Text color="secondary">Chưa có ngày đến hạn. Với lịch tùy chỉnh, hãy đặt ngày thanh toán tiếp theo trong hợp đồng.</Text> : !isWide ? <List hasDividers density="spacious" aria-label="Các kỳ thanh toán">
      {visibleRows.map(row => <ListItem key={row.due_date} label={`Hạn ${formatDate(row.due_date, true)}`}
        description={<VStack gap={3}>
          <Text weight="semibold" className="break-words tabular-nums">{formatMoney(row.amount)}</Text>
          {statusOf(row)}
          {actionsOf(row)}
        </VStack>} />)}
    </List> : <Table
      data={visibleRows} idKey="due_date" density="balanced" dividers="rows" hasHover
      columns={[
        {key: 'due_date', header: 'Ngày đến hạn', width: proportional(1), renderCell: row => <Text>{formatDate(row.due_date, true)}</Text>},
        {key: 'amount', header: 'Số tiền', width: proportional(1), align: 'end', renderCell: row => <Text>{formatMoney(row.amount)}</Text>},
        {key: 'status', header: 'Trạng thái', width: proportional(1), renderCell: statusOf},
        {key: 'action', header: 'Thanh toán', width: proportional(1), renderCell: actionsOf},
      ]} />}
    <VStack gap={3}>
      {rows.length > 12 && !isWide && <VStack gap={2}>
        <Text className="text-center">Trang {currentPage} / {Math.ceil(rows.length / 12)}</Text>
        <VStack gap={2}>
          <Button className="min-h-11" size="lg" width="100%" label="Trang trước" isDisabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} />
          <Button className="min-h-11" size="lg" width="100%" label="Trang sau" isDisabled={currentPage * 12 >= rows.length} onClick={() => setPage(currentPage + 1)} />
        </VStack>
      </VStack>}
      <HStack hAlign="center">
      {rows.length > 12 && isWide && <Pagination label="Các kỳ thanh toán" page={currentPage} pageSize={12} totalItems={rows.length} onChange={setPage} />}
      </HStack>
      <HStack hAlign="center">
      {!end && contract.status !== 'CANCELLED' && contract.payment_frequency !== 'CUSTOM' && <Button className="min-h-11" size="lg" label="Xem thêm 12 tháng" onClick={() => setFutureYears(years => years + 1)} />}
      </HStack>
    </VStack>
    {selectedPayment && selected?.view === 'pay' && <PayInvoiceDialog key={selected.date} contract={contract} payment={selectedPayment} onRecorded={invoice => {setRecorded({invoice, date: selected.date}); setSelected(null);}} onClose={() => setSelected(null)} />}
    {selectedPayment && selected?.view === 'invoices' && <PaymentInvoicesDrawer contract={contract} payment={selectedPayment} onClose={() => setSelected(null)} onRecordPayment={() => setSelected({date: selected.date, view: 'pay'})} />}
  </VStack>;
}
