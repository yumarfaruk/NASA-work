"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDate } from "@/lib/format";
import type { Evidence, Lang } from "@/lib/types";

export default function NasaChart({ evidence, lang }: { evidence: Evidence; lang: Lang }) {
  const data = evidence.nasa.series.map((p) => ({
    ...p,
    label: shortDate(p.date, lang),
  }));
  const { p50, p90 } = evidence.nasa.percentiles;
  const tickEvery = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 10, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="nasaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e6b566" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#e6b566" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#3a332a" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "#a89a86" }}
            axisLine={false}
            tickLine={false}
            interval={tickEvery}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#a89a86" }}
            axisLine={false}
            tickLine={false}
            width={44}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #3a332a",
              background: "rgba(21,18,14,0.96)",
              color: "#f8f1e3",
              fontSize: 11,
            }}
            labelStyle={{ color: "#f8f1e3" }}
            formatter={(v: number) => [v.toFixed(2), "AOD 550 nm"]}
          />
          <Area
            type="monotone"
            dataKey="aod"
            stroke="#e6b566"
            strokeWidth={2}
            fill="url(#nasaFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#15120e" }}
          />
          {p50 ? (
            <ReferenceLine
              y={p50}
              stroke="#8fa88f"
              strokeDasharray="4 4"
              label={{ value: `p50 ${p50}`, position: "insideBottomRight", fill: "#8fa88f", fontSize: 9 }}
            />
          ) : null}
          {p90 ? (
            <ReferenceLine
              y={p90}
              stroke="#d2691e"
              strokeDasharray="4 4"
              label={{ value: `p90 ${p90}`, position: "insideTopRight", fill: "#e08a55", fontSize: 9 }}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
