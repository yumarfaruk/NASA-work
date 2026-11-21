"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDate } from "@/lib/format";
import type { Evidence, Lang } from "@/lib/types";

export default function LiveChart({ evidence, lang }: { evidence: Evidence; lang: Lang }) {
  const data = evidence.live.map((p) => ({ ...p, label: shortDate(p.date, lang) }));
  const p90 = evidence.nasa.percentiles.p90;
  const aodMax = Math.max(
    0.8,
    ...data.map((d) => d.aod ?? 0),
    (p90 ?? 0) * 1.15,
  );

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="dustFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bf5a30" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#bf5a30" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 4" stroke="#e6d9c4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#8c7a66" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={14}
          />
          <YAxis
            yAxisId="dust"
            tick={{ fontSize: 10, fill: "#8c7a66" }}
            axisLine={false}
            tickLine={false}
            width={46}
            tickFormatter={(v: number) => `${v}`}
          />
          <YAxis
            yAxisId="aod"
            orientation="right"
            tick={{ fontSize: 10, fill: "#2c5f46" }}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={[0, Math.ceil(aodMax * 10) / 10]}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <Tooltip content={<ChartTip lang={lang} />} cursor={{ stroke: "#cbb493", strokeDasharray: "3 3" }} />
          <Area
            yAxisId="dust"
            type="monotone"
            dataKey="dust"
            name={lang === "ha" ? "Ƙura" : "Dust"}
            stroke="#bf5a30"
            strokeWidth={2}
            fill="url(#dustFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fffdf8" }}
            unit=" µg/m³"
          />
          <Line
            yAxisId="aod"
            type="monotone"
            dataKey="aod"
            name="AOD"
            stroke="#2c5f46"
            strokeWidth={1.8}
            dot={false}
            strokeDasharray="1 0"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fffdf8" }}
          />
          {p90 ? (
            <ReferenceLine
              yAxisId="aod"
              y={p90}
              stroke="#2c5f46"
              strokeDasharray="5 5"
              strokeOpacity={0.55}
              label={{
                value: `NASA p90 ${p90}`,
                position: "insideTopRight",
                fill: "#2c5f46",
                fontSize: 9,
              }}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTip({ active, payload, label, lang }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-sand-200 bg-white/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur">
      <p className="mb-1 font-semibold text-ink-900">{label}</p>
      <p className="text-clay-600">
        {lang === "ha" ? "Ƙura" : "Dust"}: <span className="tabular font-medium">{row.dust ?? "—"}</span> µg/m³
      </p>
      <p className="text-palm-700">
        AOD: <span className="tabular font-medium">{row.aod ?? "—"}</span>
      </p>
      <p className="text-ink-400">
        PM10: <span className="tabular">{row.pm10 ?? "—"}</span> µg/m³
      </p>
      {row.precip ? (
        <p className="text-sky-700">
          {lang === "ha" ? "Ruwa" : "Rain"}: <span className="tabular">{row.precip}</span> mm
        </p>
      ) : null}
    </div>
  );
}
