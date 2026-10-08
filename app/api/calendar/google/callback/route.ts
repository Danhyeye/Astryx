import {authorizeRequest} from '@/lib/auth';
import {NextRequest, NextResponse} from 'next/server';

import {
  exchangeAuthorizationCode,
  fetchGoogleUserInfo,
  getGoogleCalendarEnv,
  tokenExpiresAt,
  type GoogleUserInfo,
} from '@/lib/google-calendar/googleCalendar';
import {createAdminClient} from '@/lib/supabase/admin';
import type {Database} from '@/types/database.types';

const STATE_COOKIE = 'google_calendar_oauth_state';

type CalendarIntegrationRow =
  Database['public']['Tables']['calendar_integrations']['Row'];

function calendarRedirect(request: NextRequest, status: string): NextResponse {
  const url = new URL('/calendar', request.url);
  url.searchParams.set('google', status);
  return NextResponse.redirect(url);
}

function clearStateCookie(response: NextResponse): NextResponse {
  response.cookies.set(STATE_COOKIE, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/api/calendar/google',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}

async function latestGoogleIntegration() {
  const supabase = createAdminClient();

  return supabase
    .from('calendar_integrations')
    .select('*')
    .eq('provider', 'google')
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle();
}

async function existingOauthToken(integrationId: string) {
  const supabase = createAdminClient();

  return supabase
    .from('calendar_oauth_tokens')
    .select('*')
    .eq('integration_id', integrationId)
    .maybeSingle();
}

export async function GET(request: NextRequest) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const callbackError = request.nextUrl.searchParams.get('error');

  if (callbackError != null) {
    return clearStateCookie(calendarRedirect(request, 'connect_denied'));
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  if (code == null || state == null || expectedState == null) {
    return clearStateCookie(calendarRedirect(request, 'missing_oauth_state'));
  }

  if (state !== expectedState) {
    return clearStateCookie(calendarRedirect(request, 'invalid_oauth_state'));
  }

  const config = getGoogleCalendarEnv();
  if (!config.isConfigured) {
    return clearStateCookie(calendarRedirect(request, 'missing_credentials'));
  }

  try {
    const tokenResponse = await exchangeAuthorizationCode(config, code);
    const userInfo = await fetchGoogleUserInfo(
      tokenResponse.access_token,
    ).catch((): GoogleUserInfo => ({}));
    const supabase = createAdminClient();
    const {data: existingIntegration, error: integrationQueryError} =
      await latestGoogleIntegration();

    if (integrationQueryError) {
      throw new Error(integrationQueryError.message);
    }

    const integrationPayload = {
      provider: 'google' as CalendarIntegrationRow['provider'],
      account_email: userInfo.email ?? existingIntegration?.account_email ?? null,
      external_account_id:
        userInfo.sub ?? existingIntegration?.external_account_id ?? null,
      calendar_id: config.calendarId,
      status: 'active' as CalendarIntegrationRow['status'],
    };
    const integrationResult =
      existingIntegration == null
        ? await supabase
            .from('calendar_integrations')
            .insert(integrationPayload)
            .select('*')
            .single()
        : await supabase
            .from('calendar_integrations')
            .update(integrationPayload)
            .eq('id', existingIntegration.id)
            .select('*')
            .single();

    if (integrationResult.error) {
      throw new Error(integrationResult.error.message);
    }

    const integration = integrationResult.data;
    const {data: currentToken, error: tokenQueryError} =
      await existingOauthToken(integration.id);

    if (tokenQueryError) {
      throw new Error(tokenQueryError.message);
    }

    const refreshToken =
      tokenResponse.refresh_token ?? currentToken?.refresh_token ?? null;
    const tokenPayload = {
      integration_id: integration.id,
      access_token: tokenResponse.access_token,
      refresh_token: refreshToken,
      token_type: tokenResponse.token_type ?? 'Bearer',
      scope: tokenResponse.scope ?? null,
      expires_at: tokenExpiresAt(tokenResponse.expires_in),
    } satisfies Database['public']['Tables']['calendar_oauth_tokens']['Insert'];
    const {error: tokenUpsertError} = await supabase
      .from('calendar_oauth_tokens')
      .upsert(tokenPayload, {onConflict: 'integration_id'});

    if (tokenUpsertError) {
      throw new Error(tokenUpsertError.message);
    }

    return clearStateCookie(calendarRedirect(request, 'connected'));
  } catch {
    return clearStateCookie(calendarRedirect(request, 'connect_failed'));
  }
}
