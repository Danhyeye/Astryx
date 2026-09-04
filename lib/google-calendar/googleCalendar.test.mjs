import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GOOGLE_CALENDAR_SCOPES,
  addDaysToIsoDate,
  buildGoogleDueEvent,
  buildGoogleOAuthUrl,
  deleteGoogleEvent,
  getGoogleCalendarEnv,
  isTokenExpired,
} from './googleCalendar.ts';

test('getGoogleCalendarEnv reports missing credentials and defaults calendar id', () => {
  const config = getGoogleCalendarEnv({
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: '',
    GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/calendar/google/callback',
  });

  assert.equal(config.calendarId, 'primary');
  assert.equal(config.isConfigured, false);
  assert.deepEqual(config.missing, ['GOOGLE_CLIENT_SECRET']);
});

test('buildGoogleOAuthUrl creates an offline consent URL for Calendar events', () => {
  const config = getGoogleCalendarEnv({
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/calendar/google/callback',
    GOOGLE_CALENDAR_ID: 'primary',
  });

  const url = new URL(buildGoogleOAuthUrl(config, 'state-123'));

  assert.equal(url.origin, 'https://accounts.google.com');
  assert.equal(url.pathname, '/o/oauth2/v2/auth');
  assert.equal(url.searchParams.get('client_id'), 'client-id');
  assert.equal(
    url.searchParams.get('redirect_uri'),
    'http://localhost:3000/api/calendar/google/callback',
  );
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('prompt'), 'consent');
  assert.equal(url.searchParams.get('include_granted_scopes'), 'true');
  assert.equal(url.searchParams.get('state'), 'state-123');
  assert.deepEqual(
    url.searchParams.get('scope')?.split(' '),
    [...GOOGLE_CALENDAR_SCOPES],
  );
});

test('buildGoogleDueEvent creates one-day all-day Google event payloads', () => {
  const payload = buildGoogleDueEvent({
    id: 'contract-1:2026-09-05',
    contractId: 'contract-1',
    contractLabel: 'Acme Tenant - North Field',
    customerName: 'Acme Tenant',
    targetLabel: 'North Field',
    date: '2026-09-05',
    amount: 1500,
    frequency: 'MONTHLY',
    status: 'ACTIVE',
    startDate: '2026-09-01',
    endDate: '2027-08-31',
  });

  assert.equal(payload.summary, 'Rent due: Acme Tenant');
  assert.deepEqual(payload.start, {date: '2026-09-05'});
  assert.deepEqual(payload.end, {date: '2026-09-06'});
  assert.match(payload.description, /Amount: \$1,500/);
  assert.equal(
    payload.extendedProperties?.private?.localEventKey,
    'contract-1:2026-09-05',
  );
  assert.equal(payload.extendedProperties?.private?.contractId, 'contract-1');
});

test('date and token helpers use UTC date keys and expiry skew', () => {
  assert.equal(addDaysToIsoDate('2026-02-28', 1), '2026-03-01');
  assert.equal(
    isTokenExpired('2026-09-04T10:00:30.000Z', Date.parse('2026-09-04T10:00:00.000Z')),
    true,
  );
  assert.equal(
    isTokenExpired('2026-09-04T10:05:00.000Z', Date.parse('2026-09-04T10:00:00.000Z')),
    false,
  );
});

test('deleteGoogleEvent deletes mapped events without notifications', async () => {
  const config = getGoogleCalendarEnv({
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/calendar/google/callback',
    GOOGLE_CALENDAR_ID: 'primary',
  });
  let requestUrl = '';
  let requestInit = {};

  await deleteGoogleEvent(config, 'access-token', 'event-1', async (url, init) => {
    requestUrl = String(url);
    requestInit = init ?? {};
    return new Response(null, {status: 204});
  });

  const url = new URL(requestUrl);
  assert.equal(
    url.href,
    'https://www.googleapis.com/calendar/v3/calendars/primary/events/event-1?sendUpdates=none',
  );
  assert.equal(requestInit.method, 'DELETE');
  assert.equal(requestInit.headers.Authorization, 'Bearer access-token');
});
