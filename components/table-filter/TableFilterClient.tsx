'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {DropdownMenu} from '@astryxdesign/core/DropdownMenu';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
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
import {PowerSearch, usePowerSearchConfig} from '@astryxdesign/core/PowerSearch';
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
  BookmarkPlus,
  Check,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';

import {
  CONTRACT_STATUS_META,
  DATASET_KEYS,
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
  createInitialSavedViewsByDataset,
  contractsForCustomer,
  contractsForCustomerRecord,
  contractsForLandRecord,
  contractsForPlotRecord,
  getDatasetInitialFilters,
  getDatasetInitialSort,
  getDatasetInitialView,
  groupKeyOf,
  landForPlotRecord,
  plotsForLand,
  plotsForLandRecord,
  stickyKeys,
  type ContractTableRow,
  type CustomerTableRow,
  type DatasetKey,
  type EntityTableRow,
  type LandTableRow,
  type PlotTableRow,
  type SavedView,
  type TableSortState,
  type TableSearchValue,
  type ViewState,
} from '@/data';
import {useContracts} from '@/hooks/useContract';
import {useCustomers} from '@/hooks/useCustomers';
import {useInfiniteBatches} from '@/hooks/useInfiniteBatches';
import {useLands} from '@/hooks/useLands';
import {usePlots} from '@/hooks/usePlots';
import {formatArea, formatDate, formatMoney} from '@/utils/format';
import {styles} from '@/app/table-filter/styles';
import {BulkActionBar} from './BulkActionBar';
import {ContractDetailPanel} from './ContractDetailPanel';
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
import {PowerSearchModeToggle} from './PowerSearchModeToggle';
import {SavedViewDialogs} from './SavedViewDialogs';
import {SavedViewsBar, SavedViewsToggle} from './SavedViewsBar';
import {ViewOptionsPopover} from './ViewOptionsPopover';

const DATA_PAGE = {page: 1, pageSize: 100};
const DATASET_ICONS: Record<DatasetKey, LucideIcon> = {
  lands: MapIcon,
  plots: LayoutGrid,
  contracts: FileText,
  customers: Users,
};

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

function countLabel(key: DatasetKey, count: number): string {
  const meta = DATASET_META[key];
  return `${count.toLocaleString('en-US')} ${
    count === 1 ? meta.singularLabel : meta.label.toLowerCase()
  }`;
}

export default function TableFilterClient({
  initialDataset = DEFAULT_DATASET_KEY,
}: {
  initialDataset?: DatasetKey;
} = {}) {
  const {
    data: contractsResponse,
    isPending: isContractsPending,
    isFetching: isContractsFetching,
    error: contractsError,
    refetch: refetchContracts,
  } = useContracts(DATA_PAGE);
  const {
    data: landsResponse,
    isPending: isLandsPending,
    isFetching: isLandsFetching,
    error: landsError,
    refetch: refetchLands,
  } = useLands(DATA_PAGE);
  const {
    data: plotsResponse,
    isPending: isPlotsPending,
    isFetching: isPlotsFetching,
    error: plotsError,
    refetch: refetchPlots,
  } = usePlots(DATA_PAGE);
  const {
    data: customersResponse,
    isPending: isCustomersPending,
    isFetching: isCustomersFetching,
    error: customersError,
    refetch: refetchCustomers,
  } = useCustomers(DATA_PAGE);

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

  const [dataset, setDataset] = useState<DatasetKey>(initialDataset);
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
  const datasetCounts = useMemo(
    () => ({
      lands: lands.length,
      plots: plots.length,
      contracts: contracts.length,
      customers: customers.length,
    }),
    [contracts.length, customers.length, lands.length, plots.length],
  );

  const [filters, setFilters] = useState<PowerSearchFilter[]>(() =>
    getDatasetInitialFilters(initialDataset),
  );
  const [isPowerSearch, setIsPowerSearch] = useState(false);
  const [query, setQuery] = useState('');

  const [savedViewsByDataset, setSavedViewsByDataset] = useState(
    createInitialSavedViewsByDataset,
  );
  const savedViews = savedViewsByDataset[dataset];
  const [isSavedViewsBarOpen, setIsSavedViewsBarOpen] = useState(false);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(
    null,
  );
  const [creatingName, setCreatingName] = useState<string | null>(null);
  const [editing, setEditing] = useState<SavedView | null>(null);
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
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const hasOpenedFirstRow = useRef(false);

  const detailWidth = useResizable({
    defaultSize: 380,
    minSizePx: 320,
    maxSizePx: 560,
  });

  const [sort, setSort] = useState<TableSortState>(() =>
    getDatasetInitialSort(initialDataset),
  );

  const [view, setView] = useState<ViewState>(() =>
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

  const {config, applyFilters} = usePowerSearchConfig(
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

  const changeDataset = useCallback(
    (next: DatasetKey) => {
      if (next === dataset) {
        return;
      }
      hasOpenedFirstRow.current = false;
      setDataset(next);
      setFilters(getDatasetInitialFilters(next));
      setSort(getDatasetInitialSort(next));
      setView(getDatasetInitialView(next));
      setSelectedKeys(new Set());
      setActiveRowId(null);
      setActiveSavedViewId(null);
      setCollapsedGroups(new Set());
      setIsPowerSearch(false);
      setIsSavedViewsBarOpen(false);
      setCreatingName(null);
      setEditing(null);
      closeEntityDialogs();
      setQuery('');
    },
    [closeEntityDialogs, dataset],
  );

  const showDatasetRow = useCallback(
    (next: DatasetKey, rowId: string) => {
      if (next !== dataset) {
        hasOpenedFirstRow.current = true;
        setDataset(next);
        setFilters(getDatasetInitialFilters(next));
        setSort(getDatasetInitialSort(next));
        setView(getDatasetInitialView(next));
      }
      setSelectedKeys(new Set());
      setActiveRowId(rowId);
      setActiveSavedViewId(null);
      setCollapsedGroups(new Set());
      setIsPowerSearch(false);
      setIsSavedViewsBarOpen(false);
      setCreatingName(null);
      setEditing(null);
      closeEntityDialogs();
      setQuery('');
    },
    [closeEntityDialogs, dataset],
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
    setActiveSavedViewId(null);
    setCollapsedGroups(new Set());
  }, []);

  const handleRowsDeleted = useCallback((rowIds: string[]) => {
    const deletedIds = new Set(rowIds);

    setSelectedKeys(new Set());
    setActiveRowId(current =>
      current != null && deletedIds.has(current) ? null : current,
    );
    setActiveSavedViewId(null);
    setCollapsedGroups(new Set());
  }, []);

  const datasetMenuItems = useMemo(
    () =>
      DATASET_KEYS.map(key => ({
        id: key,
        label: DATASET_META[key].label,
        description: `${DATASET_META[key].description} - ${countLabel(
          key,
          datasetCounts[key],
        )}`,
        icon: <Icon icon={DATASET_ICONS[key]} size="sm" />,
        endContent:
          key === dataset ? <Icon icon={Check} size="sm" /> : undefined,
        onClick: () => changeDataset(key),
      })),
    [changeDataset, dataset, datasetCounts],
  );

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

  const batchGroupKey = useMemo(
    () =>
      isGrouped
        ? (row: EntityTableRow) => groupKeyOf(row, groupField)
        : null,
    [groupField, isGrouped],
  );

  const {
    data: rows,
    hasNext,
    isLoadingNext,
    loadNext,
  } = useInfiniteBatches(results, PAGE_SIZE, batchGroupKey);

  const sentinelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (sentinel == null || !hasNext) {
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          loadNext(PAGE_SIZE);
        }
      },
      {rootMargin: '240px'},
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNext, loadNext]);

  const updateFilters = useCallback(
    (updater: (current: PowerSearchFilter[]) => PowerSearchFilter[]) => {
      setActiveSavedViewId(null);
      setFilters(current => updater(current));
    },
    [],
  );

  const clearAll = useCallback(() => {
    setFilters([]);
    setQuery('');
    setActiveSavedViewId(null);
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

  const applySavedView = useCallback((saved: SavedView | null) => {
    setActiveSavedViewId(saved?.id ?? null);
    setFilters(saved ? [...saved.filters] : []);
    setIsPowerSearch(false);
    if (saved == null) {
      return;
    }
    setView({...saved.view, columnKeys: [...saved.view.columnKeys]});
    setCollapsedGroups(new Set());
  }, []);

  const createSavedView = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      const id = `saved-${Date.now()}`;
      setSavedViewsByDataset(current => ({
        ...current,
        [dataset]: [
          ...current[dataset],
          {
            id,
            name: trimmed,
            filters: [...filters],
            view: {...view, columnKeys: [...view.columnKeys]},
          },
        ],
      }));
      setActiveSavedViewId(id);
      setCreatingName(null);
    },
    [dataset, filters, view],
  );

  const saveEditedView = useCallback(
    (edited: SavedView) => {
      setSavedViewsByDataset(current => ({
        ...current,
        [dataset]: current[dataset].map(saved =>
          saved.id === edited.id ? {...saved, ...edited} : saved,
        ),
      }));
      setEditing(null);
    },
    [dataset],
  );

  const deleteSavedView = useCallback(
    (id: string) => {
      setSavedViewsByDataset(current => ({
        ...current,
        [dataset]: current[dataset].filter(saved => saved.id !== id),
      }));
      setActiveSavedViewId(current => (current === id ? null : current));
      setEditing(null);
    },
    [dataset],
  );

  const updateView = useCallback(
    (patch: (current: ViewState) => ViewState) => {
      const next = patch(view);
      if (next.grouping !== view.grouping) {
        setCollapsedGroups(new Set());
      }
      setView(next);
      setActiveSavedViewId(null);
    },
    [view],
  );

  const {selectionConfig} = useTableSelectionState({
    data: rows,
    idKey: 'id',
    selectedKeys,
    setSelectedKeys,
  });
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

  useEffect(() => {
    if (hasOpenedFirstRow.current) {
      return;
    }
    const first = (isGrouped ? groupedRows : rows).find(
      row => !isGroupHeaderRow(row),
    );
    if (first == null) {
      return;
    }
    const firstId = first.id;
    const timer = setTimeout(() => {
      hasOpenedFirstRow.current = true;
      setActiveRowId(current => current ?? firstId);
    }, 0);
    return () => clearTimeout(timer);
  }, [dataset, groupedRows, isGroupHeaderRow, isGrouped, rows]);

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
              setActiveRowId(item.id);
            },
            onKeyDown: event => {
              if (event.target !== event.currentTarget) {
                return;
              }
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActiveRowId(item.id);
              }
            },
          },
          xstyle: isActive
            ? [...props.xstyle, styles.clickableRow, styles.activeRow]
            : [...props.xstyle, styles.clickableRow],
        };
      },
    }),
    [activeRowId, isGroupHeaderRow],
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
  const cellLines = isCompact ? 1 : 0;
  const isSpacious = view.density === 'spacious';

  const allColumns: Record<string, TableColumn<EntityTableRow>> = useMemo(() => {
    const label = (key: string) => tableData.columnLabels[key] ?? key;
    const summarySecondary = (item: EntityTableRow) => {
      if (item.dataset === 'contracts') {
        return textValue(item, 'contractId');
      }
      if (item.dataset === 'customers') {
        return textValue(item, 'email') || textValue(item, 'phone');
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
          {textValue(item, key) || 'Not set'}
        </Text>
      ),
    });

    return {
      summary: {
        key: 'summary',
        header: label('summary'),
        width: proportional(2, {minWidth: 260}),
        sortable: true,
        renderCell: item => {
          const secondary = summarySecondary(item);
          return isCompact ? (
            <Text type="body" maxLines={1}>
              {item.summary}
            </Text>
          ) : (
            <HStack gap={3} vAlign="center">
              {isSpacious && item.dataset !== 'customers' ? (
                <AspectRatio
                  ratio={4 / 3}
                  fit="center"
                  xstyle={styles.rowMedia}>
                  <Icon icon={ImageIcon} size="sm" color="secondary" />
                </AspectRatio>
              ) : null}
              <VStack gap={0}>
                <Text type="body">{item.summary}</Text>
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
              <Avatar name={customer} size="sm" />
              <Text type="body" maxLines={cellLines}>
                {customer}
              </Text>
            </HStack>
          );
        },
      },
      phone: textColumn('phone', pixel(150)),
      email: textColumn('email', proportional(1, {minWidth: 220})),
      address: textColumn('address', proportional(1, {minWidth: 240})),
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
              {value || 'Not set'}
            </Text>
          ) : (
            <Badge variant={meta.badge} label={meta.label} />
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
              {value || 'Not set'}
            </Text>
          ) : (
            <Badge variant={meta.badge} label={meta.label} />
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
              {meta?.label ?? 'Not set'}
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
            {numberValue(item, 'imageCount').toLocaleString('en-US')}
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
  }, [cellLines, isCompact, isSpacious, tableData.columnLabels]);

  const columns = useMemo(
    () =>
      view.columnKeys
        .map(key => allColumns[key])
        .filter(
          (column): column is TableColumn<EntityTableRow> => column != null,
        ),
    [view.columnKeys, allColumns],
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
      ? `Select one ${tableData.singularLabel.toLowerCase()} to edit.`
      : `Select only one ${tableData.singularLabel.toLowerCase()} to edit.`;
  const bulkDeleteDisabledMessage =
    dataset === 'contracts'
      ? 'Contracts cannot be deleted from this table.'
      : `Select at least one ${tableData.singularLabel.toLowerCase()} to delete.`;
  const activeRow = tableData.rows.find(row => row.id === activeRowId) ?? null;
  const activeContract = isContractRow(activeRow) ? activeRow : null;
  const activeLand = isLandRow(activeRow) ? activeRow : null;
  const activePlot = isPlotRow(activeRow) ? activeRow : null;
  const activeCustomer = isCustomerRow(activeRow) ? activeRow : null;
  const relatedContracts = useMemo(
    () =>
      activeContract == null
        ? []
        : contractsForCustomer(contractRows, activeContract),
    [activeContract, contractRows],
  );
  const landPlots = useMemo(
    () => (activeContract == null ? [] : plotsForLand(plots, activeContract)),
    [activeContract, plots],
  );
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

  const editContract = useCallback((contract: ContractTableRow) => {
    setEditingContract(contract);
  }, []);

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
      isPowerSearch={isPowerSearch}
      resultCount={results.length}
      filterFields={tableData.filterFields}
      multiFilterFields={tableData.multiFilterFields}
      presetFilters={tableData.presetFilters}
      rangeFilter={tableData.rangeFilter}
      searchLabel={`Search ${tableData.label.toLowerCase()}`}
      searchPlaceholder={tableData.searchPlaceholder}
      onFiltersChange={updateFilters}
      onQueryChange={setQuery}
      onPowerSearchChange={setIsPowerSearch}
      onClearAll={clearAll}
    />
  );

  const savedViewsBar = (
    <SavedViewsBar
      savedViews={savedViews}
      activeSavedViewId={activeSavedViewId}
      onApplySavedView={applySavedView}
      onEditActiveView={() => {
        const found = savedViews.find(saved => saved.id === activeSavedViewId);
        if (found) {
          setEditing({...found});
        }
      }}
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

  const detailPanel = activeContract ? (
    <ContractDetailPanel
      contract={activeContract}
      relatedContracts={relatedContracts}
      landPlots={landPlots}
      resizable={detailWidth.props}
      onClose={() => setActiveRowId(null)}
      onSelectContract={contractId => showDatasetRow('contracts', contractId)}
      onEditContract={editContract}
    />
  ) : activeLand ? (
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
    dataError instanceof Error ? dataError.message : 'Could not load table data.';

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
            label={`${tableData.label} filters and table actions`}>
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
                      <DropdownMenu
                        button={{
                          label: tableData.label,
                          variant: 'ghost',
                          size: 'lg',
                        }}
                        hasChevron
                        menuWidth={260}
                        placement="below"
                        alignment="start"
                        items={datasetMenuItems}
                      />
                    </StackItem>
                    <Button
                      label={tableData.newButtonLabel}
                      variant="primary"
                      onClick={handleNewRow}
                    />
                  </HStack>

                  {selectedCount > 0 ? (
                    bulkBar
                  ) : (
                    <HStack gap={3} vAlign="center" wrap="wrap">
                      <StackItem size="fill" xstyle={styles.toolbarPrimary}>
                        {isPowerSearch ? (
                          <PowerSearch
                            config={config}
                            filters={filters}
                            onChange={next => updateFilters(() => [...next])}
                            placeholder={tableData.powerSearchPlaceholder}
                            resultCount={results.length}
                          />
                        ) : isSavedViewsBarOpen ? (
                          savedViewsBar
                        ) : (
                          filterBar
                        )}
                      </StackItem>

                      <HStack gap={3} vAlign="center" xstyle={styles.toolbarEnd}>
                        {!isSavedViewsBarOpen && (
                          <>
                            {isPowerSearch && (
                              <PowerSearchModeToggle
                                isPowerSearch={isPowerSearch}
                                onChange={setIsPowerSearch}
                              />
                            )}

                            <ViewOptionsPopover
                              view={view}
                              allColumnKeys={tableData.allColumnKeys}
                              defaultColumnKeys={tableData.defaultColumnKeys}
                              columnLabels={tableData.columnLabels}
                              lockedColumnKey={tableData.lockedColumnKey}
                              lockedColumnMessage={
                                tableData.lockedColumnMessage
                              }
                              groupingOptions={tableData.groupingOptions}
                              onViewChange={updateView}
                            />

                            <IconButton
                              label="Create saved view"
                              tooltip="Create saved view"
                              variant="ghost"
                              size="sm"
                              icon={<Icon icon={BookmarkPlus} size="sm" />}
                              onClick={() => setCreatingName('')}
                            />
                          </>
                        )}

                        <SavedViewsToggle
                          isOpen={isSavedViewsBarOpen}
                          onChange={next => {
                            setIsSavedViewsBarOpen(next);
                            if (next) {
                              setIsPowerSearch(false);
                            }
                          }}
                        />
                      </HStack>
                    </HStack>
                  )}
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
                title={`Could not load ${tableData.label.toLowerCase()}`}
                description={dataErrorMessage}
                actions={<Button label="Retry" onClick={refetchData} />}
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
                    <Button label="Clear all" onClick={clearAll} />
                    <Button
                      label="Power search"
                      variant="secondary"
                      onClick={() => setIsPowerSearch(true)}
                    />
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
                verticalAlign="top"
                plugins={plugins}
                rowCount={results.length}
              />
            )}

            {dataError == null &&
              !isInitialDataLoading &&
              results.length > 0 &&
              (hasNext ? (
                <VStack ref={sentinelRef} gap={0} minHeight={56}>
                  {isLoadingNext && (
                    <LoadingRows columns={columns} density={view.density} />
                  )}
                </VStack>
              ) : (
                results.length > PAGE_SIZE && (
                  <VStack
                    gap={0}
                    minHeight={56}
                    vAlign="center"
                    hAlign="center">
                    <Text type="supporting" color="secondary">
                      All {results.length} {tableData.label.toLowerCase()}{' '}
                      loaded
                    </Text>
                  </VStack>
                )
              ))}
          </LayoutContent>
        }
      />

      <SavedViewDialogs
        creatingName={creatingName}
        editing={editing}
        view={view}
        filters={filters}
        allColumnKeys={tableData.allColumnKeys}
        groupingOptions={tableData.groupingOptions}
        setCreatingName={setCreatingName}
        setEditing={setEditing}
        onCreate={createSavedView}
        onSaveEdited={saveEditedView}
        onDelete={deleteSavedView}
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
          onCreated={handleRowSaved}
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
