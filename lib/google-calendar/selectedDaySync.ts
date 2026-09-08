import type {Contract} from '../../types/contract';
import {buildContractMonthEvents} from '../../components/calendar/contractCalendarData.ts';
import {parseContractDate} from '../contractDates.ts';
import {findStaleGoogleEventMappings, type GoogleEventMapping} from './syncCleanup.ts';

export function parseSyncDate(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('date' in body)) return null;
  return typeof body.date === 'string' && parseContractDate(body.date) ? body.date : null;
}

export function buildSelectedDaySync<T extends GoogleEventMapping & {due_date: string | null}>(
  contracts: readonly Contract[],
  mappings: readonly T[],
  date: string,
) {
  const events = buildContractMonthEvents(contracts, date).filter(event => event.date === date);
  const staleMappings = findStaleGoogleEventMappings(
    mappings.filter(mapping => mapping.due_date === date),
    events.map(event => event.id),
  );
  return {events, staleMappings};
}
