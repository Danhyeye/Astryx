import {NextResponse} from 'next/server';

import {
  getGoogleCalendarEnv,
  isTokenExpired,
} from '@/lib/google-calendar/googleCalendar';
import {createAdminClient} from '@/lib/supabase/admin';
import type {ApiErrorResponse} from '@/types/api-response';
import type {Database} from '@/types/database.types';
import type {
  GoogleCalendarStatus,
  GoogleCalendarStatusResponse,
} from '@/types/google-calendar';

type CalendarIntegrationRow =
  Database['public']['Tables']['calendar_integrations']['Row'];

function inactiveStatus(
  config: ReturnType<typeof getGoogleCalendarEnv>,
): GoogleCalendarStatus {
  return {
    isConfigured: config.isConfigured,
    missing: config.missing,
    isConnected: false,
    needsReconnect: false,
    accountEmail: null,
    calendarId: config.calendarId,
    lastSyncedAt: null,
  };
}

export async function GET() {
  const config = getGoogleCalendarEnv();

  if (!config.isConfigured) {
    return NextResponse.json<GoogleCalendarStatusResponse>({
      code: 200,
      message: 'Chưa cấu hình kết nối Lịch Google.',
      data: inactiveStatus(config),
    });
  }

  const supabase = createAdminClient();
  const {data: integration, error: integrationError} = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('provider', 'google')
    .eq('status', 'active' as CalendarIntegrationRow['status'])
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle();

  if (integrationError) {
    return NextResponse.json<ApiErrorResponse>(
      {code: 500, message: integrationError.message, data: null},
      {status: 500},
    );
  }

  if (integration == null) {
    return NextResponse.json<GoogleCalendarStatusResponse>({
      code: 200,
      message: 'Chưa kết nối Lịch Google.',
      data: inactiveStatus(config),
    });
  }

  const {data: token, error: tokenError} = await supabase
    .from('calendar_oauth_tokens')
    .select('expires_at, refresh_token')
    .eq('integration_id', integration.id)
    .maybeSingle();

  if (tokenError) {
    return NextResponse.json<ApiErrorResponse>(
      {code: 500, message: tokenError.message, data: null},
      {status: 500},
    );
  }

  const tokenExpired = token == null || isTokenExpired(token.expires_at);
  const hasRefreshToken = token?.refresh_token != null;
  const needsReconnect = token == null || !hasRefreshToken;
  const isConnected = token != null && (!tokenExpired || hasRefreshToken);

  return NextResponse.json<GoogleCalendarStatusResponse>({
    code: 200,
    message: isConnected
      ? 'Đã kết nối Lịch Google.'
      : 'Vui lòng kết nối lại Lịch Google.',
    data: {
      isConfigured: true,
      missing: [],
      isConnected,
      needsReconnect,
      accountEmail: integration.account_email,
      calendarId: integration.calendar_id ?? config.calendarId,
      lastSyncedAt: integration.last_synced_at,
    },
  });
}
