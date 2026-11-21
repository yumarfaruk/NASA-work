"use client";

import { CloudRain, Droplets, Wind } from "lucide-react";
import { COPY } from "@/lib/i18n";
import type { Lang, ThresholdSummary } from "@/lib/types";

const LEVEL_ROWS = [
  { key: "low", en: "Low", ha: "Ƙarami", color: "#2f8f5b", range: "0–49" },
  { key: "moderate", en: "Moderate", ha: "Matsakaici", color: "#c99a1e", range: "50–74" },
  { key: "high", en: "High", ha: "Yawa", color: "#d2691e", range: "75–89" },
  { key: "severe", en: "Severe", ha: "Haɗari", color: "#b3261e", range: "90–100" },
];

export default function HowItWorks({
  thresholds,
  lang,
}: {
  thresholds: ThresholdSummary;
  lang: Lang;
}) {
  const t = COPY[lang];
  const weights = thresholds.weights ?? {};
  const order = ["dust", "aod", "wind", "dryness"];
  const labels: Record<string, { en: string; ha: string }> = {
    dust: { en: "Dust concentration", ha: "Yawan ƙura" },
    aod: { en: "Aerosol optical depth", ha: "AOD" },
    wind: { en: "Wind speed", ha: "Saurin iska" },
    dryness: { en: "Dry air", ha: "Bushewar iska" },
  };

  return (
    <section id="method" className="scroll-mt-20">
      <div className="card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="label">{t.howTitle}</p>
            <h2 className="mt-1 font-display text-2xl text-ink-900 sm:text-3xl">
              {lang === "ha" ? "Dabarar da za ka iya bincikawa" : "A formula you can audit"}
            </h2>
            <p className="mt-1 text-xs text-ink-400">{t.howSub}</p>
          </div>
          <span className="rounded-full bg-sand-200/60 px-2.5 py-1 text-[10px] font-medium text-ink-500">
            {thresholds.sample_days?.toLocaleString()} {t.days} · {thresholds.seasons?.length ?? 0} {t.seasons}
          </span>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl bg-ink-900 px-4 py-3 text-sand-100">
          <code className="whitespace-nowrap font-mono text-[11px] sm:text-xs">
            score = 100 × ({weights.dust ?? 0.5}·dust + {weights.aod ?? 0.25}·AOD +{" "}
            {weights.wind ?? 0.15}·wind + {weights.dryness ?? 0.1}·dryness)
          </code>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              {t.weights}
            </p>
            <div className="mt-2 space-y-2">
              {order.map((key) => {
                const w = weights[key] ?? 0;
                return (
                  <div key={key} className="grid grid-cols-[1fr_2.5rem] items-center gap-2">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] text-ink-700">
                          {lang === "ha" ? labels[key].ha : labels[key].en}
                        </span>
                        <span className="tabular text-[11px] text-ink-400">
                          {Math.round(w * 100)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-200">
                        <div
                          className="h-full rounded-full bg-clay-500/80"
                          style={{ width: `${w * 100}%` }}
                        />
                      </div>
                    </div>
                    {key === "wind" ? (
                      <Wind className="h-4 w-4 justify-self-end text-ink-300" />
                    ) : key === "dryness" ? (
                      <Droplets className="h-4 w-4 justify-self-end text-ink-300" />
                    ) : (
                      <span />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-ink-400">
              {lang === "ha"
                ? `Kowane ma'auni ana kwatanta shi da kwanaki ${thresholds.window_days ?? 21} na wannan lokaci, a cikin shekaru 4.`
                : `Each input is ranked against the same ${thresholds.window_days ?? 21}-day window in each of four harmattan seasons.`}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              {t.thresholds}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {LEVEL_ROWS.map((row) => (
                <div
                  key={row.key}
                  className="rounded-xl border border-sand-200/80 bg-sand-50/60 p-2.5"
                  style={{ borderLeft: `3px solid ${row.color}` }}
                >
                  <p className="text-[11px] font-semibold text-ink-700">
                    {lang === "ha" ? row.ha : row.en}
                  </p>
                  <p className="tabular text-[11px] text-ink-400">{row.range}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl border border-sand-200/80 bg-sand-50/60 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-700">
                <CloudRain className="h-3.5 w-3.5 text-[#5d8aa8]" />
                {t.flood} · {lang === "ha" ? "ma'aunin ruwa" : "rain thresholds"}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                {lang === "ha"
                  ? "15 mm lura · 30 mm haɗari · 50 mm mummunan haɗari a cikin awa 24. Ana ƙara ruwan kwanaki 3 da 7 da suka wuce."
                  : "15 mm watch · 30 mm high · 50 mm severe in 24 h, then weighted with 72 h and prior 7-day rain."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-sand-200 pt-3 text-[10px] text-ink-400">
          <span>
            {lang === "ha" ? "An gina matakan daga" : "Thresholds built from"} {thresholds.seasons?.join(", ")}
          </span>
          {thresholds.generated_at ? (
            <span className="font-mono">
              {lang === "ha" ? "an sabunta" : "generated"} {thresholds.generated_at.slice(0, 10)}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
