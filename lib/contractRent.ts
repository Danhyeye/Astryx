import {contractDateFromParts, formatContractDate, parseContractDate} from './contractDates.ts';

export type RentYearBasis = 'calendar' | 'anniversary';

function completedRentalYears(start: Date, due: Date): number {
  let years = due.getUTCFullYear() - start.getUTCFullYear();
  const anniversary = contractDateFromParts(due.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  if (due < anniversary) years--;
  return Math.max(0, years);
}

export function rentYearLimit(startDate: string, endDate: string | null | undefined, basis: RentYearBasis = 'calendar'): number {
  const start = parseContractDate(startDate);
  const end = parseContractDate(endDate);
  if (basis === 'calendar') return end?.getUTCFullYear() ?? 9999;
  if (!start) return 1;
  return end ? completedRentalYears(start, end) + 1 : Math.max(1, 9999 - start.getUTCFullYear());
}

export function rentRangeDates(startDate: string, endDate: string | null | undefined, fromYear: number, toYear: number): {from: string; to: string} | null {
  const start = parseContractDate(startDate);
  if (!start) return null;
  const from = formatContractDate(contractDateFromParts(start.getUTCFullYear() + fromYear - 1, start.getUTCMonth(), start.getUTCDate()));
  const next = contractDateFromParts(start.getUTCFullYear() + toYear, start.getUTCMonth(), start.getUTCDate());
  const to = new Date(next.getTime() - 86400000);
  const end = parseContractDate(endDate);
  return {from, to: formatContractDate(end && end < to ? end : to)};
}

export function rentRangeMonthLabels(startDate: string, endDate: string | null | undefined, fromYear: number, toYear: number): {from: string; to: string} | null {
  const dates = rentRangeDates(startDate, endDate, fromYear, toYear);
  if (!dates) return null;
  const from = parseContractDate(dates.from)!;
  const to = new Date(parseContractDate(dates.to)!.getTime() + 86400000);
  const label = (date: Date) => `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
  return {from: label(from), to: label(to)};
}

export type ContractRentYear = {year: number; increase_percent: number};
export type ContractRentRange = {fromYear: number; toYear: number; increase_percent: number};

export function groupRentYears(rows: readonly ContractRentYear[]): ContractRentRange[] {
  const ranges: ContractRentRange[] = [];
  for (const row of [...rows].sort((a, b) => a.year - b.year)) {
    const previous = ranges.at(-1);
    if (previous && previous.toYear + 1 === row.year && previous.increase_percent === row.increase_percent) {
      previous.toYear = row.year;
    } else {
      ranges.push({fromYear: row.year, toYear: row.year, increase_percent: row.increase_percent});
    }
  }
  return ranges;
}

export function removeRentYearRange(rows: readonly ContractRentYear[], fromYear: number, toYear: number): ContractRentYear[] {
  return rows.filter(row => row.year < fromYear || row.year > toYear);
}

export function validRentYearRange(fromYear: number | null, toYear: number | null, percent: number | null, maxYear = 9999): boolean {
  return fromYear !== null && toYear !== null && percent !== null &&
    Number.isInteger(fromYear) && Number.isInteger(toYear) &&
    fromYear >= 1 && toYear <= Math.min(9999, maxYear) && fromYear <= toYear &&
    Number.isFinite(percent) && percent >= 0;
}

/** Set a fixed increase for every calendar year in the inclusive range. */
export function applyRentYearRange(rows: readonly ContractRentYear[], fromYear: number, toYear: number, percent: number, maxYear = 9999): ContractRentYear[] {
  if (!validRentYearRange(fromYear, toYear, percent, maxYear)) throw new RangeError('Khoảng năm hoặc tỷ lệ tăng không hợp lệ.');
  const years = new Map(rows.map(row => [row.year, {...row}]));
  for (let year = fromYear; year <= toYear; year++) years.set(year, {year, increase_percent: percent});
  return [...years.values()].sort((a, b) => a.year - b.year);
}

export function validRentYears(rows: readonly ContractRentYear[], maxYear = 9999): boolean {
  return new Set(rows.map(row => row.year)).size === rows.length && rows.every(row => Number.isInteger(row.year) && row.year >= 1 && row.year <= Math.min(9999, maxYear) && Number.isFinite(row.increase_percent) && row.increase_percent >= 0);
}

type RentTerms = {
  rent_year_basis?: RentYearBasis;
  rent_years?: readonly ContractRentYear[];
  rent_amount: number;
  annual_rent_increase_percent?: number;
  start_date: string;
};

/** Simple annual increase: each year's increment uses the original rent. */
export function rentForContractYear(baseRent: number, percent: number, completedYears: number): number {
  return Math.round(baseRent * (100 + percent * Math.max(0, completedYears))) / 100;
}

export function contractRentOnDate(contract: RentTerms, dueDate: string): number {
  const start = parseContractDate(contract.start_date);
  const due = parseContractDate(dueDate);
  if (!start || !due) return contract.rent_amount;
  const years = completedRentalYears(start, due);
  const priceYear = contract.rent_year_basis === 'anniversary' ? years + 1 : due.getUTCFullYear();
  const customYear = contract.rent_years?.find(row => row.year === priceYear);
  if (customYear || contract.rent_years?.length) {
    return rentForContractYear(contract.rent_amount, customYear?.increase_percent ?? 0, 1);
  }
  return rentForContractYear(contract.rent_amount, contract.annual_rent_increase_percent ?? 0, years);
}

export function contractScheduledRentOnDate(contract: RentTerms & {payments?: readonly {due_date: string; amount: number}[]}, dueDate: string): number {
  return contract.payments?.find(payment => payment.due_date === dueDate)?.amount ?? contractRentOnDate(contract, dueDate);
}
