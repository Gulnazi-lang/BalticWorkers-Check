import type { Dictionary } from "@/i18n/dictionaries";
import { TONE_CLASS, verificationLabels, verificationLegend } from "@/lib/status";

/**
 * Легенда статусов. Короткая версия — на главной, полная (с колонкой «что мы
 * проверили») — на /how-we-check. Это и есть продукт: чем прозрачнее методика,
 * тем выше доверие.
 */
export function VerificationLegend({ dict, full = false }: { dict: Dictionary; full?: boolean }) {
  const labels = verificationLabels(dict);
  const legend = verificationLegend(dict);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      {legend.map(({ level, meaning, checked }) => {
        const badge = labels[level];
        return (
          <div
            key={level}
            className="grid gap-2 border-b border-line p-5 last:border-b-0 sm:grid-cols-[210px_1fr] sm:items-start sm:gap-6"
          >
            <span
              className={`w-fit rounded-full px-3 py-1 text-[11px] font-medium ${TONE_CLASS[badge.tone]}`}
            >
              {badge.text}
            </span>
            <div>
              <p className="text-sm leading-relaxed">{meaning}</p>
              {full && (
                <p className="mt-1.5 text-[13px] text-muted">
                  <span className="font-medium">{dict.verification.checkedLabel}</span> {checked}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
