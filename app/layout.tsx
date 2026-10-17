import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TextFix Pro - Интелигентен текстов помощник & Редактор онлайн",
  description: "Безплатен онлайн текстов помощник и редактор. Броене на думи и символи, проверка на текст, коригиране на грешки и форматиране онлайн.",
  keywords: [
    "текстов редактор",
    "брояч на думи",
    "броене на символи",
    "проверка на текст",
    "текстов помощник",
    "TextFix Pro"
  ],
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