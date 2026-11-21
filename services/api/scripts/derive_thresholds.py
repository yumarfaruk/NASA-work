#!/usr/bin/env python
"""Derive the Gombe harmattan climatology used by the dust index.

Pulls four harmattan seasons (Nov–Mar) of CAMS dust/AOD and ERA5 wind/humidity
from Open-Meteo, plus NASA POWER MERRA-2 AOD for the same days, then writes
data/thresholds.json:

  * empirical distributions for the four index inputs
  * NASA MERRA-2 AOD percentiles and the most recent complete season series
  * a CAMS-vs-MERRA-2 AOD cross-check (n, Pearson r, bias)

Run once; commit the JSON so the demo works offline.

    python scripts/derive_thresholds.py
"""
from __future__ import annotations

import asyncio
import json
import statistics
import sys
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.sources import openmeteo, power  # noqa: E402

DATA = Path(__file__).resolve().parent.parent.parent.parent / "data"
DATA.mkdir(parents=True, exist_ok=True)

SEASONS = [
    ("2022-11-01", "2023-03-31", "2022/23"),
    ("2023-11-01", "2024-03-31", "2023/24"),
    ("2024-11-01", "2025-03-31", "2024/25"),
    ("2025-11-01", "2026-03-31", "2025/26"),
]


def pct(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return round(ordered[0], 3)
    k = (len(ordered) - 1) * q
    lo, hi = int(k), min(int(k) + 1, len(ordered) - 1)
    return round(ordered[lo] + (ordered[hi] - ordered[lo]) * (k - lo), 3)


def summarise(values: list[float]) -> dict:
    clean = sorted(round(v, 3) for v in values if v is not None)
    return {
        "sample": clean,
        "n": len(clean),
        "p10": pct(clean, 0.10),
        "p25": pct(clean, 0.25),
        "p50": pct(clean, 0.50),
        "p75": pct(clean, 0.75),
        "p90": pct(clean, 0.90),
        "p95": pct(clean, 0.95),
        "mean": round(statistics.mean(clean), 3) if clean else None,
    }


async def main() -> None:
    raw_path = DATA / "climatology_raw.json"
    if raw_path.exists():
        rows = json.loads(raw_path.read_text())
        print(f"  reusing {raw_path.name}: {len(rows)} days", flush=True)
    else:
        rows = []
        for start, end, label in SEASONS:
            print(f"  fetching {label} ({start} → {end}) …", flush=True)
            season_rows = await openmeteo.fetch_season_archive(start, end)
            print(f"    {len(season_rows)} usable days")
            for row in season_rows:
                row["season"] = label
            rows.extend(season_rows)
        raw_path.write_text(json.dumps(rows, indent=0))
        print(f"  cached {raw_path.name}", flush=True)

    if len(rows) < 100:
        raise SystemExit("not enough climatology days; refusing to write thresholds")

    dust = [r["dust"] for r in rows if r.get("dust") is not None]
    aod = [r["aod"] for r in rows if r.get("aod") is not None]
    wind = [r["wind"] for r in rows if r.get("wind") is not None]
    rh = [r["rh"] for r in rows if r.get("rh") is not None]

    print("  fetching NASA POWER MERRA-2 AOD …", flush=True)
    nasa = await power.fetch_daily("2022-11-01", date.today().isoformat(), parameters="AOD_55")
    nasa_days = nasa["days"]
    latest = power.latest_with_aod(nasa_days)
    lag = power.lag_days(latest)

    # Most recent complete harmattan season with a dense NASA record.
    season_series: list[dict] = []
    latest_complete = None
    for _, _, label in reversed(SEASONS):
        ys = int(label.split("/")[0])
        start, end = date(ys, 11, 1), date(ys + 1, 3, 31)
        sample = [
            {"date": d, "aod": v["AOD_55"]}
            for d, v in sorted(nasa_days.items())
            if start.isoformat() <= d <= end.isoformat() and v.get("AOD_55") is not None
        ]
        if len(sample) >= 120:
            season_series = sample
            latest_complete = label
            break

    nasa_season_values = [item["aod"] for item in season_series]

    # Cross-check: CAMS AOD vs MERRA-2 AOD on overlapping harmattan days.
    pairs = [
        (r["aod"], nasa_days[r["date"]]["AOD_55"])
        for r in rows
        if r.get("aod") is not None
        and r["date"] in nasa_days
        and nasa_days[r["date"]].get("AOD_55") is not None
    ]
    r_value = None
    bias = None
    if len(pairs) >= 10:
        xs = [p[0] for p in pairs]
        ys = [p[1] for p in pairs]
        mx, my = statistics.mean(xs), statistics.mean(ys)
        num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
        den = (sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys)) ** 0.5
        r_value = round(num / den, 3) if den else None
        bias = round(sum(y - x for x, y in pairs) / len(pairs), 3)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "method": (
            "Daily means of hourly CAMS dust/AOD and ERA5 wind/RH for Gombe "
            "(10.29N, 11.17E), harmattan months Nov-Mar only. Empirical "
            "percentiles feed a weighted index; level cuts are composite "
            "percentiles 50/75/90."
        ),
        "seasons": [s[2] for s in SEASONS],
        "sample_days": len(rows),
        "climatology": [
            {
                "date": r["date"],
                "dust": r.get("dust"),
                "aod": r.get("aod"),
                "wind": r.get("wind"),
                "rh": r.get("rh"),
            }
            for r in rows
        ],
        "distributions": {
            "dust": summarise(dust),
            "aod": summarise(aod),
            "wind": summarise(wind),
            "rh": summarise(rh),
        },
        "nasa": {
            "latest_date": latest,
            "lag_days": lag,
            "season_label": latest_complete,
            "p50": pct(nasa_season_values, 0.50),
            "p90": pct(nasa_season_values, 0.90),
            "p95": pct(nasa_season_values, 0.95),
            "n": len(nasa_season_values),
        },
        "season_series": season_series,
        "crosscheck": {
            "n": len(pairs),
            "pearson_r": r_value,
            "mean_bias_merra2_minus_cams": bias,
            "window": f"{SEASONS[0][0]} → {SEASONS[-1][1]}",
            "note": "CAMS AOD (live source) vs NASA MERRA-2 AOD_55 (NASA baseline).",
        },
    }

    out = DATA / "thresholds.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=1))
    print(f"\nwrote {out} ({out.stat().st_size / 1024:.1f} KB)")
    print(f"  days: {len(rows)} | dust p50 {payload['distributions']['dust']['p50']} µg/m³"
          f" | dust p90 {payload['distributions']['dust']['p90']} µg/m³")
    print(f"  NASA latest AOD: {latest} (lag {lag} d) | r={r_value} n={len(pairs)}")


if __name__ == "__main__":
    asyncio.run(main())
