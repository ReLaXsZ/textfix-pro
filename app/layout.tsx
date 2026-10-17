import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'TextFix Pro - Интелигентен текстов помощник & Редактор',
  description: 'Безплатен онлайн инструмент за почистване, форматиране, транслитерация и AI анализ на текст.',
  openGraph: {
    title: 'TextFix Pro - Интелигентен текстов помощник & Редактор',
    description: 'Обработвайте текст, коригирайте правопис, правете резюмета и превеждайте мигновено.',
    url: 'https://textfix-pro.vercel.app',
    siteName: 'TextFix Pro',
    locale: 'bg_BG',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4954009931234621"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}