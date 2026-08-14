import type { Metadata, Viewport } from "next";
import { Golos_Text } from "next/font/google";
import "./globals.css";

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BalticWorkers Check — проверенные вакансии за границей для работников из Балтии",
  description:
    "Зарплата, жильё, дорога и работодатель — всё в одной карточке. Проверяем условия вакансий в Швеции и Норвегии до того, как вы поедете.",
};

export const viewport: Viewport = {
  themeColor: "#183b46",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={golos.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
