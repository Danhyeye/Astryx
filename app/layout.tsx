import {QueryProvider} from '@/components/providers/query-provider';
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, JetBrains_Mono, Playwrite_US_Trad } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const playwrite = Playwrite_US_Trad({variable: "--font-playwrite"});

export const metadata: Metadata = {
  title: "Quản lý đất đai",
  description: "Quản lý khu đất, lô đất, khách hàng và hợp đồng cho thuê.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      data-astryx-theme="matcha"
      className={`${dmSans.variable} ${jetbrainsMono.variable} ${playwrite.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><QueryProvider>{children}</QueryProvider></body>
    </html>
  );
}
