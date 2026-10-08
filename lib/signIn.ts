/** Keep login callbacks within app pages, avoiding external redirects and loops. */
export function signInDestination(value?: string): string {
  if (!value || value.includes('\\') || !/^\/(dashboard|lands|customers|contracts|calendar|settings\/profile)(\/|\?|#|$)/.test(value)) {
    return '/dashboard';
  }
  return value;
}
