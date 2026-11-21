"use client";

import { ExternalLink, Github } from "lucide-react";
import { COPY } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export default function Footer({
  sources,
  lang,
  disclaimer,
}: {
  sources: { name: string; url: string; role: string }[];
  lang: Lang;
  disclaimer: { en: string; ha: string };
}) {
  const t = COPY[lang];

  return (
    <footer id="sources" className="mt-14 border-t border-sand-200/80 pb-10 pt-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.6fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/logo-mark.svg" alt="" className="h-9 w-9" />
            <div>
              <p className="font-display text-lg font-semibold text-ink-900">Ƙura Alert</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-400">Gombe · Nigeria</p>
            </div>
          </div>
          <p className="mt-3 max-w-sm text-[11px] leading-relaxed text-ink-500">
            {lang === "ha"
              ? "Hasashen ƙurar harmattan da faɗakarwar ambaliya, cikin Hausa da Turanci."
              : "A harmattan dust forecast and flood early warning for Gombe, in Hausa and English."}
          </p>
          <p className="mt-3 max-w-sm text-[11px] font-medium text-ink-600">
            {t.footerNote}
          </p>
          <p className="mt-1 max-w-sm text-[10px] text-ink-400">
            {lang === "ha" ? disclaimer.ha : disclaimer.en}
          </p>
          <p className="mt-2 max-w-sm text-[10px] font-medium text-amber-700">
            {t.hausaReview}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px]">
            <a
              href="https://github.com/Icedmist/kura-alert"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-white/60 px-3 py-1.5 font-medium text-ink-700 hover:text-ink-900"
            >
              <Github className="h-3.5 w-3.5" /> github.com/Icedmist/kura-alert
            </a>
            <span className="text-ink-400">{t.built}</span>
          </div>
        </div>

        <div>
          <p className="label">{t.sources}</p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {sources.map((s) => (
              <li key={s.name} className="rounded-xl border border-sand-200/70 bg-white/45 px-3 py-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-1.5 text-[11px] font-semibold text-ink-800 hover:text-clay-600"
                >
                  <span className="flex-1">{s.name}</span>
                  <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-ink-300 group-hover:text-clay-500" />
                </a>
                <p className="mt-0.5 text-[10px] leading-snug text-ink-400">{s.role}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] leading-relaxed text-ink-400">
            {lang === "ha"
              ? "Bayanan NASA ne a buɗe; CAMS ta Open-Meteo na ba da hasashen ƙura na yau da kullum. An gina a matsayin gwajin hackathon, ba aikin hukuma ba."
              : "NASA data is open; CAMS via Open-Meteo supplies the live dust fields. Built as a hackathon prototype, not an official forecast service."}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-sand-200/70 pt-4 text-[10px] text-ink-400">
        <span>© 2026 Ƙura Alert · MIT licensed</span>
        <span className="font-mono">v0.1.0 · Gombe build</span>
      </div>
    </footer>
  );
}
