import type { MetadataRoute } from "next";
import { ENABLED_LOCALES } from "@/i18n/config";
import { EMPLOYER_LANGS } from "@/i18n/employers/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://baltic-workers-check.vercel.app";

// /alerts/status сюда не входит — транзакционная страница (результат
// подтверждения/отписки), не то, что должно попадать в выдачу.
const PATHS = ["/", "/how-we-check", "/services", "/for-employers"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [...localePages(), ...employerPages()];
}

/**
 * /employers/{sv,nb} стоят отдельно от матрицы локалей: это не переводы
 * витрины, а страницы для другой аудитории (работодатель, а не соискатель).
 * Альтернативы у них только друг на друга — подмешивать сюда lv/ru/en/lt/et
 * значило бы сказать Google, что шведская страница для коммуны и латышская
 * главная для соискателя это одно и то же.
 */
function employerPages(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    EMPLOYER_LANGS.map((l) => [l, `${SITE_URL}/employers/${l}`])
  );
  return EMPLOYER_LANGS.map((lang) => ({
    url: `${SITE_URL}/employers/${lang}`,
    lastModified: new Date(),
    alternates: { languages },
  }));
}

/**
 * Генерируется от ENABLED_LOCALES, а не захардкоженного списка — новая
 * включённая локаль (как lt/et 15.08.2026) появляется в sitemap сама,
 * без отдельной правки. Раньше именно так локаль могла тихо остаться
 * невидимой для Google, даже уже работая на сайте.
 */
function localePages(): MetadataRoute.Sitemap {
  return PATHS.flatMap((path) => {
    const clean = path === "/" ? "" : path;
    const languages = Object.fromEntries(
      ENABLED_LOCALES.map((l) => [l, `${SITE_URL}/${l}${clean}`])
    );
    return ENABLED_LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${clean}`,
      lastModified: new Date(),
      alternates: { languages },
    }));
  });
}
