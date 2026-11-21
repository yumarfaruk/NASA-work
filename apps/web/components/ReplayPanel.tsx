"use client";

import { useState } from "react";
import { AlertTriangle, CloudRain, History, Wind } from "lucide-react";
import { COPY } from "@/lib/i18n";
import { num, shortDate } from "@/lib/format";
import type { Lang, ReplayData } from "@/lib/types";

export default function ReplayPanel({
  replay,
  lang,
}: {
  replay: ReplayData;
  lang: Lang;
}) {
  const t = COPY[lang];
  const [active, setActive] = useState(0);

  if (!replay?.events?.length) return null;

  const event = replay.events[Math.min(active, replay.events.length - 1)];
  const day = event.day;
  const flood = day.flood;
  const isFlood = event.kind === "flood";
  const meta = isFlood ? flood?.level_meta : day.level_meta;
  const score = isFlood ? flood?.score : day.score;
  const headline = isFlood ? flood?.headline : day.headline;
  const advice = isFlood ? flood?.advice : day.advice.market;
  const title = lang === "ha" ? event.title_ha : event.title_en;
  const context = lang === "ha" ? event.context_ha : event.context_en;

  const stats = isFlood
    ? [
        { label: t.rain24, value: num(flood?.rain_24h, 1), unit: "mm" },
        { label: t.rain72, value: num(flood?.rain_72h, 1), unit: "mm" },
        { label: t.rain7, value: num(flood?.rain_7d_prior, 1), unit: "mm" },
        { label: t.replayScore, value: num(score, 0), unit: "/100" },
      ]
    : [
        { label: t.dust, value: num(day.dust, 0), unit: "µg/m³" },
        { label: "AOD", value: num(day.aod, 2), unit: "550 nm" },
        { label: lang === "ha" ? "Saurin iska" : "Wind", value: num(day.wind, 1), unit: "km/h" },
        { label: lang === "ha" ? "Danshi" : "Humidity", value: num(day.rh, 0), unit: "%" },
      ];

  return (
    <section id="replay" className="scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="label">{t.replay}</p>
          <h2 className="mt-1 font-display text-2xl text-ink-900 sm:text-3xl">
            {lang === "ha"
              ? "Duba ranar da ta gabata, ba hasashen yau ba"
              : "See a real severe day, not a forecast"}
          </h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-ink-400">{t.replaySub}</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-12">
        <div className="flex flex-col gap-2 lg:col-span-4">
          {replay.events.map((item, index) => {
            const selected = index === active;
            const itemMeta =
              item.kind === "flood" ? item.day.flood?.level_meta : item.day.level_meta;
            const Icon = item.kind === "flood" ? CloudRain : Wind;
            return (
              <button
                key={item.id}
                onClick={() => setActive(index)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  selected
                    ? "border-ink-900/20 bg-white shadow-lift"
                    : "border-sand-200/80 bg-white/55 hover:bg-white/80"
                }`}
              >
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: `${itemMeta?.color ?? "#2c5f46"}16`,
                    color: itemMeta?.color ?? "#2c5f46",
                  }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wider text-ink-400">
                    {item.kind === "flood" ? t.replayFlood : t.replayDust}
                  </span>
                  <span className="block truncate text-sm font-semibold text-ink-900">
                    {lang === "ha" ? item.title_ha : item.title_en}
                  </span>
                  <span className="tabular block text-[11px] text-ink-400">
                    {shortDate(item.date, lang)} {item.date.slice(0, 4)}
                  </span>
                </span>
                <span
                  className="ml-auto shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{
                    background: `${itemMeta?.color ?? "#2c5f46"}14`,
                    color: itemMeta?.color ?? "#2c5f46",
                  }}
                >
                  {lang === "ha" ? itemMeta?.ha : itemMeta?.en}
                </span>
              </button>
            );
          })}
          <p className="rounded-xl border border-amber-300/50 bg-amber-50/80 px-3 py-2 text-[10px] leading-relaxed text-amber-900">
            <History className="mr-1 inline h-3 w-3" />
            {lang === "ha" ? replay.disclaimer.ha : replay.disclaimer.en}
          </p>
        </div>

        <article className="card relative overflow-hidden rounded-3xl p-5 lg:col-span-8">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-[0.14] blur-3xl"
            style={{ background: meta?.color ?? "#2c5f46" }}
          />
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: `${meta?.color ?? "#2c5f46"}14`, color: meta?.color ?? "#2c5f46" }}
                >
                  {lang === "ha" ? meta?.ha : meta?.en}
                </span>
                <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                  <AlertTriangle className="mr-1 inline h-3 w-3" />
                  {t.replayNotForecast}
                </span>
              </div>
              <h3 className="mt-2 font-display text-2xl text-ink-900">{title}</h3>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-400">
                {event.date} · {lang === "ha" ? "an auna" : "observed"}
              </p>
            </div>
            <div className="text-right">
              <p className="tabular text-4xl font-semibold leading-none text-ink-900">
                {num(score, 1)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-ink-400">/ 100</p>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-ink-600">{context}</p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-sand-200/80 bg-sand-50/60 p-2.5"
              >
                <p className="truncate text-[10px] uppercase tracking-wider text-ink-400">
                  {item.label}
                </p>
                <p className="tabular mt-1 text-lg font-semibold text-ink-900">
                  {item.value}{" "}
                  <span className="text-[10px] font-normal text-ink-400">{item.unit}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border-l-[3px] bg-sand-50/70 px-3 py-2.5" style={{ borderLeftColor: meta?.color }}>
            <p className="text-[10px] uppercase tracking-wider text-ink-400">{t.replayAdvice}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
              <span className="font-semibold text-ink-900">
                {lang === "ha" ? headline?.ha : headline?.en}
              </span>{" "}
              {lang === "ha" ? advice?.ha : advice?.en}
            </p>
          </div>

          <p className="mt-3 font-mono text-[9px] text-ink-400">
            {t.replaySource}: {event.source ?? "—"}
          </p>
        </article>
      </div>
    </section>
  );
}
