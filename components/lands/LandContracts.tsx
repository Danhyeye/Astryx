'use client';

import {useMediaQuery} from '@astryxdesign/core/hooks';
import {MobileRecordList} from '@/components/table-filter/MobileRecordList';

import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Heading} from '@astryxdesign/core/Heading';
import {HStack, VStack} from '@astryxdesign/core/Layout';
import {Link} from '@astryxdesign/core/Link';
import {Pagination} from '@astryxdesign/core/Pagination';
import {Section} from '@astryxdesign/core/Section';
import {Skeleton} from '@astryxdesign/core/Skeleton';
import {EntityStatus} from '@/components/table-filter/EntityStatus';
import {Table, proportional, type TableColumn} from '@astryxdesign/core/Table';
import {buildContractRows, CONTRACT_STATUS_META, type ContractTableRow} from '@/data';
import {fetchContractsPage} from '@/lib/api/fetchContractsPage';
import {formatDate, formatMoney} from '@/utils/format';
import {resolveContractEndDate} from '@/lib/contractDates';

const PAGE_SIZE = 10;
const columns: TableColumn<ContractTableRow>[] = [
  {key: 'customer', header: 'Khách hàng', width: proportional(2), renderCell: row => (
    <Link href={`/contracts/${row.id}`}>{row.customer}</Link>
  )},
  {key: 'plot', header: 'Phạm vi thuê', width: proportional(2), renderCell: row => row.plotIds.length ? row.plot : 'Toàn bộ khu đất'},
  {key: 'status', header: 'Trạng thái', width: proportional(1), renderCell: row => (
    <EntityStatus label={CONTRACT_STATUS_META[row.status].label} variant={CONTRACT_STATUS_META[row.status].badge} />
  )},
  {key: 'rentAmount', header: 'Tiền thuê', width: proportional(1), renderCell: row => formatMoney(row.rentAmount)},
  {key: 'startDate', header: 'Ngày bắt đầu', width: proportional(1), renderCell: row => formatDate(row.startDate, true)},
  {key: 'endDate', header: 'Ngày kết thúc', width: proportional(1), renderCell: row => {
    const end = resolveContractEndDate(row);
    return end ? formatDate(end, true) : 'Không thời hạn';
  }},
  {key: 'id', header: 'Chi tiết', width: proportional(1), renderCell: row => (
    <Link href={`/contracts/${row.id}`}>Xem hợp đồng</Link>
  )},
];

export function LandContracts({landId}: {landId: string}) {
  const isWide = useMediaQuery('(min-width: 768px)');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['contracts', 'land', landId, page],
    queryFn: async ({signal}) => {
      const result = await fetchContractsPage({landId, page, pageSize: PAGE_SIZE}, signal);
      return {rows: buildContractRows(result.data ?? []), total: result.total ?? 0};
    },
  });

  return (
    <Section padding={5}>
      <VStack gap={4}>
        <Heading level={2}>Hợp đồng của khu đất</Heading>
        {query.isPending ? <Skeleton width="100%" height={200} />
          : query.isError ? <Banner status="error" title="Không thể tải hợp đồng" description={query.error.message}
            endContent={<Button label="Thử lại" onClick={() => {void query.refetch();}} />} />
          : query.data.total === 0 ? <EmptyState title="Chưa có hợp đồng" description="Hợp đồng thuê khu đất hoặc các lô trong khu đất sẽ hiển thị tại đây." />
          : <>
            <>{!isWide ? <MobileRecordList detailColumns={2} fullWidthKeys={['plot', 'id']} actionKeys={['id']} rows={query.data.rows} columns={columns} rowKey={row => row.id} label="Hợp đồng của khu đất" /> : <Table data={query.data.rows} columns={columns} idKey="id" hasHover
              rowCount={query.data.total} rowIndexStart={(page - 1) * PAGE_SIZE + 1} />}</>
            {query.data.total > PAGE_SIZE && <HStack hAlign="center">
              <Pagination label="Phân trang hợp đồng" page={page}
                pageSize={PAGE_SIZE} totalItems={query.data.total} onChange={setPage} />
            </HStack>}
          </>}
      </VStack>
    </Section>
  );
}
