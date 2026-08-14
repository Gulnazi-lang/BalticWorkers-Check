"use client";

import { useEffect } from "react";

/**
 * Скроллит к разделу вакансий после полной загрузки страницы (не сразу
 * при пейнте) — обычный якорь браузера ненадёжен в Next.js из-за сдвига
 * layout при гидратации: сосед-тестировщик 14.08.2026 после поиска и
 * "Показать все вакансии" оба раза оставался наверху, на рекламном блоке.
 */
export function ScrollToJobs() {
  useEffect(() => {
    if (window.location.hash === "#jobs") {
      document.getElementById("jobs")?.scrollIntoView();
    }
  }, []);

  return null;
}
