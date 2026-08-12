import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-deep py-6 text-[12px] text-white/70">
      <div className="mx-auto flex w-[min(1120px,calc(100%-40px))] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 NordicWork Check</span>
        <span>Информационная платформа, не кадровое агентство</span>
        <Link href="/how-we-check" className="text-white/90 underline-offset-4 hover:underline">
          Как проверяем
        </Link>
      </div>
    </footer>
  );
}
