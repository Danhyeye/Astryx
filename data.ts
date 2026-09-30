import type { FieldDefinition, PowerSearchFilter } from '@astryxdesign/core/PowerSearch';

import type { Contract, ContractStatus, PaymentFrequency } from './types/contract';
import type { Customer } from './types/customer';
import type { Images } from './types/image';
import type { Land } from './types/land';
import type { Plot, Status as PlotStatus } from './types/plot';

export {
  MONTHS,
  formatArea,
  formatDate,
  formatDueDay,
  formatMoney,
  formatNumber,
  formatRangeLabel,
  formatSelectedOptionValue,
} from './utils/format.ts';

export type DatasetKey = 'lands' | 'plots' | 'contracts' | 'customers';
export type PlotStatusValue = PlotStatus | 'UNASSIGNED';
export type TableSearchValue =
  | string
  | number
  | boolean
  | Date
  | readonly string[];

export const DATASET_KEYS: readonly DatasetKey[] = [
  'lands',
  'plots',
  'contracts',
  'customers',
];

export const DEFAULT_DATASET_KEY: DatasetKey = 'lands';

export const DATASET_META: Record<
  DatasetKey,
  {
    label: string;
    href: string;
    singularLabel: string;
    description: string;
  }
> = {
  lands: {
    href: '/lands',
    label: 'Khu đất',
    singularLabel: 'khu đất',
    description: 'Khu đất đã đăng ký',
  },
  plots: {
    href: '/plots',
    label: 'Lô đất',
    singularLabel: 'lô đất',
    description: 'Lô đất đã phân chia',
  },
  contracts: {
    href: '/contracts',
    label: 'Hợp đồng',
    singularLabel: 'hợp đồng',
    description: 'Hợp đồng cho thuê của khách hàng',
  },
  customers: {
    href: '/customers',
    label: 'Khách hàng',
    singularLabel: 'khách hàng',
    description: 'Hồ sơ khách hàng',
  },
};

export type EntityTableRow = {
  id: string;
  dataset: DatasetKey;
  summary: string;
  searchText: string;
  createdAt: string;
  updatedAt: string;
};

export type ContractTableRow = EntityTableRow & {
  dataset: 'contracts';
  id: string;
  contractId: string;
  summary: string;
  customer: string;
  customerId: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  land: string;
  landId: string;
  landLocation: string;
  plot: string;
  plotId: string;
  plotIds: string[];
  status: ContractStatus;
  plotStatus: PlotStatusValue;
  paymentFrequency: PaymentFrequency;
  hasPayments?: boolean;
  payments?: Contract['payments'];
  rentAmount: number;
  depositAmount: number;
  dueDay: number;
  paymentDueDay: number;
  nextPaymentDueDate: string;
  nextPaymentDueOn: Date;
  nextPaymentDueSort: number;
  startDate: string;
  startOn: Date;
  endDate: string;
  endOn: Date;
  leaseDurationMonths: number;
  areaSqm: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type LandTableRow = EntityTableRow & {
  dataset: 'lands';
  name: string;
  location: string;
  areaSqm: number;
  description: string;
  images: Images[];
  imageCount: number;
};

export type PlotTableRow = EntityTableRow & {
  dataset: 'plots';
  plot: string;
  plotNumber: string;
  land: string;
  landId: string;
  landLocation: string;
  status: PlotStatus;
  rentalStatus?: PlotStatus | 'PENDING';
  areaSqm: number;
  description: string;
  images: Images[];
  imageCount: number;
};

export type CustomerTableRow = EntityTableRow & {
  dataset: 'customers';
  customer: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export const CONTRACT_STATUS_META: Record<
  ContractStatus,
  {
    label: string;
    badge: 'neutral' | 'green' | 'red';
  }
> = {
  PENDING: {label: 'Chờ hiệu lực', badge: 'neutral'},
  ACTIVE: {label: 'Đang hiệu lực', badge: 'green'},
  COMPLETED: {label: 'Đã hoàn tất', badge: 'neutral'},
  CANCELLED: {label: 'Đã hủy', badge: 'red'},
};

export const STATUS_META = CONTRACT_STATUS_META;

export const PLOT_STATUS_META: Record<
  PlotStatusValue,
  {
    label: string;
    badge: 'neutral' | 'blue' | 'green';
  }
> = {
  AVAILABLE: {label: 'Còn trống', badge: 'green'},
  RENTED: {label: 'Đang cho thuê', badge: 'blue'},
  SOLD: {label: 'Đã bán', badge: 'neutral'},
  UNASSIGNED: {label: 'Chưa có lô đất', badge: 'neutral'},
};

export const PAYMENT_FREQUENCY_META: Record<
  PaymentFrequency,
  {
    label: string;
  }
> = {
  MONTHLY: {label: 'Hằng tháng'},
  QUARTERLY: {label: 'Hằng quý'},
  YEARLY: {label: 'Hằng năm'},
  CUSTOM: {label: 'Tùy chỉnh'},
};

export const VALUE_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    (Object.keys(CONTRACT_STATUS_META) as ContractStatus[]).map(key => [
      key,
      CONTRACT_STATUS_META[key].label,
    ]),
  ),
  ...Object.fromEntries(
    (Object.keys(PLOT_STATUS_META) as PlotStatusValue[]).map(key => [
      key,
      PLOT_STATUS_META[key].label,
    ]),
  ),
  ...Object.fromEntries(
    (Object.keys(PAYMENT_FREQUENCY_META) as PaymentFrequency[]).map(key => [
      key,
      PAYMENT_FREQUENCY_META[key].label,
    ]),
  ),
};

const CONTRACT_STATUS_ORDER: ContractStatus[] = [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
];
const PLOT_STATUS_ORDER: PlotStatusValue[] = [
  'AVAILABLE',
  'RENTED',
  'SOLD',
  'UNASSIGNED',
];
const PAYMENT_FREQUENCY_ORDER: PaymentFrequency[] = [
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'CUSTOM',
];

const NO_CUSTOMER = 'Chưa có khách hàng';
const NO_LAND = 'Chưa có khu đất';
const NO_PLOT = 'Chưa có lô đất';
const INVALID_DATE_SORT = Number.MAX_SAFE_INTEGER;

function parseDateSort(value: string | null | undefined): number {
  if (value == null || value === '') {
    return INVALID_DATE_SORT;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? INVALID_DATE_SORT : parsed;
}

function parseDate(value: string | null | undefined): Date {
  const parsed = parseDateSort(value);
  return new Date(parsed === INVALID_DATE_SORT ? 0 : parsed);
}

function first<T>(items: readonly T[] | null | undefined): T | null {
  return items?.[0] ?? null;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(
    new Set(
      Array.from(values)
        .map(value => value.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
}

function toOption(value: string) {
  return {value, label: value};
}

export function buildContractRows(
  contracts: readonly Contract[],
): ContractTableRow[] {
  return contracts.map(contract => {
    const customer = first(contract.customers);
    const plot = first(contract.plots);
    const land = first(contract.lands) ?? first(plot?.lands);
    const customerName = customer?.name || NO_CUSTOMER;
    const landName = land?.name || NO_LAND;
    const plotName = contract.plots.length ? contract.plots.map(plot => `Lô đất ${plot.plot_number}`).join(', ') : NO_PLOT;
    const plotStatus = plot?.status ?? 'UNASSIGNED';
    const nextPaymentDueSort = parseDateSort(contract.next_payment_due_date);

    return {
      id: contract.id,
      dataset: 'contracts',
      contractId: contract.id,
      summary: `${customerName} - ${landName}${contract.plots.length ? ` / ${plotName}` : ''}`,
      searchText: [
        contract.id,
        customerName,
        customer?.phone ?? '',
        customer?.email ?? '',
        customer?.address ?? '',
        landName,
        land?.location ?? '',
        plotName,
        contract.notes,
      ].join(' '),
      customer: customerName,
      customerId: customer?.id ?? '',
      customerPhone: customer?.phone ?? '',
      customerEmail: customer?.email ?? '',
      customerAddress: customer?.address ?? '',
      land: landName,
      landId: land?.id ?? '',
      landLocation: land?.location ?? '',
      plot: plotName,
      plotId: plot?.id ?? '',
      plotIds: contract.plots.map(plot => plot.id),
      status: contract.status,
      plotStatus,
      paymentFrequency: contract.payment_frequency,
      hasPayments: (contract.payments?.length ?? 0) > 0,
      payments: contract.payments,
      rentAmount: contract.rent_amount,
      depositAmount: contract.deposit_amount,
      dueDay: contract.due_day,
      paymentDueDay: contract.payment_due_day,
      nextPaymentDueDate: contract.next_payment_due_date,
      nextPaymentDueOn: parseDate(contract.next_payment_due_date),
      nextPaymentDueSort,
      startDate: contract.start_date,
      startOn: parseDate(contract.start_date),
      endDate: contract.end_date,
      endOn: parseDate(contract.end_date),
      leaseDurationMonths: contract.lease_duration_months,
      areaSqm: contract.plots.length ? contract.plots.reduce((sum, plot) => sum + plot.area_sqm, 0) : land?.area_sqm ?? 0,
      notes: contract.notes,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
    };
  });
}

export function buildLandRows(lands: readonly Land[]): LandTableRow[] {
  return lands.map(land => ({
    id: land.id,
    dataset: 'lands',
    summary: land.name,
    searchText: [
      land.name,
      land.location,
      land.description,
      String(land.area_sqm),
    ].join(' '),
    createdAt: land.created_at,
    updatedAt: land.updated_at,
    name: land.name,
    location: land.location,
    areaSqm: land.area_sqm,
    description: land.description,
    images: land.images,
    imageCount: land.images.length,
  }));
}

export function buildPlotRows(plots: readonly Plot[]): PlotTableRow[] {
  return plots.map(plot => {
    const land = first(plot.lands);
    const landName = land?.name || NO_LAND;
    const plotName = `Lô đất ${plot.plot_number}`;

    return {
      id: plot.id,
      dataset: 'plots',
      summary: `${landName} / ${plotName}`,
      searchText: [
        plotName,
        plot.plot_number,
        landName,
        land?.location ?? '',
        plot.status,
        plot.description,
      ].join(' '),
      createdAt: plot.created_at,
      updatedAt: plot.updated_at,
      plot: plotName,
      plotNumber: plot.plot_number,
      land: landName,
      landId: plot.land_id,
      landLocation: land?.location ?? '',
      status: plot.status,
      areaSqm: plot.area_sqm,
      description: plot.description,
      images: plot.images,
      imageCount: plot.images.length,
    };
  });
}

export function buildCustomerRows(
  customers: readonly Customer[],
): CustomerTableRow[] {
  return customers.map(customer => ({
    id: customer.id,
    dataset: 'customers',
    summary: customer.name,
    searchText: [
      customer.name,
      customer.phone,
      customer.email,
      customer.address,
      customer.notes,
    ].join(' '),
    createdAt: customer.created_at,
    updatedAt: customer.updated_at,
    customer: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    notes: customer.notes,
  }));
}

export interface FilterField {
  key: string;
  label: string;
  operator: string;
  operatorLabel: string;
  valueType: 'enum' | 'integer';
  options: ReadonlyArray<{value: string; label: string}>;
}

export interface MultiFilterField {
  key: string;
  label: string;
  options: ReadonlyArray<{value: string; label: string}>;
}

export interface PresetFilter {
  key: string;
  label: string;
  filter: PowerSearchFilter;
}

export interface RangeFilterConfig {
  field: string;
  label: string;
  min: number;
  max: number;
  step: number;
  valueKind: 'money' | 'area';
}

export const FILTER_FIELDS: readonly FilterField[] = [
  {
    key: 'paymentFrequency',
    label: 'Chu kỳ',
    operator: 'is',
    operatorLabel: 'is',
    valueType: 'enum',
    options: PAYMENT_FREQUENCY_ORDER.map(value => ({
      value,
      label: PAYMENT_FREQUENCY_META[value].label,
    })),
  },
];

export function createMultiFilterFields({
  customerNames = [],
  landNames = [],
}: {
  customerNames?: readonly string[];
  landNames?: readonly string[];
} = {}): MultiFilterField[] {
  return [
    {
      key: 'status',
      label: 'Trạng thái',
      options: CONTRACT_STATUS_ORDER.map(value => ({
        value,
        label: CONTRACT_STATUS_META[value].label,
      })),
    },
    {
      key: 'plotStatus',
      label: 'Trạng thái lô đất',
      options: PLOT_STATUS_ORDER.map(value => ({
        value,
        label: PLOT_STATUS_META[value].label,
      })),
    },
    {
      key: 'customer',
      label: 'Khách hàng',
      options: uniqueSorted(customerNames).map(toOption),
    },
    {
      key: 'land',
      label: 'Khu đất',
      options: uniqueSorted(landNames).map(toOption),
    },
  ];
}

export const MULTI_FILTER_FIELDS = createMultiFilterFields();

export const PRESET_FILTERS: readonly PresetFilter[] = [
  {
    key: 'active',
    label: 'Đang hiệu lực',
    filter: {
      field: 'status',
      operator: 'is',
      value: {type: 'enum', value: 'ACTIVE'},
    },
  },
];

export const RENT_MIN = 0;
export const DEFAULT_RENT_MAX = 10_000;
export const RENT_STEP = 100;
export const AREA_MIN = 0;
export const DEFAULT_AREA_MAX = 10_000;
export const AREA_STEP = 100;

export function getRentMax(rows: readonly ContractTableRow[]): number {
  const highestRent = Math.max(RENT_STEP, ...rows.map(row => row.rentAmount));
  return Math.max(
    RENT_STEP,
    Math.ceil(highestRent / RENT_STEP) * RENT_STEP,
  );
}

type AreaTableRow = EntityTableRow & {
  areaSqm?: number;
};

export function getAreaMax(rows: readonly AreaTableRow[]): number {
  const highestArea = Math.max(
    AREA_STEP,
    ...rows.map(row =>
      typeof row.areaSqm === 'number' ? row.areaSqm : AREA_STEP,
    ),
  );
  return Math.max(
    AREA_STEP,
    Math.ceil(highestArea / AREA_STEP) * AREA_STEP,
  );
}

export function createFieldDefs({
  customerNames = [],
  landNames = [],
}: {
  customerNames?: readonly string[];
  landNames?: readonly string[];
} = {}): FieldDefinition[] {
  return [
    {key: 'summary', type: 'string', label: 'Hợp đồng'},
    {
      key: 'customer',
      type: 'enum',
      label: 'Khách hàng',
      enumValues: uniqueSorted(customerNames).map(toOption),
    },
    {
      key: 'land',
      type: 'enum',
      label: 'Khu đất',
      enumValues: uniqueSorted(landNames).map(toOption),
    },
    {
      key: 'plot',
      type: 'string',
      label: 'Lô đất',
    },
    {
      key: 'status',
      type: 'enum',
      label: 'Trạng thái hợp đồng',
      enumValues: CONTRACT_STATUS_ORDER.map(value => ({
        value,
        label: CONTRACT_STATUS_META[value].label,
      })),
    },
    {
      key: 'plotStatus',
      type: 'enum',
      label: 'Trạng thái lô đất',
      enumValues: PLOT_STATUS_ORDER.map(value => ({
        value,
        label: PLOT_STATUS_META[value].label,
      })),
    },
    {
      key: 'paymentFrequency',
      type: 'enum',
      label: 'Chu kỳ thanh toán',
      enumValues: PAYMENT_FREQUENCY_ORDER.map(value => ({
        value,
        label: PAYMENT_FREQUENCY_META[value].label,
      })),
    },
    {key: 'rentAmount', type: 'number', label: 'Tiền thuê'},
    {key: 'depositAmount', type: 'number', label: 'Tiền đặt cọc'},
    {key: 'nextPaymentDueOn', type: 'date', label: 'Kỳ chưa thanh toán gần nhất'},
    {key: 'startOn', type: 'date', label: 'Ngày bắt đầu'},
    {key: 'endOn', type: 'date', label: 'Ngày kết thúc'},
  ];
}

export const fieldDefs = createFieldDefs();

function createLandFieldDefs(locations: readonly string[]): FieldDefinition[] {
  return [
    {key: 'summary', type: 'string', label: 'Khu đất'},
    {
      key: 'location',
      type: 'enum',
      label: 'Vị trí',
      enumValues: uniqueSorted(locations).map(toOption),
    },
    {key: 'areaSqm', type: 'number', label: 'Diện tích'},
    {key: 'description', type: 'string', label: 'Mô tả'},
  ];
}

function createPlotFieldDefs(landNames: readonly string[]): FieldDefinition[] {
  return [
    {key: 'summary', type: 'string', label: 'Lô đất'},
    {key: 'plot', type: 'string', label: 'Lô đất'},
    {
      key: 'land',
      type: 'enum',
      label: 'Khu đất',
      enumValues: uniqueSorted(landNames).map(toOption),
    },
    {
      key: 'status',
      type: 'enum',
      label: 'Trạng thái',
      enumValues: PLOT_STATUS_ORDER.filter(
        status => status !== 'UNASSIGNED',
      ).map(value => ({
        value,
        label: PLOT_STATUS_META[value].label,
      })),
    },
    {key: 'areaSqm', type: 'number', label: 'Diện tích'},
    {key: 'description', type: 'string', label: 'Mô tả'},
  ];
}

function createCustomerFieldDefs(): FieldDefinition[] {
  return [
    {key: 'summary', type: 'string', label: 'Khách hàng'},
    {key: 'phone', type: 'string', label: 'Số điện thoại'},
    {key: 'email', type: 'string', label: 'Email'},
    {key: 'address', type: 'string', label: 'Địa chỉ'},
    {key: 'notes', type: 'string', label: 'Ghi chú'},
  ];
}

function createLocationFilterFields(
  locations: readonly string[],
): MultiFilterField[] {
  const options = uniqueSorted(locations).map(toOption);
  return options.length === 0
    ? []
    : [
        {
          key: 'location',
          label: 'Vị trí',
          options,
        },
      ];
}

function createPlotFilterFields(
  landNames: readonly string[],
): MultiFilterField[] {
  return [
    {
      key: 'status',
      label: 'Trạng thái',
      options: PLOT_STATUS_ORDER.filter(status => status !== 'UNASSIGNED').map(
        value => ({
          value,
          label: PLOT_STATUS_META[value].label,
        }),
      ),
    },
    {
      key: 'land',
      label: 'Khu đất',
      options: uniqueSorted(landNames).map(toOption),
    },
  ];
}

export type ViewSection = 'columns' | 'density' | 'sticky' | 'grouping';
export type Density = 'compact' | 'balanced' | 'spacious';
export type StickyEdge = 'none' | 'one' | 'two';
export type GroupField =
  | 'none'
  | 'status'
  | 'plotStatus'
  | 'paymentFrequency'
  | 'customer'
  | 'land'
  | 'location';

export const VIEW_SECTIONS: ReadonlyArray<{
  key: ViewSection;
  label: string;
  title: string;
}> = [
  {key: 'columns', label: 'Cột', title: 'Cột'},
  {key: 'density', label: 'Mật độ', title: 'Mật độ'},
  {key: 'sticky', label: 'Cột cố định', title: 'Cột cố định'},
  {key: 'grouping', label: 'Nhóm', title: 'Nhóm'},
];

export const DENSITY_OPTIONS: ReadonlyArray<{value: Density; label: string}> = [
  {value: 'compact', label: 'Gọn'},
  {value: 'balanced', label: 'Vừa phải'},
  {value: 'spacious', label: 'Rộng'},
];

export const STICKY_START_OPTIONS: ReadonlyArray<{
  value: StickyEdge;
  label: string;
}> = [
  {value: 'none', label: 'Không có'},
  {value: 'one', label: 'Cột đầu tiên'},
  {value: 'two', label: 'Hai cột đầu'},
];

export const STICKY_END_OPTIONS: ReadonlyArray<{
  value: StickyEdge;
  label: string;
}> = [
  {value: 'none', label: 'Không có'},
  {value: 'one', label: 'Cột cuối cùng'},
  {value: 'two', label: 'Hai cột cuối'},
];

export const GROUPING_OPTIONS: ReadonlyArray<{
  value: GroupField;
  label: string;
}> = [
  {value: 'none', label: 'Không có'},
  {value: 'status', label: 'Trạng thái hợp đồng'},
  {value: 'plotStatus', label: 'Trạng thái lô đất'},
  {value: 'paymentFrequency', label: 'Chu kỳ thanh toán'},
  {value: 'customer', label: 'Khách hàng'},
  {value: 'land', label: 'Khu đất'},
  {value: 'location', label: 'Vị trí'},
];

function groupOption(value: GroupField, label: string) {
  return {value, label};
}

function stringFieldValues(
  rows: readonly EntityTableRow[],
  key: string,
): string[] {
  return rows.map(row =>
    typeof rowValue(row, key) === 'string' ? String(rowValue(row, key)) : '',
  );
}

export function groupKeyOf(row: EntityTableRow, field: GroupField): string {
  if (field === 'none') {
    return '';
  }
  const stored = String(rowValue(row, field) ?? '');
  return VALUE_LABELS[stored] ?? stored;
}

function rowValue(
  row: EntityTableRow,
  key: string,
): TableSearchValue | undefined {
  return (row as Record<string, TableSearchValue | undefined>)[key];
}

export function createGroupOrders(
  rows: readonly EntityTableRow[],
  {
    customerNames = [],
    landNames = [],
    locations = [],
    statusLabels = CONTRACT_STATUS_ORDER.map(key => VALUE_LABELS[key] ?? key),
  }: {
    customerNames?: readonly string[];
    landNames?: readonly string[];
    locations?: readonly string[];
    statusLabels?: readonly string[];
  } = {},
): Record<GroupField, string[]> {
  return {
    none: [],
    status: [...statusLabels],
    plotStatus: PLOT_STATUS_ORDER.map(key => VALUE_LABELS[key] ?? key),
    paymentFrequency: PAYMENT_FREQUENCY_ORDER.map(
      key => VALUE_LABELS[key] ?? key,
    ),
    customer: uniqueSorted([
      ...customerNames,
      ...stringFieldValues(rows, 'customer'),
    ]),
    land: uniqueSorted([...landNames, ...stringFieldValues(rows, 'land')]),
    location: uniqueSorted([
      ...locations,
      ...stringFieldValues(rows, 'location'),
    ]),
  };
}

export const GROUP_ORDERS = createGroupOrders([]);
export const GROUP_ROW_KEY_PREFIX = '__group_';
export const NO_ROWS: EntityTableRow[] = [];

export const COLUMN_LABELS: Record<string, string> = {
  summary: 'Hợp đồng',
  customer: 'Khách hàng',
  land: 'Khu đất',
  plot: 'Lô đất',
  status: 'Trạng thái',
  plotStatus: 'Trạng thái lô đất',
  paymentFrequency: 'Chu kỳ',
  rentAmount: 'Tiền thuê',
  depositAmount: 'Tiền đặt cọc',
  nextPaymentDueDate: 'Kỳ chưa thanh toán gần nhất',
  areaSqm: 'Diện tích',
  startDate: 'Bắt đầu',
  endDate: 'Kết thúc',
  updatedAt: 'Ngày cập nhật',
};

export const ALL_COLUMN_KEYS = [
  'summary',
  'customer',
  'land',
  'plot',
  'status',
  'plotStatus',
  'paymentFrequency',
  'rentAmount',
  'depositAmount',
  'nextPaymentDueDate',
  'areaSqm',
  'startDate',
  'endDate',
  'updatedAt',
];

export const DEFAULT_COLUMN_KEYS = [
  'summary',
  'status',
  'rentAmount',
  'paymentFrequency',
  'nextPaymentDueDate',
  'areaSqm',

];

export const LOCKED_COLUMN_KEY = 'summary';
export const LOCKED_COLUMN_MESSAGE =
  'Cột hợp đồng xác định mỗi hàng nên không thể ẩn.';
export const REORDER_DRAG_THRESHOLD = 5;

export interface ColumnReorderSession {
  key: string;
  mode: 'keyboard' | 'pointer';
  originalKeys: string[];
  fromIndex: number;
  toIndex: number;
  pointerId?: number;
  pointerStartY?: number;
  hasPointerMoved?: boolean;
}

export interface ViewState {
  columnKeys: string[];
  density: Density;
  stickyStart: StickyEdge;
  stickyEnd: StickyEdge;
  grouping: GroupField;
}

export type TableSortState = Array<{
  sortKey: string;
  direction: 'ascending' | 'descending';
}>;

export const INITIAL_VIEW: ViewState = {
  columnKeys: DEFAULT_COLUMN_KEYS,
  density: 'balanced',
  stickyStart: 'one',
  stickyEnd: 'none',
  grouping: 'none',
};

export const INITIAL_FILTERS: PowerSearchFilter[] = [PRESET_FILTERS[0].filter];

export const SORT_RANKS: Record<string, Record<string, number>> = {
  status: {
    PENDING: -1,
    ACTIVE: 0,
    AVAILABLE: 0,
    COMPLETED: 1,
    RENTED: 1,
    CANCELLED: 2,
    SOLD: 2,
  },
  plotStatus: {AVAILABLE: 0, RENTED: 1, SOLD: 2, UNASSIGNED: 3},
  paymentFrequency: {MONTHLY: 0, QUARTERLY: 1, YEARLY: 2, CUSTOM: 3},
};

export const PAGE_SIZE = 15;
export const SELECTION_COLUMN_KEY = '__xds_selection';
export const SKELETON_ROWS = 15;
export const SELECTION_COLUMN_WIDTH = 48;

export const DENSITY_PADDING: Record<Density, number> = {
  compact: 8,
  balanced: 12,
  spacious: 16,
};

export interface SavedView {
  id: string;
  name: string;
  filters: PowerSearchFilter[];
  view: ViewState;
}

export const INITIAL_SAVED_VIEWS: SavedView[] = [
  {
    id: 'active-contracts',
    name: 'Hợp đồng đang hiệu lực',
    filters: [PRESET_FILTERS[0].filter],
    view: INITIAL_VIEW,
  },
  {
    id: 'monthly-rent',
    name: 'Tiền thuê hằng tháng',
    filters: [
      {
        field: 'paymentFrequency',
        operator: 'is',
        value: {type: 'enum', value: 'MONTHLY'},
      },
    ],
    view: {
      ...INITIAL_VIEW,
      grouping: 'land',
    },
  },
  {
    id: 'high-rent',
    name: 'Tiền thuê cao',
    filters: [
      {
        field: 'rentAmount',
        operator: 'greater_than_or_equal',
        value: {type: 'integer', value: 1000},
      },
    ],
    view: {...INITIAL_VIEW, density: 'compact', stickyEnd: 'one'},
  },
];

const LAND_COLUMN_LABELS: Record<string, string> = {
  summary: 'Khu đất',
  location: 'Vị trí',
  areaSqm: 'Diện tích',
  description: 'Mô tả',
  imageCount: 'Hình ảnh',
  createdAt: 'Ngày tạo',
  updatedAt: 'Ngày cập nhật',
};

const PLOT_COLUMN_LABELS: Record<string, string> = {
  summary: 'Lô đất',
  plot: 'Lô đất',
  plotNumber: 'Mã lô đất',
  land: 'Khu đất',
  landLocation: 'Vị trí',
  status: 'Trạng thái',
  areaSqm: 'Diện tích',
  description: 'Mô tả',
  imageCount: 'Hình ảnh',
  createdAt: 'Ngày tạo',
  updatedAt: 'Ngày cập nhật',
};

const CUSTOMER_COLUMN_LABELS: Record<string, string> = {
  summary: 'Khách hàng',
  customer: 'Khách hàng',
  phone: 'Số điện thoại',
  email: 'Email',
  address: 'Địa chỉ',
  notes: 'Ghi chú',
  createdAt: 'Ngày tạo',
  updatedAt: 'Ngày cập nhật',
};

export const DATASET_COLUMN_LABELS: Record<DatasetKey, Record<string, string>> = {
  lands: LAND_COLUMN_LABELS,
  plots: PLOT_COLUMN_LABELS,
  contracts: COLUMN_LABELS,
  customers: CUSTOMER_COLUMN_LABELS,
};

const DATASET_ALL_COLUMN_KEYS: Record<DatasetKey, readonly string[]> = {
  lands: [
    'summary',
    'location',
    'areaSqm',
    'description',
    'imageCount',
    'createdAt',
    'updatedAt',
  ],
  plots: [
    'summary',
    'land',
    'landLocation',
    'status',
    'areaSqm',
    'description',
    'imageCount',
    'createdAt',
    'updatedAt',
  ],
  contracts: ALL_COLUMN_KEYS,
  customers: [
    'summary',
    'phone',
    'email',
    'address',
    'notes',
    'createdAt',
    'updatedAt',
  ],
};

const DATASET_DEFAULT_COLUMN_KEYS: Record<DatasetKey, readonly string[]> = {
  lands: ['summary', 'location', 'areaSqm', 'description', 'updatedAt'],
  plots: ['summary', 'land', 'status', 'areaSqm', 'description', 'updatedAt'],
  contracts: DEFAULT_COLUMN_KEYS,
  customers: ['summary', 'phone', 'email', 'address'],
};

const DATASET_INITIAL_VIEWS: Record<DatasetKey, ViewState> = {
  lands: {
    columnKeys: [...DATASET_DEFAULT_COLUMN_KEYS.lands],
    density: 'balanced',
    stickyStart: 'one',
    stickyEnd: 'none',
    grouping: 'none',
  },
  plots: {
    columnKeys: [...DATASET_DEFAULT_COLUMN_KEYS.plots],
    density: 'balanced',
    stickyStart: 'one',
    stickyEnd: 'none',
    grouping: 'none',
  },
  contracts: INITIAL_VIEW,
  customers: {
    columnKeys: [...DATASET_DEFAULT_COLUMN_KEYS.customers],
    density: 'balanced',
    stickyStart: 'one',
    stickyEnd: 'none',
    grouping: 'none',
  },
};

const PLOT_PRESET_FILTERS: readonly PresetFilter[] = [
  {
    key: 'available',
    label: 'Còn trống',
    filter: {
      field: 'status',
      operator: 'is',
      value: {type: 'enum', value: 'AVAILABLE'},
    },
  },
];

const EMPTY_FILTERS: readonly PowerSearchFilter[] = [];
const EMPTY_FILTER_FIELDS: readonly FilterField[] = [];
const EMPTY_MULTI_FILTER_FIELDS: readonly MultiFilterField[] = [];
const EMPTY_PRESET_FILTERS: readonly PresetFilter[] = [];

const DATASET_INITIAL_FILTERS: Record<DatasetKey, readonly PowerSearchFilter[]> = {
  lands: EMPTY_FILTERS,
  plots: EMPTY_FILTERS,
  contracts: EMPTY_FILTERS,
  customers: EMPTY_FILTERS,
};

const DATASET_INITIAL_SORTS: Record<DatasetKey, TableSortState> = {
  lands: [{sortKey: 'summary', direction: 'ascending'}],
  plots: [
    {sortKey: 'status', direction: 'ascending'},
    {sortKey: 'plotNumber', direction: 'ascending'},
  ],
  contracts: [
    {sortKey: 'status', direction: 'ascending'},
    {sortKey: 'nextPaymentDueSort', direction: 'ascending'},
  ],
  customers: [{sortKey: 'summary', direction: 'ascending'}],
};

const DATASET_GROUPING_OPTIONS: Record<
  DatasetKey,
  ReadonlyArray<{value: GroupField; label: string}>
> = {
  lands: [groupOption('none', 'Không có'), groupOption('location', 'Vị trí')],
  plots: [
    groupOption('none', 'Không có'),
    groupOption('status', 'Trạng thái'),
    groupOption('land', 'Khu đất'),
  ],
  contracts: GROUPING_OPTIONS,
  customers: [groupOption('none', 'Không có')],
};

function cloneFilters(filters: readonly PowerSearchFilter[]): PowerSearchFilter[] {
  return [...filters];
}

function cloneView(view: ViewState): ViewState {
  return {...view, columnKeys: [...view.columnKeys]};
}

export function getDatasetInitialFilters(
  dataset: DatasetKey,
): PowerSearchFilter[] {
  return cloneFilters(DATASET_INITIAL_FILTERS[dataset]);
}

export function getDatasetInitialView(dataset: DatasetKey): ViewState {
  return cloneView(DATASET_INITIAL_VIEWS[dataset]);
}

export function getDatasetInitialSort(dataset: DatasetKey): TableSortState {
  return DATASET_INITIAL_SORTS[dataset].map(sortItem => ({...sortItem}));
}

export interface DatasetTableData {
  key: DatasetKey;
  label: string;
  singularLabel: string;
  description: string;
  rows: EntityTableRow[];
  fieldDefs: FieldDefinition[];
  filterFields: readonly FilterField[];
  multiFilterFields: readonly MultiFilterField[];
  presetFilters: readonly PresetFilter[];
  groupOrders: Record<GroupField, string[]>;
  groupingOptions: ReadonlyArray<{value: GroupField; label: string}>;
  rangeFilter: RangeFilterConfig | null;
  view: ViewState;
  filters: PowerSearchFilter[];
  sort: TableSortState;
  columnLabels: Record<string, string>;
  allColumnKeys: readonly string[];
  defaultColumnKeys: readonly string[];
  lockedColumnKey: string;
  lockedColumnMessage: string;
  searchPlaceholder: string;
  powerSearchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  loadingLabel: string;
  layoutLabel: string;
  newButtonLabel: string;
}

export const OPERATOR_LABELS: Record<string, string> = {
  is: 'is',
  is_any_of: 'is any of',
  greater_than_or_equal: '>=',
  less_than_or_equal: '<=',
  after: 'after',
  before: 'before',
};

export interface ContractTableData {
  rows: ContractTableRow[];
  fieldDefs: ReturnType<typeof createFieldDefs>;
  filterFields: readonly FilterField[];
  multiFilterFields: readonly MultiFilterField[];
  presetFilters: readonly PresetFilter[];
  groupOrders: Record<GroupField, string[]>;
  rentMax: number;
}

export function buildContractTableData({
  contracts,
  customers,
  lands,
  plots,
}: {
  contracts: readonly Contract[];
  customers: readonly Customer[];
  lands: readonly Land[];
  plots: readonly Plot[];
}): ContractTableData {
  const rows = buildContractRows(contracts);
  const customerNames = uniqueSorted([
    ...customers.map(customer => customer.name),
    ...rows.map(row => row.customer),
  ]);
  const landNames = uniqueSorted([
    ...lands.map(land => land.name),
    ...plots.flatMap(plot => plot.lands.map(land => land.name)),
    ...rows.map(row => row.land),
  ]);

  return {
    rows,
    fieldDefs: createFieldDefs({customerNames, landNames}),
    filterFields: FILTER_FIELDS,
    multiFilterFields: createMultiFilterFields({customerNames, landNames}),
    presetFilters: PRESET_FILTERS,
    groupOrders: createGroupOrders(rows, {customerNames, landNames}),
    rentMax: rows.length === 0 ? DEFAULT_RENT_MAX : getRentMax(rows),
  };
}

export function buildDatasetTableData({
  dataset,
  contracts,
  customers,
  lands,
  plots,
}: {
  dataset: DatasetKey;
  contracts: readonly Contract[];
  customers: readonly Customer[];
  lands: readonly Land[];
  plots: readonly Plot[];
}): DatasetTableData {
  const meta = DATASET_META[dataset];
  const common = {
    key: dataset,
    label: meta.label,
    singularLabel: meta.singularLabel,
    description: meta.description,
    view: getDatasetInitialView(dataset),
    filters: getDatasetInitialFilters(dataset),
    sort: getDatasetInitialSort(dataset),
    columnLabels: DATASET_COLUMN_LABELS[dataset],
    allColumnKeys: DATASET_ALL_COLUMN_KEYS[dataset],
    defaultColumnKeys: DATASET_DEFAULT_COLUMN_KEYS[dataset],
    lockedColumnKey: 'summary',
    lockedColumnMessage: `${meta.singularLabel[0].toUpperCase()}${meta.singularLabel.slice(1)} xác định mỗi hàng nên không thể ẩn.`,
    groupingOptions: DATASET_GROUPING_OPTIONS[dataset],
    loadingLabel: `Đang tải ${meta.label.toLowerCase()}`,
    layoutLabel: meta.label,
    newButtonLabel: `Thêm ${meta.singularLabel}`,
    searchPlaceholder:
      dataset === 'contracts'
        ? 'Khách hàng, khu đất, lô đất'
        : `Tìm ${meta.label.toLowerCase()}`,
    emptyTitle: `Không có ${meta.label.toLowerCase()} phù hợp`,
    emptyDescription:
      'Thử xóa bộ lọc hoặc dùng từ khóa khác.',
  };

  if (dataset === 'contracts') {
    const contractData = buildContractTableData({
      contracts,
      customers,
      lands,
      plots,
    });
    return {
      ...common,
      rows: contractData.rows,
      fieldDefs: contractData.fieldDefs,
      filterFields: contractData.filterFields,
      multiFilterFields: contractData.multiFilterFields,
      presetFilters: contractData.presetFilters,
      groupOrders: contractData.groupOrders,
      rangeFilter: {
        field: 'rentAmount',
        label: 'Tiền thuê',
        min: RENT_MIN,
        max: contractData.rentMax,
        step: RENT_STEP,
        valueKind: 'money',
      },
      powerSearchPlaceholder: 'Try "rent > 1000" or "status is Active"',
    };
  }

  if (dataset === 'plots') {
    const rows = buildPlotRows(plots);
    const landNames = uniqueSorted([
      ...lands.map(land => land.name),
      ...rows.map(row => row.land),
    ]);
    const areaMax = rows.length === 0 ? DEFAULT_AREA_MAX : getAreaMax(rows);

    return {
      ...common,
      rows,
      fieldDefs: createPlotFieldDefs(landNames),
      filterFields: EMPTY_FILTER_FIELDS,
      multiFilterFields: createPlotFilterFields(landNames),
      presetFilters: PLOT_PRESET_FILTERS,
      groupOrders: createGroupOrders(rows, {
        landNames,
        statusLabels: PLOT_STATUS_ORDER.filter(
          status => status !== 'UNASSIGNED',
        ).map(key => VALUE_LABELS[key] ?? key),
      }),
      rangeFilter: {
        field: 'areaSqm',
        label: 'Diện tích',
        min: AREA_MIN,
        max: areaMax,
        step: AREA_STEP,
        valueKind: 'area',
      },
      powerSearchPlaceholder: 'Try "status is Available" or "area > 1000"',
    };
  }

  if (dataset === 'customers') {
    const rows = buildCustomerRows(customers);

    return {
      ...common,
      rows,
      fieldDefs: createCustomerFieldDefs(),
      filterFields: EMPTY_FILTER_FIELDS,
      multiFilterFields: EMPTY_MULTI_FILTER_FIELDS,
      presetFilters: EMPTY_PRESET_FILTERS,
      groupOrders: createGroupOrders(rows, {
        customerNames: rows.map(row => row.customer),
      }),
      rangeFilter: null,
      powerSearchPlaceholder: 'Try "email contains .com" or "address contains Main"',
    };
  }

  const rows = buildLandRows(lands);
  const locations = uniqueSorted(rows.map(row => row.location));
  const areaMax = rows.length === 0 ? DEFAULT_AREA_MAX : getAreaMax(rows);

  return {
    ...common,
    rows,
    fieldDefs: createLandFieldDefs(locations),
    filterFields: EMPTY_FILTER_FIELDS,
    multiFilterFields: createLocationFilterFields(locations),
    presetFilters: EMPTY_PRESET_FILTERS,
    groupOrders: createGroupOrders(rows, {locations}),
    rangeFilter: {
      field: 'areaSqm',
      label: 'Diện tích',
      min: AREA_MIN,
      max: areaMax,
      step: AREA_STEP,
      valueKind: 'area',
    },
    powerSearchPlaceholder: 'Try "location is District 9" or "area > 1000"',
  };
}

export function contractsForCustomerRecord(
  rows: readonly ContractTableRow[],
  active: Pick<CustomerTableRow, 'id'>,
): ContractTableRow[] {
  return rows
    .filter(row => row.customerId !== '' && row.customerId === active.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function contractsForLandRecord(
  rows: readonly ContractTableRow[],
  active: Pick<LandTableRow, 'id'>,
): ContractTableRow[] {
  return rows
    .filter(row => row.landId !== '' && row.landId === active.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function contractsForPlotRecord(
  rows: readonly ContractTableRow[],
  active: Pick<PlotTableRow, 'id'>,
): ContractTableRow[] {
  return rows
    .filter(row => row.plotIds.includes(active.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function plotsForLandRecord(
  plots: readonly Plot[],
  active: Pick<LandTableRow, 'id'>,
): Plot[] {
  return plots
    .filter(plot => plot.land_id === active.id)
    .sort((a, b) => a.plot_number.localeCompare(b.plot_number));
}

export function landForPlotRecord(
  lands: readonly Land[],
  active: Pick<PlotTableRow, 'landId'>,
): Land | null {
  return lands.find(land => land.id === active.landId) ?? null;
}

export const stickyKeys = (
  edge: StickyEdge,
  keys: string[],
  fromEnd: boolean,
): string[] => {
  const count = edge === 'one' ? 1 : edge === 'two' ? 2 : 0;
  if (count === 0) {
    return [];
  }
  return fromEnd ? keys.slice(-count) : keys.slice(0, count);
};
