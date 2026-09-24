'use client';

import {useState} from 'react';
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
import type {Contract} from '@/types/contract';
import {formatDate, formatMoney} from '@/utils/format';

export function ContractPayments({contract}: {contract: Contract}) {
  const [page, setPage] = useState(1);
  const [futureYears, setFutureYears] = useState(1);
  const [selected, setSelected] = useState<{date: string; view: 'pay' | 'invoices'} | null>(null);
  const base = contract.start_date > contractToday() ? contract.start_date : contractToday();
  const throughMonth = `${Number(base.slice(0, 4)) + futureYears}-${base.slice(5, 7)}`;
  const end = resolveContractEndDate({startDate: contract.start_date, endDate: contract.end_date, leaseDurationMonths: contract.lease_duration_months});
  const rows = buildContractPaymentSchedule(contract, throughMonth);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 12)));
  const selectedPayment = selected ? rows.find(row => row.due_date === selected.date) : undefined;
  return <VStack gap={4}>
    <Heading level={2}>Lịch thanh toán</Heading>
    {!end && contract.payment_frequency !== 'CUSTOM' && <Text color="secondary">Lịch dự kiến đến tháng {throughMonth.slice(5, 7)}/{throughMonth.slice(0, 4)}. Có thể xem thêm các kỳ tiếp theo.</Text>}
    {rows.length === 0 ? <Text color="secondary">Chưa có ngày đến hạn. Với lịch tùy chỉnh, hãy đặt ngày thanh toán tiếp theo trong hợp đồng.</Text> : <Table
      data={rows.slice((currentPage - 1) * 12, currentPage * 12)} idKey="due_date" density="balanced" dividers="rows" hasHover
      columns={[
        {key: 'due_date', header: 'Ngày đến hạn', width: proportional(1), renderCell: row => <Text>{formatDate(row.due_date, true)}</Text>},
        {key: 'amount', header: 'Số tiền', width: proportional(1), align: 'center', renderCell: row => <Text>{formatMoney(row.amount)}</Text>},
        {key: 'status', header: 'Trạng thái', width: proportional(1), renderCell: row => {
          const paid = row.status === 'PAID';
          const partial = row.status === 'PARTIALLY_PAID';
          return <VStack gap={1} hAlign="start">
            <EntityStatus variant={paid ? 'green' : partial ? 'orange' : row.status === 'OVERDUE' ? 'red' : 'neutral'}
              label={paid ? 'Đã thanh toán' : partial ? 'Thanh toán một phần' : row.status === 'OVERDUE' ? 'Quá hạn' : 'Chưa thanh toán'} />
            {partial && <Text type="supporting" color="secondary">Còn {formatMoney(row.remaining)}{row.due_date < contractToday() ? ' · Quá hạn' : ''}</Text>}
          </VStack>;
        }},
        {key: 'action', header: 'Thanh toán', width: proportional(1), renderCell: row => <VStack gap={2} hAlign="start">
          {row.remaining > 0 && <Button size="sm" variant="secondary" label="Thanh toán hóa đơn"
            onClick={() => setSelected({date: row.due_date, view: 'pay'})} />}
          {row.invoices.length > 0 && <Button size="sm" variant="ghost" label="Xem hóa đơn"
            onClick={() => setSelected({date: row.due_date, view: 'invoices'})} />}
        </VStack>},
      ]} />}
    <VStack gap={3}>
      <HStack hAlign="center">
      {rows.length > 12 && <Pagination label="Các kỳ thanh toán" page={currentPage} pageSize={12} totalItems={rows.length} onChange={setPage} />}
      </HStack>
      <HStack hAlign="center">
      {!end && contract.status !== 'CANCELLED' && contract.payment_frequency !== 'CUSTOM' && <Button label="Xem thêm 12 tháng" onClick={() => setFutureYears(years => years + 1)} />}
      </HStack>
    </VStack>
    {selectedPayment && selected?.view === 'pay' && <PayInvoiceDialog key={selected.date} contractId={contract.id} payment={selectedPayment} onClose={() => setSelected(null)} />}
    {selectedPayment && selected?.view === 'invoices' && <PaymentInvoicesDrawer contract={contract} payment={selectedPayment} onClose={() => setSelected(null)} />}
  </VStack>;
}
