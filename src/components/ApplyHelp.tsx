"use client";

import { useRef, useState } from "react";

const STEPS = [
  "Откройте оригинальное объявление по ссылке выше.",
  "Найдите кнопку отклика — обычно подписана Apply, Ansök или Sök jobbet.",
  "Если текст неясен, включите перевод страницы в браузере.",
  "Перед откликом уточните условия у работодателя — можно скопировать сообщение ниже.",
];

function buildMessage(sourceUrl: string): string {
  return `Hello,

I am writing about the position advertised here: ${sourceUrl}

I am from the Baltics and interested in applying. Could you please confirm before I proceed:
- salary (before or after tax, and how much);
- accommodation — is it provided or do I arrange it myself;
- travel costs — who covers them;
- working hours per week;
- type of contract;
- any required documents (e.g. ID06, A1).

Thank you,
[Your name]`;
}

type CopyState = "idle" | "copied" | "manual";

/**
 * Не пишет и не отправляет сообщение за работника — только готовит шаблон
 * для копирования. Сайт остаётся информационной платформой, а не агентством:
 * отклик и переписка происходят на стороне работодателя.
 */
export function ApplyHelp({ sourceUrl }: { sourceUrl: string }) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const message = buildMessage(sourceUrl);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyState("copied");
    } catch {
      // Clipboard API недоступен (нет разрешения/фокуса) — выделяем текст,
      // чтобы человек мог скопировать вручную, а не остался ни с чем.
      textareaRef.current?.select();
      setCopyState("manual");
    }
    setTimeout(() => setCopyState("idle"), 2500);
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-medium text-accent"
      >
        {open ? "Скрыть подсказку ↑" : "Как откликнуться →"}
      </button>

      {open && (
        <div className="mt-2 rounded-lg bg-bg p-3">
          <ol className="grid list-decimal gap-1 pl-4 text-[11px] text-muted">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <p className="mt-2.5 text-[11px] font-medium text-ink">
            Сообщение работодателю (на английском):
          </p>
          <textarea
            ref={textareaRef}
            readOnly
            value={message}
            rows={8}
            onClick={(e) => e.currentTarget.select()}
            className="mt-1 w-full resize-none rounded-md border border-line bg-card p-2 text-[11px] text-ink"
          />
          <button type="button" onClick={handleCopy} className="mt-1.5 rounded-md bg-accent px-3 py-1.5 text-[11px] font-bold text-white">
            {copyState === "copied"
              ? "Скопировано ✓"
              : copyState === "manual"
                ? "Текст выделен — нажмите Ctrl+C"
                : "Скопировать"}
          </button>
        </div>
      )}
    </div>
  );
}
