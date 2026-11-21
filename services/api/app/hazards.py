"""Flood early warning from rainfall — the second hazard in Ƙura Alert.

Dust gets the headline, but the same three-day window can carry a flood
signal. Gombe's flash floods come from short, intense rain in the rainy
season (Jun–Sep), so we look at three things:

  1. rain in the next 24 h (the trigger)
  2. rain over 72 h (the load on drains and streams)
  3. rain over the previous 7 days (how saturated the ground already is)

The result is a 0–100 score with hard floors for NiMet-style heavy-rain
bands, so a 45 mm day can never be reported as "low" just because the rest
of the week was dry.

Rule-based on purpose: a market trader can ask why, and get an answer.
"""
from __future__ import annotations

from typing import Any

LEVELS = {
    "low": {
        "key": "low",
        "en": "Low",
        "ha": "Ƙarami",
        "color": "#2f8f5b",
        "emoji": "🟢",
    },
    "moderate": {
        "key": "moderate",
        "en": "Watch",
        "ha": "Lura",
        "color": "#c99a1e",
        "emoji": "🟡",
    },
    "high": {
        "key": "high",
        "en": "High",
        "ha": "Yawa",
        "color": "#d2691e",
        "emoji": "🟠",
    },
    "severe": {
        "key": "severe",
        "en": "Severe",
        "ha": "Haɗari",
        "color": "#b3261e",
        "emoji": "🔴",
    },
}

HEADLINES = {
    "low": {
        "en": "No flood signal in the next three days.",
        "ha": "Babu alamar ambaliya a cikin kwanaki uku masu zuwa.",
    },
    "moderate": {
        "en": "Heavy rain possible. Check your drains.",
        "ha": "Ana iya samun ruwan sama mai yawa. Duba magudanar ruwa.",
    },
    "high": {
        "en": "Flood risk. Move goods off the floor.",
        "ha": "Haɗarin ambaliya. Ɗaga kayanka daga ƙasa.",
    },
    "severe": {
        "en": "Dangerous flooding likely. Avoid low roads.",
        "ha": "Ana sa ran ambaliya mai haɗari. Guje wa tituna masu ƙasa.",
    },
}

ADVICE = {
    "low": {
        "en": "Normal conditions. Keep drains clear while it is dry.",
        "ha": "Yanayi na al'ada. A share magudanar ruwa yayin da ƙasa ta bushe.",
    },
    "moderate": {
        "en": "Clear gutters and move sacks or stock onto pallets before the rain.",
        "ha": "A share magudanar ruwa, a ɗaga buhu ko kaya kan tudu kafin ruwa.",
    },
    "high": {
        "en": "Avoid low-lying roads and open drains. Move valuables upstairs or onto shelves.",
        "ha": "Guje wa tituna masu ƙasa da magudanar ruwa. Ɗaga kaya masu daraja zuwa sama.",
    },
    "severe": {
        "en": "Do not cross running water. Move to higher ground and keep children close.",
        "ha": "Kada ka tsallake ruwa mai gudu. Koma zuwa waje mai tudu, ka riƙe yara kusa.",
    },
}

RAIN_24_SEVERE = 50.0
RAIN_24_HIGH = 30.0
RAIN_24_MODERATE = 15.0


def _level(score: float) -> str:
    if score < 50:
        return "low"
    if score < 75:
        return "moderate"
    if score < 90:
        return "high"
    return "severe"


def for_series(series: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Map ISO date -> flood assessment, using the full daily series."""
    by_date = {row["date"]: row for row in series}
    dates = sorted(by_date)
    out: dict[str, dict[str, Any]] = {}

    for idx, day in enumerate(dates):
        row = by_date[day]

        def rain(back: int) -> float:
            if idx - back < 0:
                return 0.0
            return float(by_date[dates[idx - back]].get("precip") or 0.0)

        rain_24 = float(row.get("precip") or 0.0)
        rain_72 = sum(rain(k) for k in range(0, 3))
        rain_7 = sum(rain(k) for k in range(1, 8))

        score = (
            0.55 * min(1.0, rain_24 / RAIN_24_SEVERE)
            + 0.30 * min(1.0, rain_72 / 90.0)
            + 0.15 * min(1.0, rain_7 / 120.0)
        ) * 100

        guards: list[str] = []
        if rain_24 >= RAIN_24_SEVERE:
            score = max(score, 90)
            guards.append("24 h rain ≥ 50 mm → severe floor")
        elif rain_24 >= RAIN_24_HIGH:
            score = max(score, 75)
            guards.append("24 h rain ≥ 30 mm → high floor")
        elif rain_24 >= RAIN_24_MODERATE:
            score = max(score, 50)
            guards.append("24 h rain ≥ 15 mm → watch floor")

        score = round(max(0.0, min(100.0, score)), 1)
        level = _level(score)
        out[day] = {
            "score": score,
            "level": level,
            "level_meta": LEVELS[level],
            "rain_24h": round(rain_24, 2),
            "rain_72h": round(rain_72, 2),
            "rain_7d_prior": round(rain_7, 2),
            "headline": HEADLINES[level],
            "advice": ADVICE[level],
            "guardrails": guards,
            "thresholds": {
                "watch_mm": RAIN_24_MODERATE,
                "high_mm": RAIN_24_HIGH,
                "severe_mm": RAIN_24_SEVERE,
            },
        }
    return out


def alerts(days: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Flatten high/severe dust and flood signals into a banner list."""
    out: list[dict[str, Any]] = []
    for day in days:
        if day["level"] in {"high", "severe"}:
            out.append(
                {
                    "hazard": "dust",
                    "level": day["level"],
                    "date": day["date"],
                    "en": day["headline"]["en"],
                    "ha": day["headline"]["ha"],
                }
            )
        flood = day.get("flood")
        if flood and flood["level"] in {"high", "severe"}:
            out.append(
                {
                    "hazard": "flood",
                    "level": flood["level"],
                    "date": day["date"],
                    "en": flood["headline"]["en"],
                    "ha": flood["headline"]["ha"],
                }
            )
    return out
