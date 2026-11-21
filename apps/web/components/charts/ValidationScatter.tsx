"use client";

import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { Lang, Validation } from "@/lib/types";

export default function ValidationScatter({
  validation,
  lang,
}: {
  validation: Validation;
  lang: Lang;
}) {
  const samples = validation.samples ?? [];
  if (!samples.length) return null;

  const max = Math.max(
    ...samples.map((s) => Math.max(s.aeronet_aod500, s.merra2_aod550)),
  );
  const lim = Math.ceil((max + 0.1) * 10) / 10;

  return (
    <div className="h-[230px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 12, left: -26, bottom: 0 }}>
          <CartesianGrid stroke="#3a332a" strokeDasharray="3 4" />
          <XAxis
            type="number"
            dataKey="merra2_aod550"
            name="MERRA-2"
            domain={[0, lim]}
            tick={{ fontSize: 9, fill: "#a89a86" }}
            axisLine={false}
            tickLine={false}
            tickCount={5}
          />
          <YAxis
            type="number"
            dataKey="aeronet_aod500"
            name="AERONET"
            domain={[0, lim]}
            tick={{ fontSize: 9, fill: "#a89a86" }}
            axisLine={false}
            tickLine={false}
            tickCount={5}
            width={48}
          />
          <ZAxis range={[26, 26]} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #3a332a",
              background: "rgba(21,18,14,0.96)",
              color: "#f8f1e3",
              fontSize: 11,
            }}
            formatter={(value: number, name: string) => [value.toFixed(2), name]}
          />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: lim, y: lim },
            ]}
            stroke="#6b6152"
            strokeDasharray="5 5"
          />
          <Scatter data={samples} fill="#e6b566" fillOpacity={0.85} />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-[#8e8271]">
        {lang === "ha" ? "AERONET (y) da MERRA-2 (x), AOD" : "AERONET (y) vs MERRA-2 (x), AOD"}
      </p>
    </div>
  );
}
