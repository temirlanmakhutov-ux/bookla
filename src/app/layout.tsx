import type { Metadata, Viewport } from "next";
import { Sofia_Sans, Sofia_Sans_Extra_Condensed } from "next/font/google";
import { getLocale } from "@/i18n/server";
import "./globals.css";

const body = Sofia_Sans({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-body" });
const sign = Sofia_Sans_Extra_Condensed({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["700", "800", "900"],
  variable: "--font-sign",
});

export const metadata: Metadata = {
  title: { default: "Bookla — online randevu · Kuzey Kıbrıs", template: "%s · Bookla" },
  description: "Book salons, doctors, services, restaurants and tours in North Cyprus. TR · EN · RU.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1238A6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${body.variable} ${sign.variable}`}>
      <body className="min-h-dvh font-sans text-base leading-normal">{children}</body>
    </html>
  );
}
