"use client";

import { COPY } from "@/lib/i18n";
import { num, pct } from "@/lib/format";
import type { DayForecast, Lang } from "@/lib/types";

const VIEW_W = 340;
const VIEW_H = 208;
const CX = VIEW_W / 2;
const CY = 178;
const R = 128;
const STROKE = 20;
const ARC_LEN = Math.PI * R;

function point(t: number, radius = R) {
  const theta = Math.PI * (1 - t);
  return { x: CX + radius * Math.cos(theta), y: CY - radius * Math.sin(theta) };
}

function arcPath(from: number, to: number) {
  const a = point(from);
  const b = point(to);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

const UNITS: Record<string, string> = {
  dust: "µg/m³",
  aod: "",
  wind: "km/h",
  dryness: "%",
};

function colourFor(p: number | null): string {
  if (p === null) return "#cbb493";
  if (p >= 0.9) return "#b3261e";
  if (p >= 0.75) return "#d2691e";
  if (p >= 0.5) return "#c99a1e";
  return "#3d7a5b";
}

export default function Gauge({ day, lang }: { day: DayForecast; lang: Lang }) {
  const t = COPY[lang];
  const clamped = Math.max(0, Math.min(100, day.score));
  const tScore = clamped / 100;
  const dot = point(tScore, R);
  const color = day.level_meta.color;

  return (
    <div className="card relative overflow-hidden rounded-3xl p-6 sm:p-7">
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-[0.18] blur-2xl"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">{t.riskNow}</p>
          <p className="mt-1 text-sm font-medium text-ink-500">
            {lang === "ha" ? day.date_label_ha : day.date_label_en}
            {day.is_today ? (
              <span className="ml-2 rounded-full bg-ink-900/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-500">
                {t.today}
              </span>
            ) : null}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: `${color}18`, color }}
        >
          {day.level_meta.emoji} {lang === "ha" ? day.level_meta.ha : day.level_meta.en}
        </span>
      </div>

      <div className="relative mx-auto mt-2 w-full max-w-[340px]">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full"
          role="img"
          aria-label={`${t.riskNow}: ${clamped} / 100`}
        >
          <defs>
            <linearGradient id="gauge-fill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity="0.65" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>

          <path
            d={arcPath(0, 1)}
            fill="none"
            stroke="#efe3cf"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          <path
            d={arcPath(0, 1)}
            fill="none"
            stroke="url(#gauge-fill)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="arc-track"
            strokeDasharray={ARC_LEN}
            strokeDashoffset={(1 - tScore) * ARC_LEN}
          />

          {[0.5, 0.75, 0.9].map((cut) => {
            const inner = point(cut, R - STROKE / 2 - 5);
            const outer = point(cut, R + STROKE / 2 + 5);
            return (
              <line
                key={cut}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#1d1712"
                strokeOpacity={0.22}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}

          <circle cx={dot.x} cy={dot.y} r={7} fill="#fffdf8" stroke={color} strokeWidth={3} />
        </svg>

        <div className="pointer-events-none absolute inset-x-0 top-[38%] flex flex-col items-center sm:top-[36%]">
          <div className="flex items-baseline gap-1">
            <span className="tabular text-5xl font-semibold tracking-tight text-ink-900">
              {Math.round(clamped)}
            </span>
            <span className="text-sm font-medium text-ink-400">/100</span>
          </div>
          <span className="mt-1 text-xs text-ink-400">{t.outOf}</span>
        </div>
      </div>

      <p className="mt-1 text-center font-display text-xl leading-snug text-ink-900">
        {lang === "ha" ? day.headline.ha : day.headline.en}
      </p>
      <p className="mt-1 text-center text-sm text-ink-500">
        {lang === "ha" ? day.level_meta.blurb_ha : day.level_meta.blurb_en}
      </p>

      <div className="mt-5 space-y-2.5 border-t border-sand-200 pt-5">
        {day.components.map((c) => {
          const p = c.percentile ?? 0;
          const label = lang === "ha" ? c.label_ha : c.label_en;
          const value =
            c.key === "aod" ? num(c.value, 2) : c.key === "wind" ? num(c.value, 1) : num(c.value, 0);
          return (
            <div key={c.key} className="grid grid-cols-[1fr_auto] gap-x-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] text-ink-700">{label}</span>
                <span className="tabular text-[11px] text-ink-400">
                  {value} {UNITS[c.key] ?? c.unit}
                </span>
              </div>
              <span className="tabular w-10 text-right text-[11px] font-medium text-ink-500">
                {pct(p)}
              </span>
              <div className="col-span-2 mt-1 h-1.5 overflow-hidden rounded-full bg-sand-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, p * 100)}%`, background: colourFor(p) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-400">
        {lang === "ha"
          ? `An kwatanta da kwanaki ${day.basis.sample_days} na wannan lokaci a shekaru 4 da suka wuce.`
          : `Compared with ${day.basis.sample_days} days from this same window across four harmattan seasons.`}
      </p>
    </div>
  );
}
