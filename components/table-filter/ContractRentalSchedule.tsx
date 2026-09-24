import {useMediaQuery} from '@astryxdesign/core/hooks';
import {MobileRecordList} from '@/components/table-filter/MobileRecordList';
import {EntityStatus} from './EntityStatus';
import {useState} from 'react';
import {Heading} from '@astryxdesign/core/Heading';
import {VStack} from '@astryxdesign/core/Layout';
import {Link} from '@astryxdesign/core/Link';
import {Pagination} from '@astryxdesign/core/Pagination';
import {Table, proportional, type TableColumn} from '@astryxdesign/core/Table';
import {Text} from '@astryxdesign/core/Text';
import {formatDate} from '@/utils/format';
import {rentalEndDate, rentalOverlaps, type RentalContract, type RentalPeriod} from '@/lib/contractAvailability';

export function ContractRentalSchedule({contracts, landId, excludeId, plots, period, selectedPlotIds}: {
  contracts: readonly RentalContract[];
  landId: string;
  excludeId?: string;
  plots: readonly {id: string; plot_number: string}[];
  period: RentalPeriod;
  selectedPlotIds: readonly string[];
}) {
  const isWide = useMediaQuery('(min-width: 768px)');
  const [requestedPage, setPage] = useState(1);
  const rows = contracts.filter(contract => contract.land_id === landId && contract.id !== excludeId)
    .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '') || a.id.localeCompare(b.id));
  const pageSize = 5;
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(rows.length / pageSize)));
  const columns: TableColumn<RentalContract>[] = [
    {key: 'plot_ids', header: 'Phạm vi thuê', width: proportional(2), renderCell: row => (
      <Link href={`/contracts/${row.id}`}>{row.plot_ids.length
        ? row.plot_ids.map(id => plots.find(plot => plot.id === id)?.plot_number ?? id).join(', ')
        : 'Toàn bộ khu đất'}</Link>
    )},
    {key: 'start_date', header: 'Bắt đầu', width: proportional(1), renderCell: row => formatDate(row.start_date, true)},
    {key: 'end_date', header: 'Kết thúc', width: proportional(1), renderCell: row => {
      const end = rentalEndDate(row);
      return end ? formatDate(end, true) : 'Không thời hạn';
    }},
    {key: 'status', header: 'Tình trạng', width: proportional(2), renderCell: row => {
      const conflicts = (row.status === 'active' || row.status === 'pending') && rentalOverlaps(row, period)
        && (selectedPlotIds.length === 0 || row.plot_ids.length === 0 || row.plot_ids.some(id => selectedPlotIds.includes(id)));
      return <EntityStatus variant={conflicts ? 'red' : 'neutral'} label={conflicts ? 'Trùng thời gian đã chọn' : row.status === 'completed' ? 'Đã hoàn tất' : 'Không trùng thời gian'} />;
    }},
  ];
  return <VStack gap={3}>
    <Heading level={3}>Lịch thuê của khu đất</Heading>
    <Text color="secondary">Ngày kết thúc được tính trong thời gian thuê. Hợp đồng mới có thể bắt đầu từ ngày tiếp theo.</Text>
    {rows.length === 0 ? <Text>Chưa có lịch thuê cho khu đất này.</Text> : <>
      {!isWide ? <MobileRecordList rows={rows.slice((page - 1) * pageSize, page * pageSize)} columns={columns} rowKey={row => row.id} label="Lịch thuê" /> : <Table data={rows.slice((page - 1) * pageSize, page * pageSize)} columns={columns} idKey="id" density="compact" />}
      {rows.length > pageSize && <Pagination label="Phân trang lịch thuê" page={page} pageSize={pageSize} totalItems={rows.length} onChange={setPage} />}
    </>}
  </VStack>;
}
