export function hasSessionEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isAllowedGoogleAccount(provider: unknown, profile: unknown): boolean {
  if (provider !== 'google' || !profile || typeof profile !== 'object') return false;
  const google = profile as {email?: unknown; email_verified?: unknown};
  return google.email_verified === true && hasSessionEmail(google.email);
}

export function requestAccessStatus(
  request: Request,
  session: {user?: {email?: string | null}} | null,
  publicUrl?: string,
): 401 | 403 | null {
  if (!session?.user) return 401;
  if (!hasSessionEmail(session.user.email)) return 403;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const url = new URL(request.url);
    // Next.js may reconstruct request.url with its internal listen address.
    // Use the configured external URL in production, or the browser's Host.
    const expectedOrigin = publicUrl ? new URL(publicUrl).origin
      : `${url.protocol}//${request.headers.get('host') || url.host}`;
    if (request.headers.get('sec-fetch-site') === 'cross-site' ||
        (origin && origin !== expectedOrigin)) return 403;
  }
  return null;
}
