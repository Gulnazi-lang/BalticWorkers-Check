import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NordicWork Check — Работа в Скандинавии',
  description: 'Проверенные вакансии в Швеции и Норвегии для работников из Балтии.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}