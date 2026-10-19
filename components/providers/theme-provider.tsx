'use client';

import {createContext, useContext, useState, useSyncExternalStore, type ReactNode} from 'react';
import {ThemeProvider as ColorModeProvider, useTheme as useColorMode} from 'next-themes';
import {Theme} from '@astryxdesign/core/theme';
import {matchaTheme} from '@/src/themes/matcha/matcha';
import {neutralTheme} from '@/src/themes/neutral/neutral';
import {resolveAppTheme, THEME_COOKIE, type AppTheme} from '@/lib/themePreference';

type ColorMode = 'light' | 'dark';
const ThemePreferenceContext = createContext<{
  theme: AppTheme; setTheme: (theme: AppTheme) => void;
  colorMode: ColorMode | undefined; setColorMode: (mode: ColorMode) => void;
} | null>(null);
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function AppThemeProvider({initialTheme, children}: {initialTheme: AppTheme; children: ReactNode}) {
  return <ColorModeProvider attribute="data-theme" storageKey="astryx-color-mode" defaultTheme="system" enableSystem>
    <AppThemeContent initialTheme={initialTheme}>{children}</AppThemeContent>
  </ColorModeProvider>;
}

function AppThemeContent({initialTheme, children}: {initialTheme: AppTheme; children: ReactNode}) {
  const [theme, updateTheme] = useState(initialTheme);
  const {resolvedTheme, setTheme: setColorMode} = useColorMode();
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const colorMode = mounted && (resolvedTheme === 'light' || resolvedTheme === 'dark') ? resolvedTheme : undefined;
  function setTheme(value: AppTheme) {
    const next = resolveAppTheme(value);
    document.cookie = `${THEME_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    updateTheme(next);
  }
  return <ThemePreferenceContext value={{theme, setTheme, colorMode, setColorMode}}>
    <Theme theme={theme === 'neutral' ? neutralTheme : matchaTheme} mode={colorMode ?? 'system'}>{children}</Theme>
  </ThemePreferenceContext>;
}

export function useAppTheme() {
  const preference = useContext(ThemePreferenceContext);
  if (!preference) throw new Error('useAppTheme requires AppThemeProvider');
  return preference;
}
