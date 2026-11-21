"use client";

import { GraduationCap, HeartPulse, Shirt, ShoppingBasket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { COPY } from "@/lib/i18n";
import type { DayForecast, Lang } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  shirt: Shirt,
  "shopping-basket": ShoppingBasket,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
};

const TOPIC_KEYS = ["laundry", "market", "school", "health"] as const;

export default function AdviceGrid({ day, lang }: { day: DayForecast; lang: Lang }) {
  const t = COPY[lang];
  const color = day.level_meta.color;

  return (
    <section id="advice" className="scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="label">{t.adviceTitle}</p>
          <h2 className="mt-1 font-display text-2xl text-ink-900 sm:text-3xl">
            {lang === "ha" ? day.date_label_ha : day.date_label_en}
            <span className="ml-2 align-middle text-base font-sans font-normal text-ink-400">
              · {lang === "ha" ? day.level_meta.ha : day.level_meta.en}
            </span>
          </h2>
        </div>
        <p className="text-xs text-ink-400">
          {lang === "ha"
            ? "Shawara ce ta gama-gari, ba magani ba."
            : "General guidance, not medical advice."}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TOPIC_KEYS.map((topic) => {
          const item = day.advice[topic];
          const Icon = ICONS[item.icon] ?? Shirt;
          return (
            <article
              key={topic}
              className="card group relative overflow-hidden rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }}
              />
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: `${color}16`, color }}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  {t[topic]}
                </span>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ink-700">
                {lang === "ha" ? item.ha : item.en}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
