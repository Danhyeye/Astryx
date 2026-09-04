import {NextRequest, NextResponse} from 'next/server';

import {
  buildGoogleOAuthUrl,
  getGoogleCalendarEnv,
} from '@/lib/google-calendar/googleCalendar';

const STATE_COOKIE = 'google_calendar_oauth_state';
const STATE_MAX_AGE_SECONDS = 10 * 60;

function calendarRedirect(request: NextRequest, status: string): NextResponse {
  const url = new URL('/calendar', request.url);
  url.searchParams.set('google', status);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const config = getGoogleCalendarEnv();

  if (!config.isConfigured) {
    return calendarRedirect(request, 'missing_credentials');
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(buildGoogleOAuthUrl(config, state));

  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: STATE_MAX_AGE_SECONDS,
    path: '/api/calendar/google',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
