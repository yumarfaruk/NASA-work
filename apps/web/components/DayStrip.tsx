"use client";

import { COPY } from "@/lib/i18n";
import { num } from "@/lib/format";
import type { DayForecast, Lang } from "@/lib/types";

export default function DayStrip({
  days,
  selected,
  onSelect,
  lang,
}: {
  days: DayForecast[];
  selected: number;
  onSelect: (index: number) => void;
  lang: Lang;
}) {
  const t = COPY[lang];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3" role="tablist" aria-label="Forecast days">
      {days.map((day, i) => {
        const active = i === selected;
        const label =
          i === 0
            ? t.today
            : i === 1
              ? t.tomorrow
              : lang === "ha"
                ? day.weekday_ha
                : day.weekday_en;
        return (
          <button
            key={day.date}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(i)}
            className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 sm:p-4 ${
              active
                ? "border-ink-900/15 bg-white shadow-lift"
                : "border-sand-200/80 bg-white/55 hover:bg-white/80"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="label !text-[10px]">{label}</span>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: day.level_meta.color }}
              />
            </div>
            <div className="mt-1.5 text-sm font-semibold text-ink-900 sm:text-base">
              {lang === "ha"
                ? `${day.level_meta.emoji} ${day.level_meta.ha}`
                : `${day.level_meta.emoji} ${day.level_meta.en}`}
            </div>
            <div className="tabular mt-0.5 text-[11px] text-ink-400">
              {num(day.dust)} µg/m³ · {Math.round(day.score)}/100
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-sand-200">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, day.score)}%`, background: day.level_meta.color }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
