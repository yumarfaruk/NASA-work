"""The Kura Dust Index.

A small, explainable, rule-based model. Every number the dashboard shows can
be traced to a dataset and a percentile computed from real harmattan seasons.

    score = 100 * (0.50 * pct(dust) + 0.25 * pct(AOD)
                   + 0.15 * pct(wind) + 0.10 * (1 - pct(RH)))

Percentiles come from the Gombe harmattan climatology (Nov–Mar, 2022/23
onwards), so "High" means "dustier than 3 out of 4 normal harmattan days",
not an arbitrary number. Two guardrails stop a dry windy day with clean air
from being labelled dusty.

Deliberately not machine learning. Judges can interrogate every weight.
"""
from __future__ import annotations

import json
from bisect import bisect_left
from datetime import date
from typing import Any

from .config import THRESHOLDS_PATH

WEIGHTS = {"dust": 0.50, "aod": 0.25, "wind": 0.15, "dryness": 0.10}

LEVEL_CUTS = {"moderate": 50, "high": 75, "severe": 90}

SEASON_WINDOW_DAYS = 21

LEVELS: dict[str, dict[str, Any]] = {
    "low": {
        "key": "low",
        "en": "Low",
        "ha": "Ƙarami",
        "color": "#2f8f5b",
        "blurb_en": "Clean air. A normal harmattan day.",
        "blurb_ha": "Iska mai kyau. Rana ta al'ada ce.",
        "emoji": "🟢",
    },
    "moderate": {
        "key": "moderate",
        "en": "Moderate",
        "ha": "Matsakaici",
        "color": "#c99a1e",
        "blurb_en": "Some dust about. Worth a small precaution.",
        "blurb_ha": "Ƙura kaɗan tana iska. A ɗan yi hankali.",
        "emoji": "🟡",
    },
    "high": {
        "key": "high",
        "en": "High",
        "ha": "Yawa",
        "color": "#d2691e",
        "blurb_en": "Heavy dust. Change your outdoor plans.",
        "blurb_ha": "Ƙura mai yawa. Canza shirin aikin waje.",
        "emoji": "🟠",
    },
    "severe": {
        "key": "severe",
        "en": "Severe",
        "ha": "Haɗari",
        "color": "#b3261e",
        "blurb_en": "Very heavy dust. Protect people and goods.",
        "blurb_ha": "Ƙura mai haɗari. Ka kare mutane da kaya.",
        "emoji": "🔴",
    },
}

# Used only if data/thresholds.json is missing (fresh clone, no network).
DEFAULT_THRESHOLDS: dict[str, Any] = {
    "generated_at": None,
    "method": "built-in fallback percentiles (run scripts/derive_thresholds.py)",
    "sample_days": 0,
    "distributions": {
        "dust": {"sample": [], "p10": 12, "p25": 22, "p50": 42, "p75": 78, "p90": 150, "p95": 210},
        "aod": {"sample": [], "p10": 0.16, "p25": 0.24, "p50": 0.36, "p75": 0.55, "p90": 0.85, "p95": 1.05},
        "wind": {"sample": [], "p10": 1.4, "p25": 1.9, "p50": 2.6, "p75": 3.4, "p90": 4.4, "p95": 5.2},
        "rh": {"sample": [], "p10": 16, "p25": 24, "p50": 35, "p75": 48, "p90": 62, "p95": 72},
    },
    "nasa": {"p50": 0.38, "p90": 0.92, "latest_date": None},
    "crosscheck": {},
    "season_series": [],
    "climatology": [],
}


def load_thresholds() -> dict[str, Any]:
    try:
        return json.loads(THRESHOLDS_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return DEFAULT_THRESHOLDS


def percentile(dist: dict[str, Any], value: float | None) -> float | None:
    """Empirical CDF in [0, 1] from a stored sample, else from a p-table."""
    if value is None:
        return None
    sample = dist.get("sample") or []
    return percentile_from_sample(sample, value) if sample else _percentile_from_table(dist, value)


def percentile_from_sample(sample: list[float], value: float) -> float:
    idx = bisect_left(sample, value)
    return round(min(1.0, max(0.0, idx / len(sample))), 4)


def _percentile_from_table(dist: dict[str, Any], value: float) -> float | None:
    table = [(float(dist[f"p{q}"]), q / 100) for q in (10, 25, 50, 75, 90, 95) if dist.get(f"p{q}") is not None]
    if not table:
        return None
    if value <= table[0][0]:
        return round(table[0][1] * value / table[0][0], 4) if table[0][0] else 0.0
    for (x0, y0), (x1, y1) in zip(table, table[1:]):
        if value <= x1:
            return round(y0 + (y1 - y0) * (value - x0) / (x1 - x0), 4)
    return 1.0


def _circular_doy_distance(a: int, b: int) -> int:
    d = abs(a - b)
    return min(d, 365 - d)


def seasonal_sample(
    thresholds: dict[str, Any], iso_date: str, key: str, half_window: int = SEASON_WINDOW_DAYS
) -> list[float]:
    """Same weeks in every season, so November is compared with November."""
    rows = thresholds.get("climatology") or []
    if not rows:
        return []
    target = date.fromisoformat(iso_date).timetuple().tm_yday
    values: list[float] = []
    for row in rows:
        value = row.get(key)
        if value is None:
            continue
        doy = date.fromisoformat(row["date"]).timetuple().tm_yday
        if _circular_doy_distance(doy, target) <= half_window:
            values.append(float(value))
    return sorted(values) if len(values) >= 40 else []


def level_for(score: float) -> str:
    if score < LEVEL_CUTS["moderate"]:
        return "low"
    if score < LEVEL_CUTS["high"]:
        return "moderate"
    if score < LEVEL_CUTS["severe"]:
        return "high"
    return "severe"


def score_day(
    day: dict[str, Any],
    thresholds: dict[str, Any],
    weights: dict[str, float] | None = None,
) -> dict[str, Any]:
    dists = thresholds.get("distributions", DEFAULT_THRESHOLDS["distributions"])
    active_weights = weights or WEIGHTS

    samples = {
        key: seasonal_sample(thresholds, day["date"], key) for key in ("dust", "aod", "wind", "rh")
    }
    seasonal = all(len(samples[k]) > 0 for k in ("dust", "aod"))

    def pct(key: str) -> float | None:
        value = day.get(key)
        if value is None:
            return None
        if samples[key]:
            return percentile_from_sample(samples[key], float(value))
        return percentile(dists[key], float(value))

    dust_pct = pct("dust")
    aod_pct = pct("aod")
    wind_pct = pct("wind")
    rh_pct = pct("rh")
    dryness_pct = None if rh_pct is None else round(1 - rh_pct, 4)

    parts = {
        "dust": dust_pct,
        "aod": aod_pct,
        "wind": wind_pct,
        "dryness": dryness_pct,
    }
    available = {k: v for k, v in parts.items() if v is not None}
    weight_sum = sum(active_weights[k] for k in available)
    if not weight_sum:
        score = 0.0
    else:
        score = 100 * sum(active_weights[k] * v for k, v in available.items()) / weight_sum

    guards: list[str] = []
    if dust_pct is not None:
        if dust_pct < 0.15:
            score = min(score, 44)
            guards.append("clean-air cap: dust below 15th percentile")
        elif dust_pct < 0.30:
            score = min(score, 55)
            guards.append("clean-air cap: dust below 30th percentile")

    precip = day.get("precip") or 0
    if precip >= 5:
        score -= 20
        guards.append("rain washout: 20-point reduction")
    elif precip >= 2:
        score -= 10
        guards.append("rain washout: 10-point reduction")

    score = round(max(0.0, min(100.0, score)), 1)
    level = level_for(score)

    return {
        "score": score,
        "level": level,
        "level_meta": LEVELS[level],
        "basis": {
            "seasonal": seasonal,
            "window_days": SEASON_WINDOW_DAYS,
            "sample_days": max(len(v) for v in samples.values()) if samples else 0,
        },
        "percentiles": {
            "dust": dust_pct,
            "aod": aod_pct,
            "wind": wind_pct,
            "dryness": dryness_pct,
        },
        "components": [
            {
                "key": "dust",
                "label_en": "Dust concentration",
                "label_ha": "Yawan ƙura a iska",
                "value": day.get("dust"),
                "unit": "µg/m³",
                "percentile": dust_pct,
                "weight": active_weights["dust"],
                "source": "CAMS via Open-Meteo",
            },
            {
                "key": "aod",
                "label_en": "Aerosol optical depth",
                "label_ha": "Nisan haske a cikin iska",
                "value": day.get("aod"),
                "unit": "AOD 550 nm",
                "percentile": aod_pct,
                "weight": active_weights["aod"],
                "source": "CAMS via Open-Meteo",
            },
            {
                "key": "wind",
                "label_en": "Wind speed",
                "label_ha": "Saurin iska",
                "value": day.get("wind"),
                "unit": "km/h",
                "percentile": wind_pct,
                "weight": active_weights["wind"],
                "source": "ERA5 via Open-Meteo",
            },
            {
                "key": "dryness",
                "label_en": "Dry air",
                "label_ha": "Bushewar iska",
                "value": day.get("rh"),
                "unit": "% humidity",
                "percentile": dryness_pct,
                "weight": active_weights["dryness"],
                "source": "ERA5 via Open-Meteo",
            },
        ],
        "guardrails": guards,
    }


def thresholds_summary(thresholds: dict[str, Any]) -> dict[str, Any]:
    dists = thresholds.get("distributions", {})
    today = date.today().isoformat()
    seasonal_refs: dict[str, Any] = {}
    for key in ("dust", "aod", "wind", "rh"):
        sample = seasonal_sample(thresholds, today, key)
        if sample:
            seasonal_refs[key] = {
                "p50": round(_quantile(sample, 0.50), 3),
                "p90": round(_quantile(sample, 0.90), 3),
                "n": len(sample),
            }
    return {
        "sample_days": thresholds.get("sample_days", 0),
        "seasons": thresholds.get("seasons", []),
        "method": thresholds.get("method"),
        "generated_at": thresholds.get("generated_at"),
        "cuts": LEVEL_CUTS,
        "weights": WEIGHTS,
        "window_days": SEASON_WINDOW_DAYS,
        "references": {
            "dust_p50": dists.get("dust", {}).get("p50"),
            "dust_p90": dists.get("dust", {}).get("p90"),
            "aod_p50": dists.get("aod", {}).get("p50"),
            "aod_p90": dists.get("aod", {}).get("p90"),
            "wind_p50": dists.get("wind", {}).get("p50"),
            "wind_p90": dists.get("wind", {}).get("p90"),
            "rh_p50": dists.get("rh", {}).get("p50"),
        },
        "seasonal_references": seasonal_refs,
    }


def _quantile(sorted_values: list[float], q: float) -> float:
    if len(sorted_values) == 1:
        return sorted_values[0]
    k = (len(sorted_values) - 1) * q
    lo, hi = int(k), min(int(k) + 1, len(sorted_values) - 1)
    return sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (k - lo)
