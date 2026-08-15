import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { Golos_Text } from "next/font/google";
import { ENABLED_LOCALES, isEnabledLocale } from "@/i18n/config";
import "../globals.css";

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

export function generateStaticParams() {
  return ENABLED_LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#183b46",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();

  return (
    <html lang={locale} className={golos.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
