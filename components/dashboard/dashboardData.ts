import type {Contract} from '@/types/contract';
import type {Customer} from '@/types/customer';
import type {Land} from '@/types/land';

export type DashboardMetricData = {
  landCount: number;
  contractCount: number;
  customerCount: number;
  totalRevenue: number;
};

export type DashboardChartPoint = {
  label: string;
  amount: number;
};

export type DashboardEntityCount = {
  label: string;
  value: number;
};

export type DashboardData = {
  metrics: DashboardMetricData;
  weeklyRevenue: DashboardChartPoint[];
  monthlyRevenue: DashboardChartPoint[];
  entityCounts: DashboardEntityCount[];
};

const DAY_MS = 86_400_000;
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string): Date | null {
  if (value === '') {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sumRentByDate(contracts: readonly Contract[]): Map<string, number> {
  const rentByDate = new Map<string, number>();

  for (const contract of contracts) {
    const dueDate = parseDate(contract.next_payment_due_date);

    if (dueDate == null) {
      continue;
    }

    const key = dateKey(dueDate);
    rentByDate.set(key, (rentByDate.get(key) ?? 0) + contract.rent_amount);
  }

  return rentByDate;
}

function getWeekStart(today: Date): Date {
  const start = startOfUtcDay(today);
  return addUtcDays(start, -start.getUTCDay());
}

function buildWeeklyRevenue(
  contracts: readonly Contract[],
  today: Date,
): DashboardChartPoint[] {
  const rentByDate = sumRentByDate(contracts);
  const weekStart = getWeekStart(today);

  return Array.from({length: 7}, (_, index) => {
    const day = addUtcDays(weekStart, index);

    return {
      label: WEEKDAY_LABELS[day.getUTCDay()],
      amount: rentByDate.get(dateKey(day)) ?? 0,
    };
  });
}

function buildMonthlyRevenue(
  contracts: readonly Contract[],
  today: Date,
): DashboardChartPoint[] {
  const year = today.getUTCFullYear();
  const rentByMonth = Array.from({length: 12}, () => 0);

  for (const contract of contracts) {
    const dueDate = parseDate(contract.next_payment_due_date);

    if (dueDate == null || dueDate.getUTCFullYear() !== year) {
      continue;
    }

    rentByMonth[dueDate.getUTCMonth()] += contract.rent_amount;
  }

  return MONTH_LABELS.map((label, index) => {
    return {
      label,
      amount: rentByMonth[index],
    };
  });
}

export function buildDashboardData({
  contracts,
  customers,
  lands,
  today = new Date(),
}: {
  contracts: readonly Contract[];
  customers: readonly Customer[];
  lands: readonly Land[];
  today?: Date;
}): DashboardData {
  const metrics = {
    landCount: lands.length,
    contractCount: contracts.length,
    customerCount: customers.length,
    totalRevenue: contracts.reduce(
      (total, contract) => total + contract.rent_amount,
      0,
    ),
  };

  return {
    metrics,
    weeklyRevenue: buildWeeklyRevenue(contracts, today),
    monthlyRevenue: buildMonthlyRevenue(contracts, today),
    entityCounts: [
      {label: 'Lands', value: metrics.landCount},
      {label: 'Contracts', value: metrics.contractCount},
      {label: 'Customers', value: metrics.customerCount},
    ],
  };
}
