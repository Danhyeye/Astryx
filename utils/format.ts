export const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'] as const;

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

export function formatInputNumber(value: number): string {
  return value.toLocaleString('en-US', {maximumFractionDigits: 20});
}

export function formatDate(
  value: string | Date | null | undefined,
  withYear = false,
): string {
  if (value == null || value === '') {
    return 'Chưa thiết lập';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Chưa thiết lập';
  }
  return new Intl.DateTimeFormat('vi-VN', {day: '2-digit', month: '2-digit', ...(withYear ? {year: 'numeric' as const} : {}), timeZone: 'UTC'}).format(date);
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND', maximumFractionDigits: 0}).format(amount).replaceAll('.', ',');
}

export function formatArea(areaSqm: number): string {
  return `${formatNumber(areaSqm)} m²`;
}

export function formatDueDay(day: number): string {
  return day > 0 ? `Ngày ${day}` : 'Chưa thiết lập';
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
    return `${label} trên ${formatValue(low)}`;
  }

  if (hasHigh) {
    return `${label} dưới ${formatValue(high)}`;
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
