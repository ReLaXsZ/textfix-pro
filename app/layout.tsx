import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TextFix Pro - Интелигентен текстов помощник & Редактор",
  description:
    "Безплатен онлайн инструмент за почистване, форматиране, транслитерация и AI анализ на текст.",
  applicationName: "TextFix Pro",
  authors: [{ name: "TextFix Pro" }],
  keywords: [
    "text editor",
    "text fix",
    "AI text",
    "transliteration",
    "форматиране на текст",
    "AI резюме",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "TextFix Pro - Интелигентен текстов помощник & Редактор",
    description:
      "Обработвайте текст, коригирайте правопис, правете резюмета и превеждайте мигновено.",
    url: "https://textfix-pro.vercel.app",
    siteName: "TextFix Pro",
    locale: "bg_BG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TextFix Pro - Интелигентен текстов помощник & Редактор",
    description:
      "Обработвайте текст, коригирайте правопис, правете резюмета и превеждайте мигновено.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" dir="ltr" suppressHydrationWarning>
      <body>
        {children}

        {/* Google AdSense — зарежда се след интерактивност, за да не блокира */}
        <Script
          id="adsbygoogle-init"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4954009931234621"
          crossOrigin="anonymous"
        />

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}