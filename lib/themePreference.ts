export const THEME_COOKIE = 'astryx-theme';
export type AppTheme = 'matcha' | 'neutral';

export function resolveAppTheme(value: unknown): AppTheme {
  return value === 'neutral' ? 'neutral' : 'matcha';
}
