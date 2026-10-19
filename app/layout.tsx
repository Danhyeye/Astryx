import {QueryProvider} from '@/components/providers/query-provider';
import {AppThemeProvider} from '@/components/providers/theme-provider';
import {cookies} from 'next/headers';
import {resolveAppTheme, THEME_COOKIE} from '@/lib/themePreference';
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Montserrat, JetBrains_Mono, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Quản lý đất đai",
  description: "Quản lý khu đất, lô đất, khách hàng và hợp đồng cho thuê.",
  icons: {icon: {url: '/images/astryx-dark.svg', type: 'image/svg+xml'}},
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = resolveAppTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      data-astryx-theme={theme}
      className={`${montserrat.variable} ${jetbrainsMono.variable} ${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><AppThemeProvider initialTheme={theme}><QueryProvider>{children}</QueryProvider></AppThemeProvider></body>
    </html>
  );
}
