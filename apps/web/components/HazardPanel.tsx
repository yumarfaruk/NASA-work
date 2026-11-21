"use client";

import { CloudRain, Cpu, Droplets, Radio, Thermometer, Waves } from "lucide-react";
import { COPY } from "@/lib/i18n";
import { num, shortDate, timeAgo } from "@/lib/format";
import type { DayForecast, Lang, SensorLatest } from "@/lib/types";

export default function HazardPanel({
  day,
  days,
  lang,
  sensors,
}: {
  day: DayForecast;
  days: DayForecast[];
  lang: Lang;
  sensors: SensorLatest;
}) {
  const t = COPY[lang];
  const flood = day.flood;
  const device = sensors.devices[0];

  return (
    <section id="warning" className="scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="label">{t.earlyWarning}</p>
          <h2 className="mt-1 font-display text-2xl text-ink-900 sm:text-3xl">
            {lang === "ha" ? "Ƙura da ambaliya, lokaci ɗaya" : "Dust and flood, in one window"}
          </h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-ink-400">{t.earlyWarningSub}</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-12">
        <article className="card overflow-hidden rounded-2xl p-5 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${flood?.level_meta.color ?? "#3d7a5b"}16`, color: flood?.level_meta.color ?? "#3d7a5b" }}
              >
                <Waves className="h-4.5 w-4.5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {t.flood} · {lang === "ha" ? "Ambaliya" : "early warning"}
                </p>
                <p className="text-[11px] text-ink-400">
                  {lang === "ha" ? "Daga ruwan sama na kwanaki 3" : "From the 3-day rainfall forecast"}
                </p>
              </div>
            </div>
            {flood ? (
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: `${flood.level_meta.color}18`,
                  color: flood.level_meta.color,
                }}
              >
                {flood.level_meta.emoji} {lang === "ha" ? flood.level_meta.ha : flood.level_meta.en}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: t.rain24, value: flood?.rain_24h, unit: "mm" },
              { label: t.rain72, value: flood?.rain_72h, unit: "mm" },
              { label: t.rain7, value: flood?.rain_7d_prior, unit: "mm" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-sand-200/80 bg-sand-50/60 p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-ink-400">{s.label}</p>
                <p className="tabular mt-1 text-lg font-semibold text-ink-900">
                  {num(s.value, 1)} <span className="text-[11px] font-normal text-ink-400">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex items-end justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">
                {t.rainfall} · 3 days
              </p>
              <div className="flex items-center gap-3 text-[10px] text-ink-400">
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#c99a1e]" />15</span>
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#d2691e]" />30</span>
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#b3261e]" />50 mm</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {days.map((d, i) => {
                const rain = d.flood?.rain_24h ?? 0;
                const h = Math.min(100, (rain / 50) * 100);
                return (
                  <div key={d.date} className="rounded-lg bg-sand-100/70 p-2">
                    <div className="flex h-16 items-end">
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${Math.max(3, h)}%`,
                          background: d.flood?.level_meta.color ?? "#3d7a5b",
                          opacity: 0.85,
                        }}
                      />
                    </div>
                    <p className="mt-1 truncate text-[10px] text-ink-400">
                      {i === 0 ? t.today : i === 1 ? t.tomorrow : shortDate(d.date, lang)}
                    </p>
                    <p className="tabular text-[11px] font-medium text-ink-700">{num(rain, 1)} mm</p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-ink-700">
            {flood ? (lang === "ha" ? flood.advice.ha : flood.advice.en) : null}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-wider text-ink-400">
            {lang === "ha"
              ? "Matakan: 15 mm lura · 30 mm haɗari · 50 mm mummunan haɗari"
              : "Thresholds: 15 mm watch · 30 mm high · 50 mm severe"}
          </p>
        </article>

        <article className="card relative overflow-hidden rounded-2xl p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900/5 text-ink-700">
                <Cpu className="h-4.5 w-4.5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{t.groundNode}</p>
                <p className="text-[11px] text-ink-400">
                  {lang === "ha" ? "Arduino + na'urori" : "Arduino + field sensors"}
                </p>
              </div>
            </div>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                device
                  ? "bg-palm-500/10 text-palm-700"
                  : "bg-ink-900/5 text-ink-400"
              }`}
            >
              <Radio className="h-3 w-3" />
              {device ? (device.simulated ? t.simulated : t.sensorLive) : "Offline"}
            </span>
          </div>

          {device ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Metric icon={<CloudRain className="h-3.5 w-3.5" />} label={`${t.dustSensor} PM2.5`} value={num(device.pm25, 0)} unit="µg/m³" />
                <Metric icon={<CloudRain className="h-3.5 w-3.5" />} label="PM10" value={num(device.pm10, 0)} unit="µg/m³" />
                <Metric icon={<Droplets className="h-3.5 w-3.5" />} label={t.rainfall} value={num(device.rain_mm, 1)} unit="mm" />
                <Metric icon={<Waves className="h-3.5 w-3.5" />} label={t.waterLevel} value={num(device.water_level_cm, 0)} unit="cm" />
                <Metric icon={<Thermometer className="h-3.5 w-3.5" />} label={lang === "ha" ? "Zafi" : "Temperature"} value={num(device.temp_c, 1)} unit="°C" />
                <Metric icon={<Droplets className="h-3.5 w-3.5" />} label={lang === "ha" ? "Danshi" : "Humidity"} value={num(device.humidity, 0)} unit="%" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-sand-200 pt-3 text-[11px] text-ink-400">
                <span className="font-mono">{device.device_id}</span>
                <span>
                  {t.lastReading}: {timeAgo(device.ts, lang)}
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-400">{t.sensorNote}</p>
            </>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-sand-300 bg-sand-50/50 p-4">
              <p className="text-sm font-semibold text-ink-700">{t.noNode}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-400">{t.nodeHint}</p>
              <p className="mt-3 font-mono text-[11px] text-ink-500">hardware/kura_node/kura_node.ino</p>
              <ul className="mt-3 space-y-1.5 text-[11px] text-ink-500">
                <li>• PMS5003 dust sensor → Serial1 (D0/D1)</li>
                <li>• Tipping-bucket rain gauge → D2</li>
                <li>• HC-SR04 water level → D3/D4</li>
                <li>• 16×2 I2C LCD + backlight → SDA/SCL</li>
              </ul>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-sand-200/80 bg-sand-50/60 p-2.5">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-400">
        {icon}
        <span className="truncate">{label}</span>
      </p>
      <p className="tabular mt-1 text-base font-semibold text-ink-900">
        {value} <span className="text-[10px] font-normal text-ink-400">{unit}</span>
      </p>
    </div>
  );
}
