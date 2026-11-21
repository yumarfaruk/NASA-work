"""Open-Meteo (CAMS / ERA5) clients: live dust, AOD and weather for Gombe.

Why Open-Meteo: NASA's own near-real-time dust fields need an Earthdata
login and a multi-GB download. CAMS global atmospheric composition is the
operational dust forecast used by forecasters, is free, and — importantly
for a 24-hour build — is available as JSON with no key.

NASA data still anchors the product: MERRA-2 (via POWER) supplies the
climatology and the seasonal baseline, GIBS supplies satellite imagery, and
AERONET supplies ground truth. See docs/datasets.md.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from statistics import mean
from typing import Any
from zoneinfo import ZoneInfo

import httpx

from ..config import GOMBE, USER_AGENT

AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

AIR_VARS = "dust,aerosol_optical_depth,pm10,pm2_5"
WEATHER_VARS = (
    "wind_speed_10m,wind_direction_10m,relative_humidity_2m,"
    "temperature_2m,precipitation"
)


def _clean(values: list[float | None]) -> list[float]:
    return [float(v) for v in values if v is not None]


def _avg(values: list[float | None]) -> float | None:
    vals = _clean(values)
    return round(mean(vals), 3) if vals else None


def _vector_mean_dir(dirs: list[float | None], speeds: list[float | None]) -> float | None:
    import math

    u = v = 0.0
    for d, s in zip(dirs, speeds):
        if d is None or s is None:
            continue
        rad = math.radians(d)
        u += s * math.sin(rad)
        v += s * math.cos(rad)
    if u == 0 and v == 0:
        return None
    return round((math.degrees(math.atan2(u, v)) + 360) % 360, 0)


async def _get(client: httpx.AsyncClient, url: str, params: dict[str, Any]) -> dict[str, Any]:
    r = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
    r.raise_for_status()
    return r.json()


async def fetch_daily(past_days: int = 14, forecast_days: int = 4) -> list[dict[str, Any]]:
    """Daily means of dust/AOD/PM plus wind, humidity, rain (local time)."""
    common = {
        "latitude": GOMBE["lat"],
        "longitude": GOMBE["lon"],
        "timezone": GOMBE["timezone"],
        "past_days": past_days,
        "forecast_days": forecast_days,
    }
    async with httpx.AsyncClient(timeout=45.0) as client:
        import asyncio

        air, wx = await asyncio.gather(
            _get(client, AIR_URL, {**common, "hourly": AIR_VARS}),
            _get(client, WEATHER_URL, {**common, "hourly": WEATHER_VARS}),
        )

    buckets: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))
    for t, *vals in zip(air["hourly"]["time"], *[air["hourly"][k] for k in AIR_VARS.split(",")]):
        day = t[:10]
        for key, val in zip(AIR_VARS.split(","), vals):
            if val is not None:
                buckets[day][key].append(val)

    for t, *vals in zip(wx["hourly"]["time"], *[wx["hourly"][k] for k in WEATHER_VARS.split(",")]):
        day = t[:10]
        for key, val in zip(WEATHER_VARS.split(","), vals):
            if val is not None:
                buckets[day][key].append(val)

    out: list[dict[str, Any]] = []
    for day in sorted(buckets):
        b = buckets[day]
        precip = sum(b.get("precipitation", []) or [])
        out.append(
            {
                "date": day,
                "dust": _avg(b.get("dust")),
                "aod": _avg(b.get("aerosol_optical_depth")),
                "pm10": _avg(b.get("pm10")),
                "pm25": _avg(b.get("pm2_5")),
                "wind": _avg(b.get("wind_speed_10m")),
                "wind_dir": _vector_mean_dir(
                    b.get("wind_direction_10m", []), b.get("wind_speed_10m", [])
                ),
                "rh": _avg(b.get("relative_humidity_2m")),
                "temp": _avg(b.get("temperature_2m")),
                "precip": round(precip, 2),
                "hours": len(b.get("dust", []) or b.get("temperature_2m", [])),
            }
        )
    return out


async def fetch_season_archive(start: str, end: str) -> list[dict[str, Any]]:
    """Hourly archive for climatology (CAMS reanalysis from 2022 onwards)."""
    params = {
        "latitude": GOMBE["lat"],
        "longitude": GOMBE["lon"],
        "timezone": GOMBE["timezone"],
        "start_date": start,
        "end_date": end,
        "hourly": "dust,aerosol_optical_depth",
    }
    async with httpx.AsyncClient(timeout=180.0) as client:
        air = await _get(client, AIR_URL, params)
        wx = await _get(
            client,
            "https://archive-api.open-meteo.com/v1/archive",
            {
                "latitude": GOMBE["lat"],
                "longitude": GOMBE["lon"],
                "timezone": GOMBE["timezone"],
                "start_date": start,
                "end_date": end,
                "hourly": "wind_speed_10m,relative_humidity_2m,precipitation",
            },
        )

    buckets: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))
    for t, dust, aod in zip(
        air["hourly"]["time"],
        air["hourly"]["dust"],
        air["hourly"]["aerosol_optical_depth"],
    ):
        d = t[:10]
        if dust is not None:
            buckets[d]["dust"].append(dust)
        if aod is not None:
            buckets[d]["aod"].append(aod)
    for t, wind, rh, precip in zip(
        wx["hourly"]["time"],
        wx["hourly"]["wind_speed_10m"],
        wx["hourly"]["relative_humidity_2m"],
        wx["hourly"]["precipitation"],
    ):
        d = t[:10]
        if wind is not None:
            buckets[d]["wind"].append(wind)
        if rh is not None:
            buckets[d]["rh"].append(rh)
        if precip is not None:
            buckets[d]["precip"].append(precip)

    rows = []
    for d in sorted(buckets):
        b = buckets[d]
        if len(b.get("dust", [])) < 18:
            continue  # keep only days with enough hourly coverage
        rows.append(
            {
                "date": d,
                "dust": round(mean(b["dust"]), 3),
                "aod": round(mean(b["aod"]), 3) if b.get("aod") else None,
                "wind": round(mean(b["wind"]), 3) if b.get("wind") else None,
                "rh": round(mean(b["rh"]), 3) if b.get("rh") else None,
                "precip": round(sum(b.get("precip", [])), 2),
            }
        )
    return rows


def today_local() -> str:
    return datetime.now(ZoneInfo(GOMBE["timezone"])).date().isoformat()


def recent_window(days: int, end: str | None = None) -> tuple[str, str]:
    end_date = datetime.fromisoformat(end or today_local()).date()
    start = end_date - timedelta(days=days - 1)
    return start.isoformat(), end_date.isoformat()
