import type {
  GoogleCalendarStatusResponse,
  GoogleCalendarSyncResponse,
} from '@/types/google-calendar';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload != null &&
      'message' in payload
        ? String(payload.message)
        : 'Yêu cầu đến Lịch Google thất bại.';

    throw new Error(message);
  }

  return payload as T;
}

export const googleCalendarService = {
  getStatus: async (): Promise<GoogleCalendarStatusResponse> =>
    request<GoogleCalendarStatusResponse>('/api/calendar/google/status'),

  sync: async (date: string): Promise<GoogleCalendarSyncResponse> =>
    request<GoogleCalendarSyncResponse>('/api/calendar/google/sync', {
      method: 'POST',
      body: JSON.stringify({date}),
    }),
};
