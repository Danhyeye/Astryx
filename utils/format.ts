export const MONTHS = [
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
] as const;

export type FormatRangeLabelOptions = {
  label: string;
  low: number;
  high: number;
  min: number;
  max: number;
  formatValue: (value: number) => string;
};

export type SelectedOptionValue = {
  label?: string | null;
  value: string | number;
};

export function formatNumber(value: number): string {
  return Math.round(value || 0).toLocaleString('en-US');
}

export function formatDate(
  value: string | Date | null | undefined,
  withYear = false,
): string {
  if (value == null || value === '') {
    return 'Not set';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }
  const base = `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
  return withYear ? `${base}, ${date.getUTCFullYear()}` : base;
}

export function formatMoney(amount: number): string {
  return `$${formatNumber(amount)}`;
}

export function formatArea(areaSqm: number): string {
  return `${formatNumber(areaSqm)} sq m`;
}

export function formatDueDay(day: number): string {
  return day > 0 ? `Day ${day}` : 'Not set';
}

export function formatRangeLabel({
  label,
  low,
  high,
  min,
  max,
  formatValue,
}: FormatRangeLabelOptions): string | undefined {
  const hasLow = low > min;
  const hasHigh = high < max;

  if (hasLow && hasHigh) {
    return `${label} ${formatValue(low)} - ${formatValue(high)}`;
  }

  if (hasLow) {
    return `${label} over ${formatValue(low)}`;
  }

  if (hasHigh) {
    return `${label} under ${formatValue(high)}`;
  }

  return undefined;
}

export function formatSelectedOptionValue(
  items: readonly SelectedOptionValue[],
): string {
  const [first, ...rest] = items;

  if (first == null) {
    return '';
  }

  const firstLabel = String(first.label ?? first.value);
  return rest.length > 0 ? `${firstLabel}, +${rest.length}` : firstLabel;
}
