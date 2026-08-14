import Link from "next/link";

const NAV = [
  { href: "/#jobs", label: "Вакансии" },
  { href: "/how-we-check", label: "Как проверяем" },
  { href: "/services", label: "Помощь" },
  { href: "/for-employers", label: "Работодателям" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex h-18 w-[min(1120px,calc(100%-40px))] items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold">
          <span className="grid h-8.5 w-8.5 place-items-center rounded-[10px] bg-deep text-[11px] text-white">
            BW
          </span>
          <span>
            BalticWorkers <span className="text-accent">Check</span>
          </span>
        </Link>

        <nav className="ml-auto hidden gap-6 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-muted hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <span className="ml-auto rounded-lg border border-line px-3 py-2 text-sm md:ml-0">
          RU
        </span>
      </div>
    </header>
  );
}
