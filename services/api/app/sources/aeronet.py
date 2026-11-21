"""AERONET ground truth (Ilorin, Nigeria) vs MERRA-2 AOD.

AERONET is free and needs no login. Ilorin is ~700 km south-west of Gombe,
so this is a regional sanity check on the reanalysis, not a local truth
station. We say that out loud in the UI.
"""
from __future__ import annotations

import csv
import io
import math
from datetime import date, timedelta
from statistics import mean
from typing import Any

import httpx

from ..config import ILORIN, USER_AGENT

AERONET_URL = "https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_v3"


def _parse(csv_text: str) -> list[dict[str, Any]]:
    lines = csv_text.splitlines()
    header_idx = next(
        (i for i, line in enumerate(lines) if line.startswith("AERONET_Site,Date")),
        None,
    )
    if header_idx is None:
        return []
    reader = csv.DictReader(io.StringIO("\n".join(lines[header_idx:])))
    rows = []
    for row in reader:
        try:
            aod = float(row["AOD_500nm"])
        except (KeyError, TypeError, ValueError):
            continue
        if aod <= -900:
            continue
        rows.append({"date": row["Date(dd:mm:yyyy)"][6:10] + "-" + row["Date(dd:mm:yyyy)"][3:5] + "-" + row["Date(dd:mm:yyyy)"][:2], "aod": aod})
    return rows


async def fetch_aod(start: date, end: date, site: str = "Ilorin") -> list[dict[str, Any]]:
    params = {
        "site": site,
        "year": start.year,
        "month": start.month,
        "day": start.day,
        "year2": end.year,
        "month2": end.month,
        "day2": end.day,
        "AOD15": 1,
        "AVG": 20,
        "if_no_html": 1,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.get(AERONET_URL, params=params, headers={"User-Agent": USER_AGENT})
        r.raise_for_status()
        return _parse(r.text)


def daily_mean(rows: list[dict[str, Any]]) -> dict[str, float]:
    buckets: dict[str, list[float]] = {}
    for row in rows:
        buckets.setdefault(row["date"], []).append(row["aod"])
    return {d: round(mean(v), 3) for d, v in buckets.items() if v}


def pearson(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) < 3:
        return None
    mx, my = mean(xs), mean(ys)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den = math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys))
    return round(num / den, 3) if den else None


def pick_validation_window(today: date | None = None) -> tuple[date, date]:
    """Most recent complete January with dense Ilorin coverage in the archive."""
    today = today or date.today()
    year = today.year if today.month > 2 else today.year - 1
    # Ilorin reports sparsely; January of the previous completed year is the
    # safest bet for a full month of data.
    return date(year - 1, 1, 1), date(year - 1, 1, 31)
