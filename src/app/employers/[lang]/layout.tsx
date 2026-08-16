import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { Golos_Text } from "next/font/google";
import { EMPLOYER_LANGS, isEmployerLang } from "@/i18n/employers/config";
import "../../globals.css";

// Второй корневой layout рядом с [locale]/layout.tsx: в проекте нет
// app/layout.tsx, поэтому html/body задаёт верхний layout каждой ветки.
// Свой нужен именно потому, что lang здесь sv/nb — не локаль сайта, и
// подставить его из [locale] нельзя.
const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export function generateStaticParams() {
  return EMPLOYER_LANGS.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#183b46",
  width: "device-width",
  initialScale: 1,
};

export default async function EmployerLangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isEmployerLang(lang)) notFound();

  return (
    <html lang={lang} className={golos.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
