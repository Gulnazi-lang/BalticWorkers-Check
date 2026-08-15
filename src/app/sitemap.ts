import type { MetadataRoute } from "next";
import { ENABLED_LOCALES } from "@/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://baltic-workers-check.vercel.app";

// /alerts/status сюда не входит — транзакционная страница (результат
// подтверждения/отписки), не то, что должно попадать в выдачу.
const PATHS = ["/", "/how-we-check", "/services", "/for-employers"];

/**
 * Генерируется от ENABLED_LOCALES, а не захардкоженного списка — новая
 * включённая локаль (как lt/et 15.08.2026) появляется в sitemap сама,
 * без отдельной правки. Раньше именно так локаль могла тихо остаться
 * невидимой для Google, даже уже работая на сайте.
 */
export default function sitemap(): MetadataRoute.Sitemap {
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
