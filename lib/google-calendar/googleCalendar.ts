export type GoogleCalendarEnv = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  calendarId: string;
  missing: string[];
  isConfigured: boolean;
};

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export type GoogleUserInfo = {
  email?: string;
  sub?: string;
};

export type GoogleCalendarApiEvent = {
  id: string;
  htmlLink?: string;
};

export type GoogleDueEventInput = {
  id: string;
  contractId: string;
  contractLabel: string;
  customerName: string;
  targetLabel: string;
  date: string;
  amount: number;
  frequency: string;
  status: string;
  startDate: string;
  endDate: string;
};

export type GoogleCalendarEventPayload = {
  summary: string;
  description: string;
  start: {
    date: string;
  };
  end: {
    date: string;
  };
  extendedProperties?: {
    private?: Record<string, string>;
  };
};

type Fetcher = typeof fetch;

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'email',
] as const;

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_CALENDAR_EVENTS_BASE =
  'https://www.googleapis.com/calendar/v3/calendars';
const REQUIRED_ENV_KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
] as const;
const TOKEN_EXPIRY_SKEW_MS = 60_000;

function envValue(
  env: Record<string, string | undefined>,
  key: string,
): string {
  return env[key]?.trim() ?? '';
}

function formBody(values: Record<string, string>): URLSearchParams {
  const body = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    body.set(key, value);
  }

  return body;
}

function requireConfigured(config: GoogleCalendarEnv): void {
  if (!config.isConfigured) {
    throw new Error(`Missing Google Calendar env: ${config.missing.join(', ')}`);
  }
}

async function readGoogleJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload != null &&
      'error_description' in payload
        ? String(payload.error_description)
        : typeof payload === 'object' && payload != null && 'error' in payload
          ? String(payload.error)
          : 'Google Calendar request failed.';

    throw new Error(message);
  }

  return payload as T;
}

function calendarEventsUrl(calendarId: string, eventId?: string): string {
  const encodedCalendarId = encodeURIComponent(calendarId);
  const base = `${GOOGLE_CALENDAR_EVENTS_BASE}/${encodedCalendarId}/events`;

  return eventId == null ? base : `${base}/${encodeURIComponent(eventId)}`;
}

function calendarDeleteEventUrl(calendarId: string, eventId: string): string {
  const url = new URL(calendarEventsUrl(calendarId, eventId));
  url.searchParams.set('sendUpdates', 'none');
  return url.toString();
}

function formatMoney(amount: number): string {
  return `$${Math.round(amount || 0).toLocaleString('en-US')}`;
}

export function getGoogleCalendarEnv(
  env: Record<string, string | undefined> = process.env,
): GoogleCalendarEnv {
  const missing = REQUIRED_ENV_KEYS.filter(key => envValue(env, key) === '');

  return {
    clientId: envValue(env, 'GOOGLE_CLIENT_ID'),
    clientSecret: envValue(env, 'GOOGLE_CLIENT_SECRET'),
    redirectUri: envValue(env, 'GOOGLE_REDIRECT_URI'),
    calendarId: envValue(env, 'GOOGLE_CALENDAR_ID') || 'primary',
    missing: [...missing],
    isConfigured: missing.length === 0,
  };
}

export function buildGoogleOAuthUrl(
  config: GoogleCalendarEnv,
  state: string,
): string {
  requireConfigured(config);

  const url = new URL(GOOGLE_OAUTH_URL);
  url.search = formBody({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    state,
  }).toString();

  return url.toString();
}

export function addDaysToIsoDate(value: string, days: number): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildGoogleDueEvent(
  event: GoogleDueEventInput,
): GoogleCalendarEventPayload {
  return {
    summary: `Rent due: ${event.customerName}`,
    description: [
      `Contract: ${event.contractLabel}`,
      `Target: ${event.targetLabel}`,
      `Amount: ${formatMoney(event.amount)}`,
      `Frequency: ${event.frequency}`,
      `Contract status: ${event.status}`,
      `Contract period: ${event.startDate} to ${event.endDate}`,
    ].join('\n'),
    start: {
      date: event.date,
    },
    end: {
      date: addDaysToIsoDate(event.date, 1),
    },
    extendedProperties: {
      private: {
        source: 'astryx-land-manager',
        localEventKey: event.id,
        contractId: event.contractId,
      },
    },
  };
}

export function isTokenExpired(
  expiresAt: string,
  now = Date.now(),
  skewMs = TOKEN_EXPIRY_SKEW_MS,
): boolean {
  const expiresAtMs = Date.parse(expiresAt);
  return Number.isNaN(expiresAtMs) || expiresAtMs - skewMs <= now;
}

export function tokenExpiresAt(
  expiresInSeconds: number,
  now = Date.now(),
): string {
  return new Date(now + expiresInSeconds * 1000).toISOString();
}

export async function exchangeAuthorizationCode(
  config: GoogleCalendarEnv,
  code: string,
  fetcher: Fetcher = fetch,
): Promise<GoogleTokenResponse> {
  requireConfigured(config);

  const response = await fetcher(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
  });

  return readGoogleJson<GoogleTokenResponse>(response);
}

export async function refreshGoogleAccessToken(
  config: GoogleCalendarEnv,
  refreshToken: string,
  fetcher: Fetcher = fetch,
): Promise<GoogleTokenResponse> {
  requireConfigured(config);

  const response = await fetcher(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  return readGoogleJson<GoogleTokenResponse>(response);
}

export async function fetchGoogleUserInfo(
  accessToken: string,
  fetcher: Fetcher = fetch,
): Promise<GoogleUserInfo> {
  const response = await fetcher(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return readGoogleJson<GoogleUserInfo>(response);
}

export async function insertGoogleEvent(
  config: GoogleCalendarEnv,
  accessToken: string,
  payload: GoogleCalendarEventPayload,
  fetcher: Fetcher = fetch,
): Promise<GoogleCalendarApiEvent> {
  const response = await fetcher(calendarEventsUrl(config.calendarId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return readGoogleJson<GoogleCalendarApiEvent>(response);
}

export async function updateGoogleEvent(
  config: GoogleCalendarEnv,
  accessToken: string,
  eventId: string,
  payload: GoogleCalendarEventPayload,
  fetcher: Fetcher = fetch,
): Promise<GoogleCalendarApiEvent> {
  const response = await fetcher(calendarEventsUrl(config.calendarId, eventId), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return readGoogleJson<GoogleCalendarApiEvent>(response);
}

export async function deleteGoogleEvent(
  config: GoogleCalendarEnv,
  accessToken: string,
  eventId: string,
  fetcher: Fetcher = fetch,
): Promise<void> {
  const response = await fetcher(
    calendarDeleteEventUrl(config.calendarId, eventId),
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (response.ok || response.status === 404 || response.status === 410) {
    return;
  }

  await readGoogleJson<unknown>(response);
}
