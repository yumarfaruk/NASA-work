"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Cpu, History, Languages, Satellite, Wind } from "lucide-react";
import AdviceGrid from "@/components/AdviceGrid";
import DayStrip from "@/components/DayStrip";
import EvidenceTabs from "@/components/EvidenceTabs";
import Footer from "@/components/Footer";
import Gauge from "@/components/Gauge";
import HazardPanel from "@/components/HazardPanel";
import Header from "@/components/Header";
import HowItWorks from "@/components/HowItWorks";
import MessageCard from "@/components/MessageCard";
import ReplayPanel from "@/components/ReplayPanel";
import SubscribeForm from "@/components/SubscribeForm";
import { COPY } from "@/lib/i18n";
import type {
  Evidence,
  Forecast,
  Lang,
  MapData,
  ReplayData,
  SensorLatest,
  SubscriberStats,
  Validation,
} from "@/lib/types";

export default function Dashboard({
  forecast,
  evidence,
  validation,
  map,
  sensors,
  stats,
  replay,
  degraded,
}: {
  forecast: Forecast;
  evidence: Evidence;
  validation: Validation;
  map: MapData;
  sensors: SensorLatest;
  stats: SubscriberStats;
  replay: ReplayData;
  degraded: boolean;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem("kura-lang");
    if (saved === "ha" || saved === "en") setLang(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("kura-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = COPY[lang];
  const days = forecast.days;
  const day = days[Math.min(selected, days.length - 1)];
  const safeDays = days.slice(0, 3);
  const topAlert = forecast.alerts?.[0];
  const dustLevel = day?.level_meta;
  const floodLevel = day?.flood?.level_meta;

  if (!day) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Forecast unavailable</h1>
        <p className="mt-2 text-sm text-ink-500">
          The API and the offline snapshot are both missing. Start the API with{" "}
          <code className="rounded bg-sand-200 px-1">make api</code>.
        </p>
      </main>
    );
  }

  return (
    <div id="top">
      <Header
        lang={lang}
        setLang={setLang}
        generatedAt={forecast.generated_at}
        dataMode={forecast.data_mode}
        degraded={degraded}
      />

      <main className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <section className="pt-7 sm:pt-10">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-clay-600">
            <span className="rounded-full bg-clay-500/10 px-2.5 py-1">
              NASA Space Apps Challenge 2026
            </span>
            <span className="text-ink-400">Gombe local event</span>
          </div>

          <h1 className="mt-3 max-w-3xl font-display text-[34px] leading-[1.06] tracking-tight text-ink-900 sm:text-5xl">
            {lang === "ha" ? (
              <>
                Ka san abin da ƙura za ta yi,
                <br className="hidden sm:block" /> kafin ka fita.
              </>
            ) : (
              <>
                Know what the dust will do,
                <br className="hidden sm:block" /> before you step out.
              </>
            )}
          </h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink-500 sm:text-sm">
            {t.subTagline}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-ink-500">
            <Chip icon={<Wind className="h-3 w-3" />} label={lang === "ha" ? "Hasashen kwana 3" : "3-day dust outlook"} />
            <Chip icon={<Languages className="h-3 w-3" />} label="Hausa + English" />
            <Chip icon={<Satellite className="h-3 w-3" />} label="NASA POWER · GIBS · AERONET" />
            <Chip icon={<Cpu className="h-3 w-3" />} label="Arduino ground node" />
            <a
              href="#replay"
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-50/70 px-2.5 py-1 font-medium text-amber-800 transition hover:bg-amber-100"
            >
              <History className="h-3 w-3" />
              {lang === "ha" ? "Bayanin tarihi" : "Historical replay"}
            </a>
          </div>
        </section>

        <section
          className={`mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border px-3.5 py-2.5 text-[11px] ${
            topAlert
              ? "border-red-300/50 bg-red-50/80 text-red-900"
              : "border-palm-500/25 bg-palm-500/[0.06] text-palm-700"
          }`}
        >
          {topAlert ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span className="font-semibold uppercase tracking-wider">
            {topAlert ? t.alertsLabel : t.earlyWarning}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-1.5 rounded-full" style={{ background: dustLevel?.color }} />
            {t.hazardDust}: <strong>{lang === "ha" ? dustLevel?.ha : dustLevel?.en}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-1.5 w-1.5 rounded-full" style={{ background: floodLevel?.color }} />
            {t.hazardFlood}: <strong>{lang === "ha" ? floodLevel?.ha : floodLevel?.en}</strong>
          </span>
          <span className="text-current/70">
            {topAlert ? (lang === "ha" ? topAlert.ha : topAlert.en) : t.noAlerts}
          </span>
          <a href="#warning" className="ml-auto shrink-0 font-semibold underline decoration-current/30 underline-offset-4">
            {lang === "ha" ? "Duba" : "See warning"}
          </a>
        </section>

        <div className="mt-4 grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Gauge day={day} lang={lang} />
          </div>
          <div className="flex flex-col gap-3 lg:col-span-7">
            <DayStrip days={safeDays} selected={selected} onSelect={setSelected} lang={lang} />
            <MessageCard day={day} lang={lang} uiLang={lang} />
          </div>
        </div>

        <div className="mt-10 space-y-10 sm:space-y-12">
          <HazardPanel day={day} days={safeDays} lang={lang} sensors={sensors} />
          <ReplayPanel replay={replay} lang={lang} />
          <AdviceGrid day={day} lang={lang} />
          <EvidenceTabs evidence={evidence} validation={validation} map={map} lang={lang} />

          <div className="grid items-start gap-3 lg:grid-cols-2">
            <HowItWorks thresholds={forecast.thresholds} lang={lang} />
            <div className="lg:sticky lg:top-20">
              <SubscribeForm lang={lang} stats={stats} />
            </div>
          </div>
        </div>

        <Footer sources={forecast.sources} lang={lang} disclaimer={forecast.disclaimer} />
      </main>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sand-300/70 bg-white/50 px-2.5 py-1">
      {icon}
      {label}
    </span>
  );
}
