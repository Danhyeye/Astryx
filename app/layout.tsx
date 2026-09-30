import {QueryProvider} from '@/components/providers/query-provider';
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Montserrat, JetBrains_Mono, Pacifico } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Quản lý đất đai",
  description: "Quản lý khu đất, lô đất, khách hàng và hợp đồng cho thuê.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      data-astryx-theme="matcha"
      className={`${montserrat.variable} ${jetbrainsMono.variable} ${pacifico.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><QueryProvider>{children}</QueryProvider></body>
    </html>
  );
}
