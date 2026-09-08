'use client';

import { useMemo, useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack, Layout, LayoutContent, LayoutHeader, VStack } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Pagination } from '@astryxdesign/core/Pagination';
import { Section } from '@astryxdesign/core/Section';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Table, proportional, type TableColumn } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { useLandDetail } from '@/hooks/useLands';
import { useAllPlots } from '@/hooks/useAllRecords';
import { buildDatasetTableData, PLOT_STATUS_META, type LandTableRow } from '@/data';
import { EditLandDialog } from '@/components/table-filter/EditLandDialog';
import { CreatePlotDialog } from '@/components/table-filter/CreatePlotDialog';
import { FilterBar } from '@/components/table-filter/FilterBar';
import type { PowerSearchFilter } from '@astryxdesign/core/PowerSearch';
import type { Plot } from '@/types/plot';
import { formatArea } from '@/utils/format';
import {Icon} from '@astryxdesign/core/Icon'

const PAGE_SIZE = 15;

const columns: TableColumn<Plot>[] = [
  { key: 'plot_number', header: 'Mã lô đất', width: proportional(1) },
  {
    key: 'area_sqm',
    header: 'Diện tích',
    width: proportional(1),
    renderCell: (plot) => formatArea(plot.area_sqm),
  },
  {
    key: 'status',
    header: 'Trạng thái',
    width: proportional(1),
    renderCell: (plot) => (
      <HStack gap={2} vAlign="center">
        <StatusDot
          variant={plot.status === 'AVAILABLE' ? 'success' : 'neutral'}
          label={PLOT_STATUS_META[plot.status].label}
        />
        <Text>{PLOT_STATUS_META[plot.status].label}</Text>
      </HStack>
    ),
  },
  { key: 'description', header: 'Mô tả', width: proportional(2) },
];

function StatItem({ count, label }: { count: number; label: string }) {
  return (
    <VStack gap={0.5}>
      <Heading level={2}>{count}</Heading>
      <Text>{label}</Text>
    </VStack>
  );
}

export function LandDetailClient({ id }: { id: string }) {
  const landQuery = useLandDetail(id);
  const plotsQuery = useAllPlots();
  const land = landQuery.data?.data;

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<PowerSearchFilter[]>([]);
  const [pagination, setPagination] = useState({ key: '', page: 1 });
  const [editing, setEditing] = useState(false);
  const [creatingPlot, setCreatingPlot] = useState(false);

  const plots = useMemo(
    () =>
      (plotsQuery.data?.data ?? [])
        .filter((plot) => plot.land_id === id)
        .sort((a, b) => a.plot_number.localeCompare(b.plot_number, 'vi', { numeric: true })),
    [id, plotsQuery.data?.data]
  );

  const status = (filters[0]?.value as { value?: string } | undefined)?.value;
  const results = plots.filter(
    (plot) =>
      (!status || plot.status === status) &&
      `${plot.plot_number} ${plot.description}`
        .toLocaleLowerCase('vi')
        .includes(query.trim().toLocaleLowerCase('vi'))
  );

  const key = `${query}:${status}`;
  const page = Math.min(
    pagination.key === key ? pagination.page : 1,
    Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  );

  const landRow = useMemo(
    () =>
      land
        ? (buildDatasetTableData({ dataset: 'lands', lands: [land], plots, customers: [], contracts: [] })
          .rows[0] as LandTableRow)
        : null,
    [land, plots]
  );

  const availableCount = plots.filter((plot) => plot.status === 'AVAILABLE').length;
  const rentedCount = plots.filter((plot) => plot.status === 'RENTED').length;
  const soldCount = plots.filter((plot) => plot.status === 'SOLD').length;

  const resetPagination = () => setPagination({ key: '', page: 1 });

  return (
    <Layout
      padding={4}
      header={
        <LayoutHeader hasDivider>
          <VStack gap={3}>
            <Link href="/lands" isStandalone>
              <HStack gap={1} vAlign="center">
                <Icon icon="chevronLeft" />
                <Text>Quay lại khu đất</Text>
              </HStack>
            </Link>
            <HStack gap={3} hAlign="between" wrap="wrap">
              <Heading level={1}>{land?.name ?? 'Chi tiết khu đất'}</Heading>
              {land && (
                <Button label="Chỉnh sửa khu đất" variant="secondary" onClick={() => setEditing(true)} />
              )}
            </HStack>
          </VStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={4} label="Thông tin khu đất và lô đất">
          <VStack gap={6}>
            {landQuery.isPending || plotsQuery.isPending ? (
              <VStack gap={4}>
                <Skeleton width="100%" height={140} />
                <Skeleton width="60%" height={20} />
                <Skeleton width="100%" height={200} />
              </VStack>
            ) : landQuery.error || plotsQuery.error ? (
              <Banner
                status="error"
                title="Không thể tải thông tin khu đất"
                description="Vui lòng thử lại."
                endContent={
                  <Button
                    label="Thử lại"
                    onClick={() => {
                      void landQuery.refetch();
                      void plotsQuery.refetch();
                    }}
                  />
                }
              />
            ) : !land ? (
              <EmptyState title="Không tìm thấy khu đất" description="Khu đất này có thể đã bị xóa." />
            ) : (
              <>
                <Card>
                  <VStack gap={4}>
                    <MetadataList columns={2}>
                      <MetadataListItem label="Địa chỉ">
                        {land.location || 'Chưa có địa chỉ'}
                      </MetadataListItem>
                      <MetadataListItem label="Diện tích">{formatArea(land.area_sqm)}</MetadataListItem>
                      <MetadataListItem label="Mô tả">
                        {land.description || 'Chưa có mô tả'}
                      </MetadataListItem>
                    </MetadataList>

                    <Divider />

                    <HStack gap={4} vAlign="center" wrap="wrap">
                      <StatItem count={plots.length} label="Tổng số lô đất" />
                      <Divider orientation="vertical" />
                      <StatItem count={availableCount} label="Còn trống" />
                      <Divider orientation="vertical" />
                      <StatItem count={rentedCount} label="Đang cho thuê" />
                      <Divider orientation="vertical" />
                      <StatItem count={soldCount} label="Đã bán" />
                    </HStack>
                  </VStack>
                </Card>

                <Section padding={5}>
                  <VStack gap={4}>
                    <HStack hAlign="between" gap={3}>
                      <Heading level={2}>Danh sách lô đất</Heading>
                      <Button label="Thêm lô đất" onClick={() => setCreatingPlot(true)} />
                    </HStack>

                    <FilterBar
                      query={query}
                      filters={filters}
                      resultCount={results.length}
                      statusOptions={Object.entries(PLOT_STATUS_META)
                        .filter(([value]) => value !== 'UNASSIGNED')
                        .map(([value, meta]) => ({ value, label: meta.label }))}
                      searchLabel="Tìm lô đất"
                      searchPlaceholder="Tìm theo mã lô hoặc mô tả…"
                      onQueryChange={(value) => {
                        setQuery(value);
                        resetPagination();
                      }}
                      onFiltersChange={(updater) => {
                        setFilters(updater);
                        resetPagination();
                      }}
                      onClearAll={() => {
                        setQuery('');
                        setFilters([]);
                        resetPagination();
                      }}
                    />

                    {results.length === 0 ? (
                      <EmptyState
                        title="Không có lô đất phù hợp"
                        description="Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm."
                      />
                    ) : (
                      <Table
                        data={results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
                        columns={columns}
                        idKey="id"
                        rowCount={results.length}
                        rowIndexStart={(page - 1) * PAGE_SIZE + 1}
                        hasHover
                      />
                    )}

                    {results.length > PAGE_SIZE && (
                      <Pagination
                        label="Phân trang lô đất"
                        page={page}
                        pageSize={PAGE_SIZE}
                        totalItems={results.length}
                        onChange={(page) => setPagination({ key, page })}
                      />
                    )}
                  </VStack>
                </Section>
              </>
            )}

            {editing && landRow && (
              <EditLandDialog
                land={landRow}
                isOpen
                onOpenChange={setEditing}
                onSaved={() => {
                  void landQuery.refetch();
                }}
              />
            )}
            {creatingPlot && land && <CreatePlotDialog lands={[land]} isOpen onOpenChange={setCreatingPlot} />}
          </VStack>
        </LayoutContent>
      }
    />
  );
}