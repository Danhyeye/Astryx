'use client';

import {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
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
import {createClient} from '@/lib/supabase/client';
import type {Contract} from '@/types/contract';
import {formatDate, formatMoney} from '@/utils/format';

export function ContractPayments({contract}: {contract: Contract}) {
  const [page, setPage] = useState(1);
  const [futureYears, setFutureYears] = useState(1);
  const cache = useQueryClient();
  const base = contract.start_date > contractToday() ? contract.start_date : contractToday();
  const throughMonth = `${Number(base.slice(0, 4)) + futureYears}-${base.slice(5, 7)}`;
  const end = resolveContractEndDate({startDate: contract.start_date, endDate: contract.end_date, leaseDurationMonths: contract.lease_duration_months});
  const rows = buildContractPaymentSchedule(contract, throughMonth);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / 12)));
  const save = useMutation({
    mutationFn: async ({date, paid}: {date: string; paid: boolean}) => {
      const {error} = await createClient().rpc('record_contract_payment', {
        p_contract_id: contract.id, p_due_date: date, p_paid: paid,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({queryKey: ['contractDetail', contract.id]}),
        cache.invalidateQueries({queryKey: ['contracts']}),
      ]);
    },
  });
  return <VStack gap={4}>
    <Heading level={2}>Lịch thanh toán</Heading>
    {!end && contract.payment_frequency !== 'CUSTOM' && <Text color="secondary">Lịch dự kiến đến tháng {throughMonth.slice(5, 7)}/{throughMonth.slice(0, 4)}. Có thể xem thêm các kỳ tiếp theo.</Text>}
    {save.error && <Banner status="error" title="Không thể lưu thanh toán" description={save.error.message} />}
    {rows.length === 0 ? <Text color="secondary">Chưa có ngày đến hạn. Với lịch tùy chỉnh, hãy đặt ngày thanh toán tiếp theo trong hợp đồng.</Text> : <Table
      data={rows.slice((currentPage - 1) * 12, currentPage * 12)} idKey="due_date" density="balanced" dividers="rows" hasHover
      columns={[
        {key: 'due_date', header: 'Ngày đến hạn', width: proportional(1), renderCell: row => <Text>{formatDate(row.due_date, true)}</Text>},
        {key: 'amount', header: 'Số tiền', width: proportional(1), align: 'center', renderCell: row => <Text>{formatMoney(row.amount)}</Text>},
        {key: 'status', header: 'Trạng thái', width: proportional(1), renderCell: row => {
          const paid = !!row.paid_at || row.status.toUpperCase() === 'PAID';
          return <VStack gap={1} hAlign="start"><EntityStatus variant={paid ? 'green' : row.due_date < contractToday() ? 'red' : 'neutral'} label={paid ? 'Đã thanh toán' : row.due_date < contractToday() ? 'Quá hạn' : 'Chưa thanh toán'} />
            {row.paid_at && <Text type="supporting" color="secondary">{formatDate(row.paid_at, true)}</Text>}
          </VStack>;
        }},
        {key: 'action', header: 'Thanh toán', width: proportional(1), renderCell: row => {
          const paid = !!row.paid_at || row.status.toUpperCase() === 'PAID';
          return <Button size="sm" variant="secondary" label={paid ? 'Đánh dấu chưa trả' : 'Đánh dấu đã trả'}
            isDisabled={save.isPending} isLoading={save.isPending && save.variables?.date === row.due_date}
            onClick={() => save.mutate({date: row.due_date, paid: !paid})} />;
        }},
      ]} />}
    <VStack gap={3}>
      <HStack hAlign="center">
      {rows.length > 12 && <Pagination label="Các kỳ thanh toán" page={currentPage} pageSize={12} totalItems={rows.length} onChange={setPage} />}
      </HStack>
      <HStack hAlign="center">
      {!end && contract.status !== 'CANCELLED' && contract.payment_frequency !== 'CUSTOM' && <Button label="Xem thêm 12 tháng" onClick={() => setFutureYears(years => years + 1)} />}
      </HStack>
    </VStack>
  </VStack>;
}
