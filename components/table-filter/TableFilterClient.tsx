'use client';

import {EntityStatus} from './EntityStatus';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Heading} from '@astryxdesign/core/Heading';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Icon} from '@astryxdesign/core/Icon';
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutHeader,
  StackItem,
  VStack,
} from '@astryxdesign/core/Layout';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {Section} from '@astryxdesign/core/Section';
import {Text} from '@astryxdesign/core/Text';
import {AspectRatio} from '@astryxdesign/core/AspectRatio';
import {usePowerSearchConfig} from '@astryxdesign/core/PowerSearch';
import type {PowerSearchFilter} from '@astryxdesign/core/PowerSearch';
import {useResizable} from '@astryxdesign/core/Resizable';
import {
  Table,
  pixel,
  proportional,
  useTableGroupedRows,
  useTableSelection,
  useTableSelectionState,
  useTableSortable,
  useTableStickyColumns,
} from '@astryxdesign/core/Table';
import type {TableColumn, TablePlugin} from '@astryxdesign/core/Table';
import {
  Image as ImageIcon,
  Search,
} from 'lucide-react';

import {
  CONTRACT_STATUS_META,
  DATASET_META,
  DEFAULT_DATASET_KEY,
  GROUP_ROW_KEY_PREFIX,
  NO_ROWS,
  PAGE_SIZE,
  PAYMENT_FREQUENCY_META,
  PLOT_STATUS_META,
  SELECTION_COLUMN_KEY,
  SELECTION_COLUMN_WIDTH,
  SORT_RANKS,
  buildContractRows,
  buildDatasetTableData,
  contractsForCustomerRecord,
  contractsForLandRecord,
  contractsForPlotRecord,
  getDatasetInitialFilters,
  getDatasetInitialSort,
  getDatasetInitialView,
  groupKeyOf,
  landForPlotRecord,
  plotsForLandRecord,
  stickyKeys,
  type ContractTableRow,
  type CustomerTableRow,
  type DatasetKey,
  type EntityTableRow,
  type LandTableRow,
  type PlotTableRow,
  type TableSortState,
  type TableSearchValue,
  type ViewState,
} from '@/data';
import {useAllContracts} from '@/hooks/useAllRecords';
import {useAllCustomers} from '@/hooks/useAllRecords';
import {Pagination} from '@astryxdesign/core/Pagination';
import {useRouter} from 'next/navigation';
import {useAllLands} from '@/hooks/useAllRecords';
import {useAllPlots} from '@/hooks/useAllRecords';
import {formatArea, formatDate, formatMoney} from '@/utils/format';
import {styles} from '@/app/table-filter/styles';
import {BulkActionBar} from './BulkActionBar';
import {CreateContractDialog} from './CreateContractDialog';
import {CreateCustomerDialog} from './CreateCustomerDialog';
import {CreateLandDialog} from './CreateLandDialog';
import {CreatePlotDialog} from './CreatePlotDialog';
import {CustomerDetailPanel} from './CustomerDetailPanel';
import {DeleteCustomersDialog} from './DeleteCustomersDialog';
import {DeleteLandsDialog} from './DeleteLandsDialog';
import {DeletePlotsDialog} from './DeletePlotsDialog';
import {EditContractDialog} from './EditContractDialog';
import {EditCustomerDialog} from './EditCustomerDialog';
import {EditLandDialog} from './EditLandDialog';
import {EditPlotDialog} from './EditPlotDialog';
import {FilterBar} from './FilterBar';
import {LandDetailPanel} from './LandDetailPanel';
import {LoadingRows} from './LoadingRows';
import {PlotDetailPanel} from './PlotDetailPanel';

function rowValue(
  row: EntityTableRow,
  key: string,
): TableSearchValue | undefined {
  return (row as Record<string, TableSearchValue | undefined>)[key];
}

function textValue(row: EntityTableRow, key: string): string {
  const value = rowValue(row, key);
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function numberValue(row: EntityTableRow, key: string): number {
  const value = rowValue(row, key);
  return typeof value === 'number' ? value : 0;
}

function isContractRow(row: EntityTableRow | null): row is ContractTableRow {
  return row?.dataset === 'contracts';
}

function isLandRow(row: EntityTableRow | null): row is LandTableRow {
  return row?.dataset === 'lands';
}

function isPlotRow(row: EntityTableRow | null): row is PlotTableRow {
  return row?.dataset === 'plots';
}

function isCustomerRow(row: EntityTableRow | null): row is CustomerTableRow {
  return row?.dataset === 'customers';
}

export default function TableFilterClient({
  initialDataset = DEFAULT_DATASET_KEY,
  initialSelectedId = null,
}: {
  initialDataset?: DatasetKey;
  initialSelectedId?: string | null;
} = {}) {
  const router = useRouter();
  const [isCreateLandDialogOpen, setIsCreateLandDialogOpen] = useState(false);
  const [editingLand, setEditingLand] = useState<LandTableRow | null>(null);
  const [deletingLands, setDeletingLands] = useState<LandTableRow[]>([]);
  const [isCreatePlotDialogOpen, setIsCreatePlotDialogOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<PlotTableRow | null>(null);
  const [deletingPlots, setDeletingPlots] = useState<PlotTableRow[]>([]);
  const [isCreateCustomerDialogOpen, setIsCreateCustomerDialogOpen] =
    useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerTableRow | null>(null);
  const [deletingCustomers, setDeletingCustomers] = useState<
    CustomerTableRow[]
  >([]);
  const [isCreateContractDialogOpen, setIsCreateContractDialogOpen] =
    useState(false);
  const [editingContract, setEditingContract] =
    useState<ContractTableRow | null>(null);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [activeRowId, setActiveRowId] = useState<string | null>(initialSelectedId);
  const dataset = initialDataset;
  const needsContractOptions = isCreateContractDialogOpen || editingContract != null;
  const needsPlotOptions = isCreatePlotDialogOpen || editingPlot != null;
  const needsRelatedContracts = activeRowId != null && dataset !== 'contracts';

  const {
    data: contractsResponse,
    isPending: isContractsPending,
    isFetching: isContractsFetching,
    error: contractsError,
    refetch: refetchContracts,
  } = useAllContracts(dataset === 'contracts' || needsRelatedContracts);
  const {
    data: landsResponse,
    isPending: isLandsPending,
    isFetching: isLandsFetching,
    error: landsError,
    refetch: refetchLands,
  } = useAllLands(dataset === 'lands' || needsContractOptions || needsPlotOptions || (dataset === 'plots' && activeRowId != null));
  const {
    data: plotsResponse,
    isPending: isPlotsPending,
    isFetching: isPlotsFetching,
    error: plotsError,
    refetch: refetchPlots,
  } = useAllPlots(dataset === 'plots' || needsContractOptions || (dataset === 'lands' && activeRowId != null));
  const {
    data: customersResponse,
    isPending: isCustomersPending,
    isFetching: isCustomersFetching,
    error: customersError,
    refetch: refetchCustomers,
  } = useAllCustomers(dataset === 'customers' || needsContractOptions);

  const contracts = useMemo(
    () => contractsResponse?.data ?? [],
    [contractsResponse?.data],
  );
  const lands = useMemo(() => landsResponse?.data ?? [], [landsResponse?.data]);
  const plots = useMemo(() => plotsResponse?.data ?? [], [plotsResponse?.data]);
  const customers = useMemo(
    () => customersResponse?.data ?? [],
    [customersResponse?.data],
  );

  const tableData = useMemo(
    () =>
      buildDatasetTableData({
        dataset,
        contracts,
        customers,
        lands,
        plots,
      }),
    [contracts, customers, dataset, lands, plots],
  );
  const contractRows = useMemo(() => buildContractRows(contracts), [contracts]);
  const [filters, setFilters] = useState<PowerSearchFilter[]>(() =>
    getDatasetInitialFilters(initialDataset),
  );
  const [query, setQuery] = useState('');

  const hasOpenedFirstRow = useRef(false);

  const detailWidth = useResizable({
    defaultSize: 380,
    minSizePx: 320,
    maxSizePx: 560,
  });

  const [sort, setSort] = useState<TableSortState>(() =>
    getDatasetInitialSort(initialDataset),
  );

  const [view] = useState<ViewState>(() =>
    getDatasetInitialView(initialDataset),
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );

  const closeEntityDialogs = useCallback(() => {
    setIsCreateLandDialogOpen(false);
    setEditingLand(null);
    setDeletingLands([]);
    setIsCreatePlotDialogOpen(false);
    setEditingPlot(null);
    setDeletingPlots([]);
    setIsCreateCustomerDialogOpen(false);
    setEditingCustomer(null);
    setDeletingCustomers([]);
    setIsCreateContractDialogOpen(false);
    setEditingContract(null);
  }, []);

  const {applyFilters} = usePowerSearchConfig(
    tableData.fieldDefs,
    tableData.label,
  );

  const requestKey = useMemo(
    () => `${JSON.stringify(filters)}:${query}`,
    [filters, query],
  );
  const [settledRequestKey, setSettledRequestKey] = useState(requestKey);

  useEffect(() => {
    const timer = setTimeout(() => setSettledRequestKey(requestKey), 450);
    return () => clearTimeout(timer);
  }, [requestKey]);

  const pendingByDataset: Record<DatasetKey, boolean> = {
    lands: isLandsPending,
    plots: isPlotsPending,
    contracts: isContractsPending,
    customers: isCustomersPending,
  };
  const fetchingByDataset: Record<DatasetKey, boolean> = {
    lands: isLandsFetching,
    plots: isPlotsFetching,
    contracts: isContractsFetching,
    customers: isCustomersFetching,
  };
  const errorByDataset: Record<DatasetKey, Error | null> = {
    lands: landsError,
    plots: plotsError,
    contracts: contractsError,
    customers: customersError,
  };
  const isInitialDataLoading = pendingByDataset[dataset];
  const isDataRefreshing = fetchingByDataset[dataset];
  const dataError = errorByDataset[dataset];
  const isLoading =
    isInitialDataLoading || isDataRefreshing || settledRequestKey !== requestKey;

  const showDatasetRow = useCallback(
    (next: DatasetKey, rowId: string) => {
      if (next === 'lands' || next === 'contracts') {
        router.push(`/${next}/${encodeURIComponent(rowId)}`);
        return;
      }
      if (next !== dataset) {
        router.push(`${DATASET_META[next].href}?selected=${encodeURIComponent(rowId)}`);
        return;
      }
      setSelectedKeys(new Set());
      setActiveRowId(rowId);

      setCollapsedGroups(new Set());




      closeEntityDialogs();
      setQuery('');
    },
    [closeEntityDialogs, dataset, router],
  );

  const handleNewRow = useCallback(() => {
    switch (dataset) {
      case 'lands':
        setIsCreateLandDialogOpen(true);
        break;
      case 'plots':
        setIsCreatePlotDialogOpen(true);
        break;
      case 'customers':
        setIsCreateCustomerDialogOpen(true);
        break;
      case 'contracts':
        setIsCreateContractDialogOpen(true);
        break;
    }
  }, [dataset]);

  const handleRowSaved = useCallback((rowId: string) => {
    hasOpenedFirstRow.current = true;
    setSelectedKeys(new Set());
    setActiveRowId(rowId);

    setCollapsedGroups(new Set());
  }, []);

  const handleRowsDeleted = useCallback((rowIds: string[]) => {
    const deletedIds = new Set(rowIds);

    setSelectedKeys(new Set());
    setActiveRowId(current =>
      current != null && deletedIds.has(current) ? null : current,
    );

    setCollapsedGroups(new Set());
  }, []);

  const groupField = view.grouping;
  const isGrouped = groupField !== 'none';

  const results = useMemo(() => {
    const byFilters = applyFilters(
      filters,
      tableData.rows as unknown as Parameters<typeof applyFilters>[1],
    ) as EntityTableRow[];
    const q = query.trim().toLowerCase();
    const byQuery = q
      ? byFilters.filter(row => row.searchText.toLowerCase().includes(q))
      : byFilters;

    if (sort.length === 0 && !isGrouped) {
      return byQuery;
    }

    const groupRank = isGrouped
      ? new Map(
          tableData.groupOrders[groupField].map((key, index) => [key, index]),
        )
      : null;

    return [...byQuery].sort((a, b) => {
      if (groupRank != null) {
        const cmp =
          (groupRank.get(groupKeyOf(a, groupField)) ??
            Number.MAX_SAFE_INTEGER) -
          (groupRank.get(groupKeyOf(b, groupField)) ??
            Number.MAX_SAFE_INTEGER);
        if (cmp !== 0) {
          return cmp;
        }
      }

      for (const {sortKey, direction} of sort) {
        const av = rowValue(a, sortKey);
        const bv = rowValue(b, sortKey);
        const rank = SORT_RANKS[sortKey];
        let cmp: number;

        if (rank != null) {
          cmp =
            (rank[String(av)] ?? Number.MAX_SAFE_INTEGER) -
            (rank[String(bv)] ?? Number.MAX_SAFE_INTEGER);
        } else if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv;
        } else if (av instanceof Date && bv instanceof Date) {
          cmp = av.getTime() - bv.getTime();
        } else {
          cmp = String(av ?? '').localeCompare(String(bv ?? ''));
        }

        if (cmp !== 0) {
          return direction === 'ascending' ? cmp : -cmp;
        }
      }

      return 0;
    });
  }, [
    applyFilters,
    filters,
    groupField,
    isGrouped,
    query,
    sort,
    tableData.groupOrders,
    tableData.rows,
  ]);

  const pageKey = `${dataset}:${query}:${JSON.stringify(filters)}:${JSON.stringify(sort)}`;
  const [pageState, setPageState] = useState({key: '', page: 1});
  const page = Math.min(pageState.key === pageKey ? pageState.page : 1, Math.max(1, Math.ceil(results.length / PAGE_SIZE)));
  const rows = useMemo(() => results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [results, page]);

  const updateFilters = useCallback(
    (updater: (current: PowerSearchFilter[]) => PowerSearchFilter[]) => {

      setFilters(current => updater(current));
      setPageState({key: '', page: 1});
      setSelectedKeys(new Set());
    },
    [],
  );

  const clearAll = useCallback(() => {
    setFilters([]);
    setQuery('');
    setPageState({key: '', page: 1});
    setSelectedKeys(new Set());

  }, []);

  const refetchData = useCallback(() => {
    const refetchByDataset = {
      lands: refetchLands,
      plots: refetchPlots,
      contracts: refetchContracts,
      customers: refetchCustomers,
    };
    void refetchByDataset[dataset]();
  }, [
    dataset,
    refetchContracts,
    refetchCustomers,
    refetchLands,
    refetchPlots,
  ]);

  const {selectionConfig} = useTableSelectionState({data: rows, idKey: 'id', selectedKeys, setSelectedKeys});
  const selectionPlugin = useTableSelection<EntityTableRow>({
    ...selectionConfig,
    getRowLabel: (item: EntityTableRow) => `${item.id} ${item.summary}`,
    hasRowHighlight: false,
  });
  const sortablePlugin = useTableSortable<EntityTableRow>({
    sort,
    onSortChange: setSort,
    allowUnsortedState: true,
    isMultiSortEnabled: true,
  });
  const stickyPlugin = useTableStickyColumns<EntityTableRow>({
    startKeys: stickyKeys(view.stickyStart, view.columnKeys, false),
    endKeys: stickyKeys(view.stickyEnd, view.columnKeys, true),
  });

  const toggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroups(current => {
      const next = new Set(current);
      if (!next.delete(groupKey)) {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  const groupBy = useCallback(
    (item: EntityTableRow) => groupKeyOf(item, groupField),
    [groupField],
  );

  const getRowKey = useCallback((item: EntityTableRow) => item.id, []);

  const {
    plugin: groupPlugin,
    data: groupedRows,
    idKey: groupRowKey,
  } = useTableGroupedRows<EntityTableRow>({
    data: isGrouped ? rows : NO_ROWS,
    groupBy,
    collapsedGroups,
    onToggleGroup: toggleGroup,
    getRowKey,
    groupOrder: tableData.groupOrders[groupField],
  });

  const isGroupHeaderRow = useCallback(
    (item: EntityTableRow) =>
      groupRowKey(item).startsWith(GROUP_ROW_KEY_PREFIX),
    [groupRowKey],
  );

  const groupedPlugin = useMemo<TablePlugin<EntityTableRow>>(
    () => ({
      ...groupPlugin,
      transformColumns: cols =>
        cols.map(col => {
          const {renderCell} = col;
          return renderCell == null
            ? col
            : {
                ...col,
                renderCell: (item: EntityTableRow) =>
                  isGroupHeaderRow(item) ? null : renderCell(item),
              };
        }),
    }),
    [groupPlugin, isGroupHeaderRow],
  );

  const rowActivationPlugin = useMemo<TablePlugin<EntityTableRow>>(
    () => ({
      transformColumns: cols =>
        cols.map((col, index) =>
          index === 0 && col.key === SELECTION_COLUMN_KEY
            ? {...col, width: pixel(SELECTION_COLUMN_WIDTH)}
            : col,
        ),
      transformBodyRow: (props, item) => {
        if (isGroupHeaderRow(item)) {
          return props;
        }
        const isActive = item.id === activeRowId;
        return {
          ...props,
          htmlProps: {
            ...props.htmlProps,
            tabIndex: 0,
            'aria-current': isActive ? true : undefined,
            onClick: event => {
              if (
                (event.target as HTMLElement).closest(
                  'input, button, a, select, textarea',
                ) != null
              ) {
                return;
              }
              if (item.dataset === 'lands' || item.dataset === 'contracts') router.push(`/${item.dataset}/${item.id}`);
              else setActiveRowId(item.id);
            },
            onKeyDown: event => {
              if (event.target !== event.currentTarget) {
                return;
              }
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (item.dataset === 'lands' || item.dataset === 'contracts') router.push(`/${item.dataset}/${item.id}`);
              else setActiveRowId(item.id);
              }
            },
          },
          xstyle: isActive
            ? [...props.xstyle, styles.clickableRow, styles.activeRow]
            : [...props.xstyle, styles.clickableRow],
        };
      },
    }),
    [activeRowId, isGroupHeaderRow, router],
  );

  const plugins = useMemo<Record<string, TablePlugin<EntityTableRow>>>(
    () => ({
      selection: selectionPlugin,
      sortable: sortablePlugin,
      sticky: stickyPlugin,
      rowActivation: rowActivationPlugin,
      ...(isGrouped ? {grouped: groupedPlugin} : null),
    }),
    [
      selectionPlugin,
      sortablePlugin,
      stickyPlugin,
      rowActivationPlugin,
      isGrouped,
      groupedPlugin,
    ],
  );

  const isCompact = view.density === 'compact';
  const cellLines = isCompact ? 1 : 2;
  const isSpacious = view.density === 'spacious';

  const allColumns: Record<string, TableColumn<EntityTableRow>> = useMemo(() => {
    const label = (key: string) => tableData.columnLabels[key] ?? key;
    const summarySecondary = (item: EntityTableRow) => {
      if (item.dataset === 'contracts') {
        return '';
      }
      if (item.dataset === 'customers') {
        return '';
      }
      return textValue(item, 'location') || textValue(item, 'landLocation');
    };
    const textColumn = (
      key: string,
      width: TableColumn<EntityTableRow>['width'],
    ): TableColumn<EntityTableRow> => ({
      key,
      header: label(key),
      width,
      sortable: true,
      renderCell: item => (
        <Text type="body" maxLines={cellLines}>
          {textValue(item, key) || 'Chưa thiết lập'}
        </Text>
      ),
    });

    return {
      summary: {
        key: 'summary',
        header: label('summary'),
        width: dataset === 'contracts' || dataset === 'customers'
          ? proportional(2, {minWidth: 240})
          : proportional(1, {minWidth: 220}),
        sortable: true,
        renderCell: item => {
          const secondary = summarySecondary(item);
          if (item.dataset === 'contracts' || item.dataset === 'customers') {
            const name = item.dataset === 'contracts' ? textValue(item, 'customer') : item.summary;
            return (
              <HStack gap={3} vAlign="center">
                <StackItem size="fill">
                  <VStack gap={1}>
                    <Text type="body" weight="semibold" maxLines={1}>{name}</Text>
                    {item.dataset === 'contracts' && (
                      <Text type="supporting" color="secondary" maxLines={isCompact ? 1 : 2}>
                        {[textValue(item, 'land'), textValue(item, 'plot')].filter(Boolean).join(' / ')}
                      </Text>
                    )}
                  </VStack>
                </StackItem>
              </HStack>
            );
          }
          return isCompact ? (
            <Text type="body" maxLines={1}>
              {item.summary}
            </Text>
          ) : (
            <HStack gap={3} vAlign="center">
              {isSpacious ? (
                <AspectRatio
                  ratio={4 / 3}
                  fit="center"
                  xstyle={styles.rowMedia}>
                  <Icon icon={ImageIcon} size="sm" color="secondary" />
                </AspectRatio>
              ) : null}
              <VStack gap={0}>
                <Text type="body" maxLines={2}>{item.summary}</Text>
                {secondary !== '' && (
                  <Text type="supporting" color="secondary">
                    {secondary}
                  </Text>
                )}
              </VStack>
            </HStack>
          );
        },
      },
      customer: {
        key: 'customer',
        header: label('customer'),
        width: proportional(1, {minWidth: 180}),
        sortable: true,
        renderCell: item => {
          const customer = textValue(item, 'customer') || item.summary;
          return (
            <HStack gap={2} vAlign="center">
              <Text type="body" maxLines={cellLines}>
                {customer}
              </Text>
            </HStack>
          );
        },
      },
      phone: textColumn('phone', pixel(150)),
      email: textColumn('email', proportional(1, {minWidth: 180})),
      address: textColumn('address', proportional(1, {minWidth: 180})),
      location: textColumn('location', proportional(1, {minWidth: 180})),
      land: textColumn('land', proportional(1, {minWidth: 180})),
      landLocation: textColumn('landLocation', proportional(1, {minWidth: 180})),
      plot: textColumn('plot', pixel(130)),
      plotNumber: textColumn('plotNumber', pixel(120)),
      status: {
        key: 'status',
        header: label('status'),
        width: pixel(140),
        sortable: true,
        renderCell: item => {
          const value = textValue(item, 'status');
          const meta =
            item.dataset === 'contracts'
              ? CONTRACT_STATUS_META[
                  value as keyof typeof CONTRACT_STATUS_META
                ]
              : PLOT_STATUS_META[value as keyof typeof PLOT_STATUS_META];
          return meta == null ? (
            <Text type="body" maxLines={cellLines}>
              {value || 'Chưa thiết lập'}
            </Text>
          ) : (
            <EntityStatus variant={meta.badge} label={meta.label} />
          );
        },
      },
      plotStatus: {
        key: 'plotStatus',
        header: label('plotStatus'),
        width: pixel(140),
        sortable: true,
        renderCell: item => {
          const value = textValue(item, 'plotStatus');
          const meta = PLOT_STATUS_META[value as keyof typeof PLOT_STATUS_META];
          return meta == null ? (
            <Text type="body" maxLines={cellLines}>
              {value || 'Chưa thiết lập'}
            </Text>
          ) : (
            <EntityStatus variant={meta.badge} label={meta.label} />
          );
        },
      },
      paymentFrequency: {
        key: 'paymentFrequency',
        header: label('paymentFrequency'),
        width: pixel(140),
        sortable: true,
        renderCell: item => {
          const value = textValue(item, 'paymentFrequency');
          const meta =
            PAYMENT_FREQUENCY_META[
              value as keyof typeof PAYMENT_FREQUENCY_META
            ];
          return (
            <Text type="body" maxLines={cellLines}>
              {meta?.label ?? 'Chưa thiết lập'}
            </Text>
          );
        },
      },
      rentAmount: {
        key: 'rentAmount',
        header: label('rentAmount'),
        width: pixel(120),
        align: 'end',
        sortable: true,
        renderCell: item => (
          <Text type="body" maxLines={cellLines}>
            {formatMoney(numberValue(item, 'rentAmount'))}
          </Text>
        ),
      },
      depositAmount: {
        key: 'depositAmount',
        header: label('depositAmount'),
        width: pixel(120),
        align: 'end',
        sortable: true,
        renderCell: item => (
          <Text type="body" maxLines={cellLines}>
            {formatMoney(numberValue(item, 'depositAmount'))}
          </Text>
        ),
      },
      nextPaymentDueDate: {
        key: 'nextPaymentDueDate',
        header: label('nextPaymentDueDate'),
        width: pixel(150),
        sortable: {sortKey: 'nextPaymentDueSort'},
        renderCell: item => (
          <Text type="body" maxLines={cellLines}>
            {formatDate(textValue(item, 'nextPaymentDueDate'), true)}
          </Text>
        ),
      },
      areaSqm: {
        key: 'areaSqm',
        header: label('areaSqm'),
        width: pixel(120),
        align: 'end',
        sortable: true,
        renderCell: item => (
          <Text type="body" maxLines={cellLines}>
            {formatArea(numberValue(item, 'areaSqm'))}
          </Text>
        ),
      },
      description: textColumn('description', proportional(1, {minWidth: 240})),
      notes: textColumn('notes', proportional(1, {minWidth: 240})),
      imageCount: {
        key: 'imageCount',
        header: label('imageCount'),
        width: pixel(100),
        align: 'end',
        sortable: true,
        renderCell: item => (
          <Text type="body" maxLines={cellLines}>
            {numberValue(item, 'imageCount').toLocaleString('vi-VN')}
          </Text>
        ),
      },
      startDate: {
        key: 'startDate',
        header: label('startDate'),
        width: pixel(130),
        sortable: {sortKey: 'startOn'},
        renderCell: item => (
          <Text type="body" maxLines={cellLines}>
            {formatDate(textValue(item, 'startDate'), true)}
          </Text>
        ),
      },
      endDate: {
        key: 'endDate',
        header: label('endDate'),
        width: pixel(130),
        sortable: {sortKey: 'endOn'},
        renderCell: item => (
          <Text type="body" maxLines={cellLines}>
            {formatDate(textValue(item, 'endDate'), true)}
          </Text>
        ),
      },
      createdAt: {
        key: 'createdAt',
        header: label('createdAt'),
        width: pixel(130),
        sortable: true,
        renderCell: item => (
          <Text type="body" maxLines={cellLines}>
            {formatDate(item.createdAt, true)}
          </Text>
        ),
      },
      updatedAt: {
        key: 'updatedAt',
        header: label('updatedAt'),
        width: pixel(130),
        sortable: true,
        renderCell: item => (
          <Text type="body" maxLines={cellLines}>
            {formatDate(item.updatedAt, true)}
          </Text>
        ),
      },
    };
  }, [cellLines, dataset, isCompact, isSpacious, tableData.columnLabels]);

  const columns = useMemo(
    () =>
      view.columnKeys
        .filter(key => dataset !== 'customers' || key !== 'updatedAt')
        .map(key => allColumns[key])
        .filter(
          (column): column is TableColumn<EntityTableRow> => column != null,
        ),
    [view.columnKeys, allColumns, dataset],
  );

  const selectedRecords = useMemo(
    () => tableData.rows.filter(row => selectedKeys.has(row.id)),
    [selectedKeys, tableData.rows],
  );
  const selectedLandRecords = useMemo(
    () => selectedRecords.filter(isLandRow),
    [selectedRecords],
  );
  const selectedPlotRecords = useMemo(
    () => selectedRecords.filter(isPlotRow),
    [selectedRecords],
  );
  const selectedCustomerRecords = useMemo(
    () => selectedRecords.filter(isCustomerRow),
    [selectedRecords],
  );
  const selectedCount = selectedKeys.size;
  const isBulkEditDisabled = selectedCount !== 1;
  const isBulkDeleteDisabled = dataset === 'contracts' || selectedCount === 0;
  const bulkEditDisabledMessage =
    selectedCount === 0
      ? `Chọn một ${tableData.singularLabel.toLowerCase()} để chỉnh sửa.`
      : `Chỉ chọn một ${tableData.singularLabel.toLowerCase()} để chỉnh sửa.`;
  const bulkDeleteDisabledMessage =
    dataset === 'contracts'
      ? 'Không thể xóa hợp đồng từ bảng này.'
      : `Chọn ít nhất một ${tableData.singularLabel.toLowerCase()} để xóa.`;
  const activeRow = tableData.rows.find(row => row.id === activeRowId) ?? null;
  const activeLand = isLandRow(activeRow) ? activeRow : null;
  const activePlot = isPlotRow(activeRow) ? activeRow : null;
  const activeCustomer = isCustomerRow(activeRow) ? activeRow : null;
  const activeLandPlots = useMemo(
    () =>
      activeLand == null ? [] : plotsForLandRecord(plots, activeLand),
    [activeLand, plots],
  );
  const activeLandContracts = useMemo(
    () =>
      activeLand == null
        ? []
        : contractsForLandRecord(contractRows, activeLand),
    [activeLand, contractRows],
  );
  const activePlotLand = useMemo(
    () => (activePlot == null ? null : landForPlotRecord(lands, activePlot)),
    [activePlot, lands],
  );
  const activePlotContracts = useMemo(
    () =>
      activePlot == null
        ? []
        : contractsForPlotRecord(contractRows, activePlot),
    [activePlot, contractRows],
  );
  const activeCustomerContracts = useMemo(
    () =>
      activeCustomer == null
        ? []
        : contractsForCustomerRecord(contractRows, activeCustomer),
    [activeCustomer, contractRows],
  );

  const editLand = useCallback((land: LandTableRow) => {
    setEditingLand(land);
  }, []);

  const deleteLand = useCallback((land: LandTableRow) => {
    setDeletingLands([land]);
  }, []);

  const editPlot = useCallback((plot: PlotTableRow) => {
    setEditingPlot(plot);
  }, []);

  const deletePlot = useCallback((plot: PlotTableRow) => {
    setDeletingPlots([plot]);
  }, []);

  const editCustomer = useCallback((customer: CustomerTableRow) => {
    setEditingCustomer(customer);
  }, []);

  const deleteCustomer = useCallback((customer: CustomerTableRow) => {
    setDeletingCustomers([customer]);
  }, []);

  const filterBar = (
    <FilterBar
      filters={filters}
      query={query}
      resultCount={results.length}
      statusOptions={dataset === 'contracts' ? Object.entries(CONTRACT_STATUS_META).map(([value, meta]) => ({value, label: meta.label})) : dataset === 'plots' ? Object.entries(PLOT_STATUS_META).filter(([value]) => value !== 'UNASSIGNED').map(([value, meta]) => ({value, label: meta.label})) : []}
      searchLabel={`Tìm ${tableData.label.toLowerCase()}`}
      searchPlaceholder={tableData.searchPlaceholder}
      onFiltersChange={updateFilters}
      onQueryChange={value => {setQuery(value); setPageState({key: '', page: 1}); setSelectedKeys(new Set());}}
      onClearAll={clearAll}
    />
  );

  const bulkBar = (
    <BulkActionBar
      selectedCount={selectedCount}
      singularLabel={tableData.singularLabel}
      pluralLabel={tableData.label.toLowerCase()}
      isEditDisabled={isBulkEditDisabled}
      editDisabledMessage={bulkEditDisabledMessage}
      isDeleteDisabled={isBulkDeleteDisabled}
      deleteDisabledMessage={bulkDeleteDisabledMessage}
      onEditSelected={() => {
        const [record] = selectedRecords;

        if (isLandRow(record)) {
          setEditingLand(record);
        } else if (isPlotRow(record)) {
          setEditingPlot(record);
        } else if (isCustomerRow(record)) {
          setEditingCustomer(record);
        } else if (isContractRow(record)) {
          setEditingContract(record);
        }
      }}
      onDeleteSelected={() => {
        if (dataset === 'lands') {
          setDeletingLands(selectedLandRecords);
        } else if (dataset === 'plots') {
          setDeletingPlots(selectedPlotRecords);
        } else if (dataset === 'customers') {
          setDeletingCustomers(selectedCustomerRecords);
        }
      }}
      onClearSelection={() => setSelectedKeys(new Set())}
    />
  );

  const detailPanel = activeLand ? (
    <LandDetailPanel
      land={activeLand}
      plots={activeLandPlots}
      contracts={activeLandContracts}
      resizable={detailWidth.props}
      onClose={() => setActiveRowId(null)}
      onSelectPlot={plotId => showDatasetRow('plots', plotId)}
      onSelectContract={contractId => showDatasetRow('contracts', contractId)}
      onEditLand={editLand}
      onDeleteLand={deleteLand}
    />
  ) : activePlot ? (
    <PlotDetailPanel
      plot={activePlot}
      land={activePlotLand}
      contracts={activePlotContracts}
      resizable={detailWidth.props}
      onClose={() => setActiveRowId(null)}
      onSelectLand={landId => showDatasetRow('lands', landId)}
      onSelectContract={contractId => showDatasetRow('contracts', contractId)}
      onEditPlot={editPlot}
      onDeletePlot={deletePlot}
    />
  ) : activeCustomer ? (
    <CustomerDetailPanel
      customer={activeCustomer}
      contracts={activeCustomerContracts}
      resizable={detailWidth.props}
      onClose={() => setActiveRowId(null)}
      onSelectContract={contractId => showDatasetRow('contracts', contractId)}
      onEditCustomer={editCustomer}
      onDeleteCustomer={deleteCustomer}
    />
  ) : undefined;

  const dataErrorMessage =
    dataError instanceof Error ? dataError.message : 'Không thể tải dữ liệu bảng.';

  return (
    <>
      <Layout
        height="fill"
        padding={0}
        xstyle={styles.pageShell}
        end={detailPanel}
        header={
          <LayoutHeader
            hasDivider
            label={`${tableData.label}: bộ lọc và thao tác bảng`}>
            <VStack gap={0} xstyle={styles.headerWrap}>
              {isLoading && (
                <ProgressBar
                  label={tableData.loadingLabel}
                  isLabelHidden
                  isIndeterminate
                  xstyle={styles.progress}
                />
              )}

              <Section
                variant="transparent"
                padding={4}
                xstyle={styles.toolbarContainer}>
                <VStack gap={4}>
                  <HStack gap={3} vAlign="center">
                    <StackItem size="fill">
                      <Heading level={1}>{DATASET_META[dataset].label}</Heading>
                    </StackItem>
                    <Button
                      label={tableData.newButtonLabel}
                      variant="primary"
                      onClick={handleNewRow}
                    />
                  </HStack>

                  {selectedCount > 0 ? bulkBar : filterBar}
                </VStack>
              </Section>
            </VStack>
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={4} label={tableData.layoutLabel}>
            {dataError != null ? (
              <EmptyState
                icon={<Icon icon={Search} size="lg" />}
                title={`Không thể tải ${tableData.label.toLowerCase()}`}
                description={dataErrorMessage}
                actions={<Button label="Thử lại" onClick={refetchData} />}
              />
            ) : isInitialDataLoading ? (
              <LoadingRows columns={columns} density={view.density} />
            ) : results.length === 0 ? (
              <EmptyState
                icon={<Icon icon={Search} size="lg" />}
                title={tableData.emptyTitle}
                description={tableData.emptyDescription}
                actions={
                  <>
                    <Button label="Xóa bộ lọc" onClick={clearAll} />

                  </>
                }
              />
            ) : (
              <Table<EntityTableRow>
                data={isGrouped ? groupedRows : rows}
                columns={columns}
                idKey={isGrouped ? groupRowKey : 'id'}
                density={view.density}
                dividers="rows"
                hasHover
                textOverflow="wrap"
                verticalAlign={dataset === 'contracts' || dataset === 'customers' ? 'middle' : 'top'}
                plugins={plugins}
                rowCount={results.length}
                rowIndexStart={(page - 1) * PAGE_SIZE + 1}
              />
            )}

            {dataError == null && !isInitialDataLoading && results.length > PAGE_SIZE && (
              <Section padding={4}>
                <HStack hAlign="center">
                <Pagination label="Phân trang" page={page} pageSize={PAGE_SIZE} totalItems={results.length}
                  onChange={next => {setPageState({key: pageKey, page: next}); setSelectedKeys(new Set()); setActiveRowId(null);}} />
                </HStack>
              </Section>
            )}
          </LayoutContent>
        }
      />

      {isCreateLandDialogOpen && (
        <CreateLandDialog
          isOpen={isCreateLandDialogOpen}
          onOpenChange={setIsCreateLandDialogOpen}
          onCreated={handleRowSaved}
        />
      )}
      {editingLand != null && (
        <EditLandDialog
          land={editingLand}
          isOpen={editingLand != null}
          onOpenChange={open => !open && setEditingLand(null)}
          onSaved={handleRowSaved}
        />
      )}
      {deletingLands.length > 0 && (
        <DeleteLandsDialog
          lands={deletingLands}
          isOpen={deletingLands.length > 0}
          onOpenChange={open => !open && setDeletingLands([])}
          onDeleted={handleRowsDeleted}
        />
      )}
      {isCreatePlotDialogOpen && (
        <CreatePlotDialog
          lands={lands}
          isOpen={isCreatePlotDialogOpen}
          onOpenChange={setIsCreatePlotDialogOpen}
          onCreated={handleRowSaved}
        />
      )}
      {editingPlot != null && (
        <EditPlotDialog
          plot={editingPlot}
          lands={lands}
          isOpen={editingPlot != null}
          onOpenChange={open => !open && setEditingPlot(null)}
          onSaved={handleRowSaved}
        />
      )}
      {deletingPlots.length > 0 && (
        <DeletePlotsDialog
          plots={deletingPlots}
          isOpen={deletingPlots.length > 0}
          onOpenChange={open => !open && setDeletingPlots([])}
          onDeleted={handleRowsDeleted}
        />
      )}
      {isCreateCustomerDialogOpen && (
        <CreateCustomerDialog
          isOpen={isCreateCustomerDialogOpen}
          onOpenChange={setIsCreateCustomerDialogOpen}
          onCreated={handleRowSaved}
        />
      )}
      {editingCustomer != null && (
        <EditCustomerDialog
          customer={editingCustomer}
          isOpen={editingCustomer != null}
          onOpenChange={open => !open && setEditingCustomer(null)}
          onSaved={handleRowSaved}
        />
      )}
      {deletingCustomers.length > 0 && (
        <DeleteCustomersDialog
          customers={deletingCustomers}
          isOpen={deletingCustomers.length > 0}
          onOpenChange={open => !open && setDeletingCustomers([])}
          onDeleted={handleRowsDeleted}
        />
      )}
      {isCreateContractDialogOpen && (
        <CreateContractDialog
          customers={customers}
          lands={lands}
          plots={plots}
          isOpen={isCreateContractDialogOpen}
          onOpenChange={setIsCreateContractDialogOpen}
          onCreated={id => router.push('/contracts/' + id)}
        />
      )}
      {editingContract != null && (
        <EditContractDialog
          contract={editingContract}
          customers={customers}
          lands={lands}
          plots={plots}
          isOpen={editingContract != null}
          onOpenChange={open => !open && setEditingContract(null)}
          onSaved={handleRowSaved}
        />
      )}
    </>
  );
}
