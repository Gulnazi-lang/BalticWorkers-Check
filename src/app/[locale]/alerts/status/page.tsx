import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isEnabledLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/href";

function messageFor(dict: Dictionary, state: string | undefined): { title: string; text: string } {
  if (state === "confirmed") {
    return { title: dict.alertsStatus.confirmedTitle, text: dict.alertsStatus.confirmedText };
  }
  if (state === "unsubscribed") {
    return { title: dict.alertsStatus.unsubscribedTitle, text: dict.alertsStatus.unsubscribedText };
  }
  return { title: dict.alertsStatus.errorTitle, text: dict.alertsStatus.errorText };
}

export default async function AlertsStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isEnabledLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dict = await getDictionary(locale);

  const { state } = await searchParams;
  const message = messageFor(dict, state);

  return (
    <>
      <SiteHeader locale={locale} dict={dict} />
      <main className="mx-auto w-[min(640px,calc(100%-40px))] py-24 text-center">
        <h1 className="text-2xl font-extrabold">{message.title}</h1>
        <p className="mt-3 text-muted">{message.text}</p>
        <Link
          href={localeHref(locale, "/")}
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 font-bold text-white"
        >
          {dict.common.backHome}
        </Link>
      </main>
      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}
