"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { COPY } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";
import type { Lang } from "@/lib/types";

export default function Header({
  lang,
  setLang,
  generatedAt,
  dataMode,
  degraded,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
  generatedAt: string;
  dataMode: string;
  degraded: boolean;
}) {
  const t = COPY[lang];
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const modeLabel =
    dataMode === "fallback" || degraded
      ? t.offline
      : dataMode === "stale-cache"
        ? t.stale
        : t.live;

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/70 bg-sand-100/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/logo-mark.svg" alt="" className="h-9 w-9 sm:h-10 sm:w-10" />
          <span className="leading-none">
            <span className="block font-display text-[19px] font-semibold tracking-tight text-ink-900 sm:text-xl">
              Ƙura Alert
            </span>
            <span className="label mt-1 block !text-[9px] !tracking-[0.22em]">Gombe · Nigeria</span>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <span
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:inline-flex ${
              dataMode === "fallback" || degraded
                ? "border-amber-300/60 bg-amber-50 text-amber-800"
                : "border-palm-500/25 bg-palm-500/10 text-palm-700"
            }`}
            title={`${modeLabel} · updated ${timeAgo(generatedAt, lang)}`}
          >
            {dataMode === "fallback" || degraded ? (
              <WifiOff className="h-3 w-3" />
            ) : (
              <Wifi className="h-3 w-3" />
            )}
            {modeLabel}
            <span className="text-ink-400">·</span>
            <span className="text-ink-400">{timeAgo(generatedAt, lang)}</span>
          </span>

          <div className="hidden items-center gap-1 rounded-full border border-sand-200 bg-white/60 px-2 py-1 text-[11px] text-ink-500 lg:flex">
            <MapPin className="h-3 w-3" />
            10.29°N, 11.17°E
          </div>

          <div className="flex rounded-full border border-sand-200 bg-white/70 p-0.5 text-[11px] font-semibold">
            {(["en", "ha"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition ${
                  lang === l ? "bg-ink-900 text-sand-50" : "text-ink-500 hover:text-ink-900"
                }`}
                aria-pressed={lang === l}
              >
                {l === "en" ? "EN" : "HA"}
              </button>
            ))}
          </div>

          <button
            onClick={() => startTransition(() => router.refresh())}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sand-200 bg-white/70 text-ink-500 transition hover:text-ink-900"
            aria-label={t.refresh}
            title={t.refresh}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
