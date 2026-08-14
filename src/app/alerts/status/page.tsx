import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const MESSAGES: Record<string, { title: string; text: string }> = {
  confirmed: {
    title: "Подписка подтверждена",
    text: "Будем присылать новые подходящие вакансии на почту.",
  },
  unsubscribed: {
    title: "Вы отписались",
    text: "Больше не будем присылать уведомления по этому адресу.",
  },
  error: {
    title: "Ссылка не сработала",
    text: "Возможно, она уже использована или устарела. Попробуйте подписаться заново на главной.",
  },
};

export default async function AlertsStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const message = MESSAGES[state ?? ""] ?? MESSAGES.error;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-[min(640px,calc(100%-40px))] py-24 text-center">
        <h1 className="text-2xl font-extrabold">{message.title}</h1>
        <p className="mt-3 text-muted">{message.text}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 font-bold text-white"
        >
          На главную
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
