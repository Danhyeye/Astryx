'use client';

import {useMediaQuery} from '@astryxdesign/core/hooks';
import {MobileRecordList} from '@/components/table-filter/MobileRecordList';

import { useMemo, useState } from 'react';
import {Grid} from '@astryxdesign/core/Grid';
import {Overlay} from '@astryxdesign/core/Overlay';
import {Lightbox} from '@astryxdesign/core/Lightbox';
import {AspectRatio} from '@astryxdesign/core/AspectRatio';
import {useResizable} from '@astryxdesign/core/Resizable';
import {useQuery} from '@tanstack/react-query';
import {useRouter} from 'next/navigation';
import {PlotDetailPanel} from '@/components/table-filter/PlotDetailPanel';
import {EditPlotDialog} from '@/components/table-filter/EditPlotDialog';
import {DeletePlotsDialog} from '@/components/table-filter/DeletePlotsDialog';
import {CONTRACT_SELECT, toContract, type ContractRowWithRelations} from '@/lib/api/contractRows';
import {createClient} from '@/lib/supabase/client';
import {fetchAllPages} from '@/lib/api/fetchAllPages';
import {LandContracts} from './LandContracts';
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
import {EntityStatus} from '@/components/table-filter/EntityStatus';
import { Table, proportional, type TableColumn } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import {useContractAvailability} from '@/hooks/useContractAvailability';
import {contractToday} from '@/lib/contractDates';
import {getPlotRentalStatus, rentalEndDate} from '@/lib/contractAvailability';
import { useLandDetail } from '@/hooks/useLands';
import { useAllPlots } from '@/hooks/useAllRecords';
import { buildContractRows, buildPlotRows, buildDatasetTableData, PLOT_STATUS_META, type LandTableRow, type PlotTableRow } from '@/data';
import { EditLandDialog } from '@/components/table-filter/EditLandDialog';
import { CreatePlotDialog } from '@/components/table-filter/CreatePlotDialog';
import { FilterBar } from '@/components/table-filter/FilterBar';
import type { PowerSearchFilter } from '@astryxdesign/core/PowerSearch';
import type { Plot } from '@/types/plot';
import { formatArea } from '@/utils/format';
import {Icon} from '@astryxdesign/core/Icon'

const PAGE_SIZE = 15;

const RENTAL_STATUS_META = {...PLOT_STATUS_META, PENDING: {label: 'Đã đặt trước', badge: 'neutral'}};
type LandDetailPlot = Plot & {rentalStatus: ReturnType<typeof getPlotRentalStatus>};

const columns: TableColumn<LandDetailPlot>[] = [
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
      <EntityStatus variant={RENTAL_STATUS_META[plot.rentalStatus].badge} label={RENTAL_STATUS_META[plot.rentalStatus].label} />
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

export function LandDetailClient({ id, initialPlotId = null }: { id: string; initialPlotId?: string | null }) {
  const router = useRouter();
  const panelWidth = useResizable({defaultSize: 380, minSizePx: 320, maxSizePx: 560});
  const isWide = useMediaQuery('(min-width: 768px)');
  const [editingPlot, setEditingPlot] = useState<PlotTableRow | null>(null);
  const [deletingPlot, setDeletingPlot] = useState<PlotTableRow | null>(null);
  const landQuery = useLandDetail(id);
  const plotsQuery = useAllPlots(true, id);
  const rentalQuery = useContractAvailability(true);
  const land = landQuery.data?.data;
  const images = useMemo(() => [...(land?.images ?? [])].sort((a, b) => a.sort_order - b.sort_order), [land?.images]);
  const [viewingImageId, setViewingImageId] = useState<string | null>(null);
  const imageIndex = images.findIndex(image => image.id === viewingImageId);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<PowerSearchFilter[]>([]);
  const [pagination, setPagination] = useState({ key: '', page: 1 });
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(initialPlotId);
  const plotContracts = useQuery({
    queryKey: ['contracts', 'land-plot-detail', id, selectedPlotId],
    enabled: selectedPlotId != null,
    queryFn: async ({signal}) => {
      const response = await fetchAllPages<ContractRowWithRelations>(async (page, size) => {
        const {data, error} = await createClient().from('contracts').select(CONTRACT_SELECT)
          .eq('land_id', id).or(`plot_ids.cs.{${selectedPlotId}},plot_ids.eq.{}`)
          .order('start_date').order('id').range((page - 1) * size, page * size - 1).abortSignal(signal);
        if (error) throw new Error(error.message);
        return {data: data as ContractRowWithRelations[] | null};
      }, signal);
      return buildContractRows(response.data.map(toContract));
    },
  });
  const [editing, setEditing] = useState(false);
  const [creatingPlot, setCreatingPlot] = useState(false);

  const plots = useMemo(
    () =>
      (plotsQuery.data?.data ?? [])
        .filter((plot) => plot.land_id === id)
        .map(plot => ({...plot, rentalStatus: getPlotRentalStatus(plot, rentalQuery.data ?? [])}))
        .sort((a, b) => a.plot_number.localeCompare(b.plot_number, 'vi', { numeric: true })),
    [id, plotsQuery.data?.data, rentalQuery.data]
  );

  const selectedPlot = plots.find(plot => plot.id === selectedPlotId);

  const selectedPlotRow = selectedPlot ? {...buildPlotRows([{...selectedPlot, lands: land ? [land] : selectedPlot.lands}])[0], rentalStatus: selectedPlot.rentalStatus} : null;

  const status = (filters[0]?.value as { value?: string } | undefined)?.value;
  const results = plots.filter(
    (plot) =>
      (!initialPlotId || plot.id === initialPlotId) &&
      (!status || plot.rentalStatus === status) &&
      `${plot.plot_number} ${plot.description}`
        .toLocaleLowerCase('vi')
        .includes(query.trim().toLocaleLowerCase('vi'))
  );

  const key = `${initialPlotId ?? ''}:${query}:${status}`;
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

  const availableCount = plots.filter((plot) => plot.rentalStatus === 'AVAILABLE').length;
  const rentedCount = plots.filter((plot) => plot.rentalStatus === 'RENTED').length;
  const pendingCount = plots.filter(plot => plot.rentalStatus === 'PENDING').length;
  const wholeLandRental = rentalQuery.data?.filter(contract => contract.land_id === id && contract.plot_ids.length === 0
    && (contract.status === 'active' || contract.status === 'pending')
    && (!rentalEndDate(contract) || rentalEndDate(contract)! >= contractToday()))
    .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))[0];
  const soldCount = plots.filter((plot) => plot.rentalStatus === 'SOLD').length;

  const resetPagination = () => setPagination({ key: '', page: 1 });

  const plotDetail = selectedPlotRow && land ? <PlotDetailPanel
        plot={selectedPlotRow} land={land} contracts={plotContracts.data ?? []}
        isContractsLoading={plotContracts.isPending} contractsError={plotContracts.error?.message}
        resizable={isWide ? panelWidth.props : undefined} onClose={() => setSelectedPlotId(null)}
        onSelectLand={() => setSelectedPlotId(null)}
        onSelectContract={contractId => router.push(`/contracts/${contractId}`)}
        onEditPlot={plot => {if (!isWide) setSelectedPlotId(null); setEditingPlot(plot);}} onDeletePlot={setDeletingPlot} /> : undefined;

  return (
    <Layout
      padding={4}
      end={isWide ? plotDetail : undefined}
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
            {landQuery.isPending || plotsQuery.isPending || rentalQuery.isPending ? (
              <VStack gap={4}>
                <Skeleton width="100%" height={140} />
                <Skeleton width="60%" height={20} />
                <Skeleton width="100%" height={200} />
              </VStack>
            ) : landQuery.error || plotsQuery.error || rentalQuery.error ? (
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
                      void rentalQuery.refetch();
                    }}
                  />
                }
              />
            ) : !land ? (
              <EmptyState title="Không tìm thấy khu đất" description="Khu đất này có thể đã bị xóa." />
            ) : (
              <>
                <Card elevation="med" className="rounded-lg!">
                  <VStack gap={4}>
                    <HStack gap={3} hAlign="between" vAlign="center" wrap="wrap">
                      <Heading level={2}>Hình ảnh khu đất</Heading>
                    </HStack>
                    {land.images.length > 0 ? <Grid columns={{minWidth: 160, max: 4, repeat: 'fill'}} gap={3}>
                      {images.slice(0, 4).map((image, index) => <Overlay key={image.id}
                        showOn={index === 3 && images.length > 4 ? 'always' : 'hover-or-focus'} align="center"
                        content={<Button
                          label={index === 3 && images.length > 4 ? `+${(images.length - 4).toLocaleString('en-US')}` : `Xem ảnh ${index + 1}`}
                          variant="secondary"
                          onClick={() => setViewingImageId(index === 3 && images.length > 4 ? images[4].id : image.id)} />}>
                        <AspectRatio ratio={4 / 3} fit="contain" shape="rectangle">
                          {/* Uploaded storage URLs are displayed directly. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.url} alt={image.caption || land.name} loading="lazy" />
                        </AspectRatio>
                      </Overlay>)}
                    </Grid> : <Text color="secondary">Chưa có hình ảnh khu đất.</Text>}
                  </VStack>
                </Card>
                <Card className="rounded-lg!">
                  <VStack gap={4}>
                    <MetadataList columns={2}>
                      {wholeLandRental && <MetadataListItem label="Tình trạng cho thuê">
                        <EntityStatus label={(wholeLandRental.status === 'pending' || (wholeLandRental.start_date ?? '') > contractToday()) ? 'Đã đặt trước toàn bộ khu đất' : 'Đang cho thuê toàn bộ khu đất'} />
                      </MetadataListItem>}
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
                      <StatItem count={pendingCount} label="Đã đặt trước" />
                      <Divider orientation="vertical" />
                      <StatItem count={soldCount} label="Đã bán" />
                    </HStack>
                  </VStack>
                </Card>

                <LandContracts key={id} landId={id} />

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
                      statusOptions={Object.entries(RENTAL_STATUS_META)
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
                      !isWide ? <MobileRecordList detailColumns={2} fullWidthKeys={['description', 'details']} actionKeys={['details']}
                        rows={results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
                        columns={[...columns, {key: 'details', header: 'Chi tiết', renderCell: plot => <Button label="Xem chi tiết" onClick={() => setSelectedPlotId(plot.id)} />}]} rowKey={row => row.id} label="Lô đất" /> : <Table
                        data={results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
                        columns={[...columns, {
                          key: 'details', header: 'Chi tiết', width: proportional(1),
                          renderCell: plot => <Button label="Xem chi tiết" size="sm" variant="ghost" onClick={() => setSelectedPlotId(plot.id)} />,
                        }]}
                        idKey="id"
                        rowCount={results.length}
                        rowIndexStart={(page - 1) * PAGE_SIZE + 1}
                        hasHover
                      />
                    )}

                    {results.length > PAGE_SIZE && (
                      <HStack hAlign="center">
                        <Pagination
                          label="Phân trang lô đất"
                          page={page}
                          pageSize={PAGE_SIZE}
                          totalItems={results.length}
                          onChange={(page) => setPagination({ key, page })}
                        />
                      </HStack>
                    )}
                  </VStack>
                </Section>
              </>
            )}

            {!isWide && plotDetail}
            {imageIndex >= 0 && <Lightbox isOpen hasZoom
              media={images.map(image => ({src: image.url, alt: image.caption || land?.name || 'Hình ảnh khu đất', caption: image.caption || undefined}))}
              index={imageIndex} onIndexChange={index => setViewingImageId(images[index]?.id ?? null)}
              onOpenChange={open => {if (!open) setViewingImageId(null);}} />}
            {editingPlot && land && <EditPlotDialog plot={editingPlot} lands={[land]} isOpen
              onOpenChange={open => {if (!open) setEditingPlot(null);}} onSaved={() => {void plotsQuery.refetch();}} />}
            {deletingPlot && <DeletePlotsDialog plots={[deletingPlot]} isOpen
              onOpenChange={open => {if (!open) setDeletingPlot(null);}}
              onDeleted={() => {setSelectedPlotId(null); void plotsQuery.refetch();}} />}
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
