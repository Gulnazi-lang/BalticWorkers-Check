"use client";

import { useRef, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries";

// Сообщение работодателю всегда на английском — это язык, на котором его
// поймут в Швеции/Норвегии, независимо от локали сайта соискателя.
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
export function ApplyHelp({ sourceUrl, dict }: { sourceUrl: string; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const message = buildMessage(sourceUrl);

  const steps = [
    dict.applyHelp.step1,
    dict.applyHelp.step2,
    dict.applyHelp.step3,
    dict.applyHelp.step4,
  ];
  const beforeYouAgree = [
    dict.applyHelp.before1,
    dict.applyHelp.before2,
    dict.applyHelp.before3,
    dict.applyHelp.before4,
  ];

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
        {open ? dict.applyHelp.close : dict.applyHelp.open}
      </button>

      {open && (
        <div className="mt-2 rounded-lg bg-bg p-3">
          <ol className="grid list-decimal gap-1 pl-4 text-[11px] text-muted">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <div className="mt-3 rounded-md border border-line bg-card p-2.5">
            <p className="text-[11px] font-medium text-ink">{dict.applyHelp.beforeTitle}</p>
            <ul className="mt-1.5 grid list-disc gap-1 pl-4 text-[11px] text-muted">
              {beforeYouAgree.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <p className="mt-2.5 text-[11px] font-medium text-ink">{dict.applyHelp.messageLabel}</p>
          <textarea
            ref={textareaRef}
            readOnly
            value={message}
            rows={8}
            onClick={(e) => e.currentTarget.select()}
            className="mt-1 w-full resize-none rounded-md border border-line bg-card p-2 text-[11px] text-ink"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="mt-1.5 rounded-md bg-accent px-3 py-1.5 text-[11px] font-bold text-white"
          >
            {copyState === "copied"
              ? dict.applyHelp.copied
              : copyState === "manual"
                ? dict.applyHelp.copyManual
                : dict.applyHelp.copy}
          </button>
        </div>
      )}
    </div>
  );
}
