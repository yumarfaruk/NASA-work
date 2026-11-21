"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle, Send, Smartphone } from "lucide-react";
import { COPY } from "@/lib/i18n";
import type { DayForecast, Lang } from "@/lib/types";

export default function MessageCard({
  day,
  lang,
  uiLang,
}: {
  day: DayForecast;
  lang: Lang;
  uiLang: Lang;
}) {
  const t = COPY[uiLang];
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [messageLang, setMessageLang] = useState<Lang>("ha");
  const [copied, setCopied] = useState(false);

  const text = useMemo(
    () => day.message[`${channel}_${messageLang}` as keyof DayForecast["message"]],
    [day, channel, messageLang],
  );

  const shareHref =
    channel === "whatsapp"
      ? `https://wa.me/?text=${encodeURIComponent(text)}`
      : `sms:?&body=${encodeURIComponent(text)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="card relative flex h-full flex-col overflow-hidden rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label">{t.messageTitle}</p>
          <p className="mt-1 text-xs text-ink-400">{t.messageHint}</p>
        </div>
        <div className="flex rounded-full bg-sand-200/70 p-0.5 text-[11px] font-medium">
          {(["whatsapp", "sms"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`rounded-full px-3 py-1.5 capitalize transition ${
                channel === c ? "bg-ink-900 text-sand-50" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {c === "whatsapp" ? "WhatsApp" : "SMS"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setMessageLang("ha")}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            messageLang === "ha" ? "bg-palm-700 text-white" : "bg-sand-200/60 text-ink-500"
          }`}
        >
          Hausa
        </button>
        <button
          onClick={() => setMessageLang("en")}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            messageLang === "en" ? "bg-palm-700 text-white" : "bg-sand-200/60 text-ink-500"
          }`}
        >
          English
        </button>
        <span className="ml-auto text-[11px] text-ink-400">
          {text.length} {uiLang === "ha" ? "haruffa" : "chars"}
        </span>
      </div>

      <div className="relative mt-3 flex-1">
        <div className="relative rounded-2xl rounded-tl-sm border border-palm-700/15 bg-[#e7f3e4] p-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 text-[11px] font-semibold text-palm-700">
            {channel === "whatsapp" ? (
              <MessageCircle className="h-3.5 w-3.5" />
            ) : (
              <Smartphone className="h-3.5 w-3.5" />
            )}
            <span>{channel === "whatsapp" ? "WhatsApp broadcast" : "SMS alert"}</span>
            <span className="ml-auto font-normal text-palm-700/60">Gombe</span>
          </div>
          <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-900">{text}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={shareHref}
          target={channel === "whatsapp" ? "_blank" : undefined}
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-palm-700 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-palm-700/90"
        >
          {channel === "whatsapp" ? (
            <Send className="h-4 w-4" />
          ) : (
            <Smartphone className="h-4 w-4" />
          )}
          {channel === "whatsapp" ? t.whatsapp : "Open SMS"}
        </a>
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-xl border border-sand-300 bg-white/70 px-3.5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-white"
        >
          {copied ? <Check className="h-4 w-4 text-palm-700" /> : <Copy className="h-4 w-4" />}
          {copied ? t.copied : t.copy}
        </button>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-ink-400">
          {lang === "ha" ? "Hausa da Turanci" : "Hausa + English"}
        </span>
      </div>
    </div>
  );
}
