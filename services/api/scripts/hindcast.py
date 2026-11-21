#!/usr/bin/env python
"""Historical sanity checks and a weight sensitivity check.

This is **not** a forecast verification. We do not have archived CAMS
forecasts from past days. What this script does is narrower and honest:

1. **Season-held-out replay.** Train the percentile thresholds on three
   harmattan seasons, score the fourth, and check that days in the dustiest
   decile of the held-out season land in High/Severe while the cleanest decile
   lands in Low/Moderate.
2. **NASA cross-source check.** For 2025/26, label the dustiest and cleanest
   days by NASA MERRA-2 AOD (not by the index's own dust input), then see what
   the CAMS/ERA5 index says.
3. **Weight sensitivity.** Recompute all 605 days under alternative weights and
   report how many levels change.

Output: data/hindcast.json

    cd services/api && .venv/bin/python scripts/hindcast.py
"""
from __future__ import annotations

import json
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import index  # noqa: E402

DATA = Path(__file__).resolve().parent.parent.parent.parent / "data"
THRESHOLDS = DATA / "thresholds.json"
RAW = DATA / "climatology_raw.json"
OUT = DATA / "hindcast.json"

SCENARIOS = {
    "baseline": {"dust": 0.50, "aod": 0.25, "wind": 0.15, "dryness": 0.10},
    "plausible_plus": {"dust": 0.55, "aod": 0.275, "wind": 0.165, "dryness": 0.11},
    "plausible_minus": {"dust": 0.45, "aod": 0.225, "wind": 0.135, "dryness": 0.09},
    "equal_weights": {"dust": 0.25, "aod": 0.25, "wind": 0.25, "dryness": 0.25},
    "dust_heavy": {"dust": 0.65, "aod": 0.15, "wind": 0.10, "dryness": 0.10},
    "aod_heavy": {"dust": 0.35, "aod": 0.40, "wind": 0.15, "dryness": 0.10},
    "no_wind_dryness": {"dust": 0.65, "aod": 0.35, "wind": 0.0, "dryness": 0.0},
    "wind_dry_heavy": {"dust": 0.35, "aod": 0.15, "wind": 0.30, "dryness": 0.20},
}

LEVEL_ORDER = ["low", "moderate", "high", "severe"]


def quantile(values: list[float], q: float) -> float:
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    k = (len(ordered) - 1) * q
    lo, hi = int(k), min(int(k) + 1, len(ordered) - 1)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (k - lo)


def counts(days: list[dict[str, Any]]) -> dict[str, int]:
    out = {level: 0 for level in LEVEL_ORDER}
    for day in days:
        out[day["level"]] += 1
    return out


def train_thresholds(base: dict[str, Any], test_season: str) -> dict[str, Any]:
    train = [row for row in base["climatology"] if row.get("season") != test_season]
    return {**base, "climatology": train}


def season_holdout(base: dict[str, Any], raw: list[dict[str, Any]]) -> dict[str, Any]:
    seasons = sorted({row["season"] for row in raw})
    results = []
    pooled_dusty: list[dict[str, Any]] = []
    pooled_clean: list[dict[str, Any]] = []

    for season in seasons:
        test_rows = [row for row in raw if row.get("season") == season]
        thresholds = train_thresholds(base, season)
        scored = []
        for row in test_rows:
            day = index.score_day(row, thresholds)
            scored.append({**row, "score": day["score"], "level": day["level"]})

        aods = [d["aod"] for d in scored if d.get("aod") is not None]
        if len(aods) < 20:
            continue
        high_cut = quantile(aods, 0.90)
        low_cut = quantile(aods, 0.10)
        dusty = [d for d in scored if d.get("aod") is not None and d["aod"] >= high_cut]
        clean = [d for d in scored if d.get("aod") is not None and d["aod"] <= low_cut]
        pooled_dusty.extend(dusty)
        pooled_clean.extend(clean)

        results.append(
            {
                "season": season,
                "days": len(scored),
                "label": "top/bottom decile by CAMS AOD in the held-out season",
                "aod_p90": round(high_cut, 3),
                "aod_p10": round(low_cut, 3),
                "dusty": {
                    "n": len(dusty),
                    "high_or_severe": sum(d["level"] in {"high", "severe"} for d in dusty),
                    "median_score": round(statistics.median(d["score"] for d in dusty), 1),
                },
                "clean": {
                    "n": len(clean),
                    "low_or_moderate": sum(d["level"] in {"low", "moderate"} for d in clean),
                    "median_score": round(statistics.median(d["score"] for d in clean), 1),
                },
            }
        )

    def summarise(rows: list[dict[str, Any]], target: set[str]) -> dict[str, Any]:
        return {
            "n": len(rows),
            "hit": sum(d["level"] in target for d in rows),
            "hit_rate": round(sum(d["level"] in target for d in rows) / len(rows), 3)
            if rows
            else None,
            "median_score": round(statistics.median(d["score"] for d in rows), 1) if rows else None,
            "levels": counts(rows),
        }

    return {
        "method": (
            "For each harmattan season, percentile thresholds are trained on the "
            "other three seasons. Days are labelled dusty/clean by the top/bottom "
            "decile of that held-out season's CAMS AOD, not by the index score."
        ),
        "seasons": results,
        "pooled": {
            "dusty": summarise(pooled_dusty, {"high", "severe"}),
            "clean": summarise(pooled_clean, {"low", "moderate"}),
        },
        "caveat": (
            "CAMS AOD is also a 25% input to the index, so this is a consistency "
            "check, not an independent forecast verification."
        ),
    }


def nasa_crosscheck(base: dict[str, Any], raw: list[dict[str, Any]]) -> dict[str, Any]:
    nasa = {row["date"]: row["aod"] for row in base.get("season_series", [])}
    rows = [row for row in raw if row["date"] in nasa and row.get("season") == "2025/26"]
    thresholds = train_thresholds(base, "2025/26")

    scored = []
    for row in rows:
        day = index.score_day(row, thresholds)
        scored.append(
            {
                "date": row["date"],
                "nasa_aod": round(float(nasa[row["date"]]), 3),
                "cams_dust": round(float(row["dust"]), 1),
                "score": day["score"],
                "level": day["level"],
            }
        )

    aods = [d["nasa_aod"] for d in scored]
    if not aods:
        return {"n": 0, "note": "No overlapping NASA days."}

    p90 = quantile(aods, 0.90)
    p10 = quantile(aods, 0.10)
    dusty = [d for d in scored if d["nasa_aod"] >= p90]
    clean = [d for d in scored if d["nasa_aod"] <= p10]

    return {
        "method": (
            "2025/26 is held out from threshold training. Days are labelled by "
            "NASA MERRA-2 AOD_55 from POWER, then scored with the CAMS/ERA5 index."
        ),
        "n": len(scored),
        "nasa_aod_p90": round(p90, 3),
        "nasa_aod_p10": round(p10, 3),
        "dusty": {
            "n": len(dusty),
            "high_or_severe": sum(d["level"] in {"high", "severe"} for d in dusty),
            "hit_rate": round(
                sum(d["level"] in {"high", "severe"} for d in dusty) / len(dusty), 3
            )
            if dusty
            else None,
            "levels": counts(dusty),
        },
        "clean": {
            "n": len(clean),
            "low_or_moderate": sum(d["level"] in {"low", "moderate"} for d in clean),
            "hit_rate": round(
                sum(d["level"] in {"low", "moderate"} for d in clean) / len(clean), 3
            )
            if clean
            else None,
            "levels": counts(clean),
        },
        "top5": sorted(scored, key=lambda d: d["nasa_aod"], reverse=True)[:5],
        "bottom5": sorted(scored, key=lambda d: d["nasa_aod"])[:5],
        "caveat": (
            "CAMS AOD and NASA MERRA-2 AOD are correlated (r = 0.644 over 605 "
            "days). This checks cross-source agreement; it is not an independent "
            "forecast skill score."
        ),
    }


def known_events(base: dict[str, Any], raw: list[dict[str, Any]]) -> dict[str, Any]:
    """The dustiest and cleanest real days, scored out-of-season."""
    def score_row(row: dict[str, Any]) -> dict[str, Any]:
        thresholds = train_thresholds(base, row["season"])
        day = index.score_day(row, thresholds)
        return {
            "date": row["date"],
            "season": row["season"],
            "dust_ugm3": round(float(row["dust"]), 1),
            "aod": round(float(row["aod"]), 3) if row.get("aod") is not None else None,
            "score": day["score"],
            "level": day["level"],
            "guardrails": day["guardrails"],
        }

    dusty = [score_row(row) for row in sorted(raw, key=lambda r: r["dust"], reverse=True)[:5]]
    clean = [score_row(row) for row in sorted(raw, key=lambda r: r["dust"])[:5]]
    return {
        "method": (
            "Top five and bottom five days by observed CAMS daily dust. Each is "
            "scored with thresholds trained on the other three seasons."
        ),
        "dusty": dusty,
        "clean": clean,
        "dusty_high_or_severe": sum(d["level"] in {"high", "severe"} for d in dusty),
        "clean_low": sum(d["level"] == "low" for d in clean),
    }


def sensitivity(base: dict[str, Any], raw: list[dict[str, Any]]) -> dict[str, Any]:
    baseline = {
        row["date"]: index.score_day(row, base) for row in raw
    }
    baseline_levels = {d: v["level"] for d, v in baseline.items()}
    rows = []

    for name, weights in SCENARIOS.items():
        scored = {
            row["date"]: index.score_day(row, base, weights=weights) for row in raw
        }
        changed = sum(
            scored[d]["level"] != baseline_levels[d] for d in baseline_levels
        )
        max_delta = max(abs(scored[d]["score"] - baseline[d]["score"]) for d in baseline)
        rows.append(
            {
                "name": name,
                "weights": weights,
                "changed_days": changed,
                "changed_pct": round(100 * changed / len(baseline_levels), 1),
                "max_score_delta": round(max_delta, 1),
                "levels": counts(scored.values()),
            }
        )

    return {
        "method": (
            "All 605 harmattan days are re-scored with alternative weights; the "
            "same percentile inputs, clean-air caps and rain washout are applied."
        ),
        "days": len(baseline),
        "baseline_levels": counts(baseline.values()),
        "scenarios": rows,
        "caveat": (
            "Levels change only near a cut boundary. The purpose is to show the "
            "index is not a finely tuned fit; it is a transparent ranking."
        ),
    }


def main() -> None:
    base = json.loads(THRESHOLDS.read_text())
    raw = json.loads(RAW.read_text())

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": (
            "Historical replay and sensitivity checks. Not a forecast skill "
            "score: no archived forecast fields were available."
        ),
        "holdout": season_holdout(base, raw),
        "nasa_crosscheck": nasa_crosscheck(base, raw),
        "known_events": known_events(base, raw),
        "sensitivity": sensitivity(base, raw),
    }
    OUT.write_text(json.dumps(payload, indent=1))
    print(f"wrote {OUT}")
    print(json.dumps(payload["holdout"]["pooled"], indent=2))
    print(json.dumps(payload["nasa_crosscheck"], indent=2)[:1500])
    for row in payload["sensitivity"]["scenarios"]:
        print(row["name"], row["changed_pct"], row["levels"])


if __name__ == "__main__":
    main()
