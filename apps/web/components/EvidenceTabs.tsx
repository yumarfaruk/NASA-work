"use client";

import { useState } from "react";
import { Activity, CloudRain, Satellite, Sparkles } from "lucide-react";
import LiveChart from "@/components/charts/LiveChart";
import NasaChart from "@/components/charts/NasaChart";
import RainChart from "@/components/charts/RainChart";
import ValidationScatter from "@/components/charts/ValidationScatter";
import SatelliteMap from "@/components/SatelliteMap";
import { COPY } from "@/lib/i18n";
import { num, shortDate } from "@/lib/format";
import type { Evidence, Lang, MapData, Validation } from "@/lib/types";

type Tab = "live" | "nasa" | "satellite";

const TABS: { id: Tab; icon: typeof Activity }[] = [
  { id: "live", icon: Activity },
  { id: "nasa", icon: Sparkles },
  { id: "satellite", icon: Satellite },
];

export default function EvidenceTabs({
  evidence,
  validation,
  map,
  lang,
}: {
  evidence: Evidence;
  validation: Validation;
  map: MapData;
  lang: Lang;
}) {
  const t = COPY[lang];
  const [tab, setTab] = useState<Tab>("live");

  const latest = evidence.live[evidence.live.length - 1];
  const peak = evidence.live.reduce(
    (best, point) => ((point.dust ?? 0) > (best.dust ?? 0) ? point : best),
    evidence.live[0] ?? { date: "", dust: 0 },
  );
  const dustRefs = evidence.climatology.seasonal_references?.dust;

  return (
    <section id="evidence" className="scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">{t.evidence}</p>
          <h2 className="mt-1 font-display text-2xl text-ink-900 sm:text-3xl">
            {lang === "ha" ? "Bayanai, ba maganar baka ba" : "Show the data, not just the claim"}
          </h2>
        </div>
        <div className="flex rounded-full border border-sand-200 bg-white/60 p-0.5 text-[11px] font-semibold">
          {TABS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                tab === id ? "bg-ink-900 text-sand-50" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.tabs[id]}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === "live" ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="card rounded-2xl p-4 sm:p-5 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg text-ink-900">{t.liveTitle}</h3>
                <p className="mt-0.5 max-w-md text-[11px] leading-relaxed text-ink-400">{t.liveSub}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-ink-500">
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-full bg-clay-500" /> {t.dust}
                </span>
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-full bg-palm-700" /> AOD
                </span>
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-full border border-palm-700 border-dashed" /> NASA p90
                </span>
              </div>
            </div>
            <div className="mt-3">
              <LiveChart evidence={evidence} lang={lang} />
            </div>
            <p className="mt-1 text-[10px] text-ink-400">
              {evidence.live_source.name} · {evidence.live_source.note}
            </p>
          </div>

          <div className="card rounded-2xl p-4 sm:p-5">
            <h3 className="font-display text-lg text-ink-900">
              {lang === "ha" ? "A yau" : "Today at a glance"}
            </h3>
            <div className="mt-3 space-y-2.5">
              <Stat
                label={lang === "ha" ? "Ƙura ta yanzu" : "Latest dust"}
                value={`${num(latest?.dust)} µg/m³`}
                hint={latest ? shortDate(latest.date, lang) : "—"}
              />
              <Stat
                label="AOD 550 nm"
                value={num(latest?.aod, 2)}
                hint={latest ? shortDate(latest.date, lang) : "—"}
              />
              <Stat
                label={lang === "ha" ? "Mafi yawan ƙura" : "Peak dust, 14 days"}
                value={`${num(peak?.dust)} µg/m³`}
                hint={peak?.date ? shortDate(peak.date, lang) : "—"}
              />
              <div className="rounded-xl bg-sand-100/80 p-3">
                <p className="text-[10px] uppercase tracking-wider text-ink-400">
                  {lang === "ha" ? "Al'ada a wannan lokaci" : "Normal for this window"}
                </p>
                <p className="tabular mt-1 text-sm font-semibold text-ink-900">
                  {num(dustRefs?.p50)} µg/m³
                  <span className="ml-1 text-[11px] font-normal text-ink-400">
                    p50 · {num(dustRefs?.p90)} p90
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-ink-400">
                  {lang === "ha"
                    ? `${dustRefs?.n ?? 0} kwanaki, shekaru 4`
                    : `${dustRefs?.n ?? 0} days across 4 seasons`}
                </p>
              </div>
            </div>
          </div>

          <div className="card rounded-2xl p-4 sm:p-5 lg:col-span-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-[#5d8aa8]" />
                <h3 className="text-sm font-semibold text-ink-900">{t.rainfall} · 14 days</h3>
              </div>
              <span className="text-[10px] text-ink-400">
                {lang === "ha" ? "Layin lura: 15 mm / rana" : "Watch line: 15 mm / day"}
              </span>
            </div>
            <div className="mt-2">
              <RainChart evidence={evidence} lang={lang} />
            </div>
          </div>
        </div>
      ) : null}

      {tab === "nasa" ? (
        <div className="mt-4 overflow-hidden rounded-3xl bg-night-900 p-5 text-sand-100 shadow-lift sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-sand-400">
                NASA POWER · MERRA-2
              </p>
              <h3 className="mt-1 font-display text-xl text-sand-50 sm:text-2xl">{t.nasaTitle}</h3>
              <p className="mt-1 max-w-lg text-[11px] leading-relaxed text-sand-400">{t.nasaSub}</p>
            </div>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[10px] font-medium text-amber-200">
              {evidence.nasa.latest_date ?? "—"} · {evidence.nasa.lag_days ?? "—"} {t.lag}
            </span>
          </div>

          <div className="mt-4 grid gap-5 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <NasaChart evidence={evidence} lang={lang} />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <DarkStat
                  label={lang === "ha" ? "Lokaci" : "Season"}
                  value={evidence.nasa.season_label ?? "—"}
                  hint={`${evidence.nasa.series.length} ${t.days}`}
                />
                <DarkStat label="p50" value={num(evidence.nasa.percentiles.p50, 2)} hint="AOD" />
                <DarkStat label="p90" value={num(evidence.nasa.percentiles.p90, 2)} hint="AOD" />
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-sand-400">{t.nasaLag}</p>
              <p className="mt-1 font-mono text-[9px] text-sand-400/70">{evidence.nasa.source}</p>
            </div>

            <div className="rounded-2xl border border-night-700 bg-night-800 p-4 lg:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-sand-50">{t.validationTitle}</h4>
                <span className="rounded-full bg-palm-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-palm-500">
                  {validation.window?.start?.slice(0, 7) ?? "—"}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-sand-400">{t.validationSub}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <DarkStat
                  label={t.correlation}
                  value={validation.pearson_r !== null && validation.pearson_r !== undefined ? validation.pearson_r.toFixed(2) : "—"}
                  hint="r"
                />
                <DarkStat label={t.nDays} value={String(validation.n_days ?? 0)} hint="n" />
                <DarkStat
                  label={t.bias}
                  value={validation.mean_bias_aeronet_minus_merra2 !== null && validation.mean_bias_aeronet_minus_merra2 !== undefined ? validation.mean_bias_aeronet_minus_merra2.toFixed(2) : "—"}
                  hint="AOD"
                />
              </div>
              <div className="mt-2">
                <ValidationScatter validation={validation} lang={lang} />
              </div>
              <p className="text-[9px] leading-relaxed text-sand-400/80">{validation.caveat}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-night-700 pt-4 text-[10px] text-sand-400">
            <span>
              {lang === "ha" ? "Kwatancen CAMS da MERRA-2" : "CAMS vs MERRA-2"}:{" "}
              <strong className="text-sand-100">
                r = {evidence.crosscheck.pearson_r ?? "—"}
              </strong>{" "}
              ({evidence.crosscheck.n ?? 0} {t.days})
            </span>
            <span>
              {t.bias}: <strong className="text-sand-100">{evidence.crosscheck.mean_bias_merra2_minus_cams ?? "—"}</strong>
            </span>
            <span className="text-sand-400/70">{evidence.crosscheck.window}</span>
          </div>
        </div>
      ) : null}

      {tab === "satellite" ? (
        <div className="card mt-4 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-display text-lg text-ink-900">{t.satelliteTitle}</h3>
              <p className="mt-0.5 max-w-xl text-[11px] leading-relaxed text-ink-400">
                {t.satelliteSub}
              </p>
            </div>
            <span className="rounded-full bg-sand-200/60 px-2.5 py-1 text-[10px] font-medium text-ink-500">
              {lang === "ha" ? "MODIS / VIIRS / OMI" : "MODIS · VIIRS · OMI"}
            </span>
          </div>
          <div className="mt-3">
            <SatelliteMap map={map} lang={lang} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-sand-200/70 pb-2">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-ink-400">{label}</p>
        <p className="tabular mt-0.5 text-lg font-semibold text-ink-900">{value}</p>
      </div>
      <span className="text-[10px] text-ink-400">{hint}</span>
    </div>
  );
}

function DarkStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-night-700 bg-night-900/60 p-2.5">
      <p className="text-[9px] uppercase tracking-wider text-sand-400">{label}</p>
      <p className="tabular mt-1 text-base font-semibold text-sand-50">{value}</p>
      <p className="text-[9px] text-sand-400/70">{hint}</p>
    </div>
  );
}
