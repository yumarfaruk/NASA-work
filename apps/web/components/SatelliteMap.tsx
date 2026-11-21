"use client";

import { useState } from "react";
import { ExternalLink, Layers } from "lucide-react";
import { COPY } from "@/lib/i18n";
import type { Lang, MapData } from "@/lib/types";

export default function SatelliteMap({ map, lang }: { map: MapData; lang: Lang }) {
  const t = COPY[lang];
  const [active, setActive] = useState("truecolor");
  const [failed, setFailed] = useState(false);

  const base = map.layers.find((l) => l.id === "truecolor") ?? map.layers[0];
  const overlay = active === "truecolor" ? null : map.layers.find((l) => l.id === active);
  const activeLayer = map.layers.find((l) => l.id === active) ?? base;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-sand-300/60 bg-night-900">
        {!failed ? (
          <>
            <img
              src={base.url}
              alt="NASA satellite true colour imagery over northern Nigeria"
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setFailed(true)}
            />
            {overlay ? (
              <img
                key={overlay.id}
                src={overlay.url}
                alt={overlay.label}
                className="absolute inset-0 h-full w-full object-cover opacity-90"
                onError={() => setFailed(true)}
              />
            ) : null}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_40%,#3a2f24,#15120e)] p-6 text-center">
            <p className="text-sm font-medium text-sand-100">
              {lang === "ha" ? "Hoton tauraron ɗan adam bai iso ba" : "Satellite image unavailable"}
            </p>
            <p className="max-w-xs text-xs text-sand-400">
              {lang === "ha"
                ? "NASA GIBS na iya jinkiri. Gwada wani layer ko sake loda shafi."
                : "NASA GIBS may be delayed for this date. Try another layer or reload."}
            </p>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {map.layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => {
                setActive(layer.id);
                setFailed(false);
              }}
              className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition ${
                active === layer.id
                  ? "bg-sand-50 text-ink-900 shadow"
                  : "bg-night-900/60 text-sand-100 backdrop-blur hover:bg-night-900/80"
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>

        <div className="absolute right-3 top-3 rounded-full bg-night-900/65 px-2.5 py-1 text-[10px] font-medium text-sand-100 backdrop-blur">
          {map.date}
        </div>

        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${map.marker.left_pct}%`, top: `${map.marker.top_pct}%` }}
        >
          <span className="pulse-ring absolute inset-0 -m-1 rounded-full bg-white/60" />
          <span className="relative block h-2.5 w-2.5 rounded-full border-2 border-white bg-clay-500 shadow" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-night-900/75 px-2 py-0.5 text-[10px] font-semibold text-sand-50 backdrop-blur">
            Gombe
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-night-900/85 to-transparent p-3 pt-8">
          <div>
            <p className="flex items-center gap-1 text-[10px] text-sand-300">
              <Layers className="h-3 w-3" /> {activeLayer.label}
            </p>
            <p className="text-[10px] text-sand-400">
              {map.attribution} · {activeLayer.note}
            </p>
          </div>
          <a
            href={map.worldview_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sand-50 px-2.5 py-1.5 text-[10px] font-semibold text-ink-900"
          >
            Worldview <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-400">
        <p className="max-w-lg leading-relaxed">
          {lang === "ha"
            ? "Layer na AOD yana nuna inda ƙura ta fi yawa; UV index yana nuna ƙura mai shan haske."
            : "The AOD layer shows where dust is thickest; the UV index highlights absorbing dust and smoke."}
        </p>
        <a
          href={map.worldview_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-ink-600 underline decoration-sand-400 underline-offset-4 hover:text-ink-900"
        >
          {t.worldview} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
