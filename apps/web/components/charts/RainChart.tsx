"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDate } from "@/lib/format";
import type { Evidence, Lang } from "@/lib/types";

export default function RainChart({ evidence, lang }: { evidence: Evidence; lang: Lang }) {
  const data = evidence.live.map((p) => ({
    label: shortDate(p.date, lang),
    rain: p.precip ?? 0,
  }));
  const hasRain = data.some((d) => d.rain > 0);

  return (
    <div className="relative h-[150px] w-full">
      {!hasRain ? (
        <p className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center text-[11px] text-ink-400">
          {lang === "ha" ? "Babu ruwan sama a kwanaki 14 da suka wuce" : "No rain recorded in the last 14 days"}
        </p>
      ) : null}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 6, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 4" stroke="#e6d9c4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "#8c7a66" }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#8c7a66" }}
            axisLine={false}
            tickLine={false}
            width={40}
            unit="mm"
            domain={[0, 20]}
            ticks={[0, 5, 10, 15, 20]}
          />
          <Tooltip
            cursor={{ fill: "rgba(203,180,147,0.15)" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e3d2b6",
              fontSize: 11,
              background: "rgba(255,253,248,0.97)",
            }}
            formatter={(v: number) => [`${v} mm`, lang === "ha" ? "Ruwa" : "Rain"]}
          />
          <ReferenceLine
            y={15}
            stroke="#c99a1e"
            strokeDasharray="4 4"
            label={{
              value: lang === "ha" ? "lura 15mm" : "watch 15mm",
              position: "insideTopRight",
              fontSize: 9,
              fill: "#c99a1e",
            }}
          />
          <Bar dataKey="rain" fill="#5d8aa8" radius={[3, 3, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
