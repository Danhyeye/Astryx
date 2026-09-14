const DAY_MS = 86_400_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseContractDate(
  value: string | null | undefined,
): Date | null {
  if (value == null || !ISO_DATE_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || formatContractDate(date) !== value
    ? null
    : date;
}

export function isValidISODate(value: string): boolean {
  return parseContractDate(value) != null;
}

export function formatContractDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInUTCMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function contractDateFromParts(
  year: number,
  monthIndex: number,
  day: number,
): Date {
  return new Date(
    Date.UTC(year, monthIndex, Math.min(day, daysInUTCMonth(year, monthIndex))),
  );
}

function addUTCMonths(date: Date, months: number): Date {
  return contractDateFromParts(
    date.getUTCFullYear(),
    date.getUTCMonth() + months,
    date.getUTCDate(),
  );
}

function addUTCDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function resolveContractEndDate({
  startDate,
  endDate,
  leaseDurationMonths,
}: {
  startDate: string;
  endDate: string | null | undefined;
  leaseDurationMonths: number | null | undefined;
}): string | null {
  const explicitEnd = parseContractDate(endDate);
  if (explicitEnd != null) {
    return formatContractDate(explicitEnd);
  }

  const start = parseContractDate(startDate);
  if (
    start == null ||
    leaseDurationMonths == null ||
    !Number.isInteger(leaseDurationMonths) ||
    leaseDurationMonths <= 0
  ) {
    return null;
  }

  return formatContractDate(
    addUTCDays(addUTCMonths(start, leaseDurationMonths), -1),
  );
}

/** Calendar date in the timezone used by rental contracts and their cron job. */
export function contractToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function isPendingStartDateValid(status: string, startDate: string, now = new Date()): boolean {
  return status !== 'PENDING' || (isValidISODate(startDate) && startDate > contractToday(now));
}
