#!/usr/bin/env python
"""Build the two historical replay events used by the dashboard.

Both are real days, not synthetic:

* **Dust:** 2024-02-05, the dustiest day in the 605-day harmattan sample
  (2,354 µg/m³ daily mean dust). Taken from data/climatology_raw.json.
* **Flood:** 2024-08-19, a rainy-season day with 38.7 mm in 24 h. Fetched once
  from the Open-Meteo archive and stored, so the demo works offline.

Output: data/replay.json

    cd services/api && .venv/bin/python scripts/build_replay.py
"""
from __future__ import annotations

import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.sources import openmeteo  # noqa: E402

DATA = Path(__file__).resolve().parent.parent.parent.parent / "data"
RAW = DATA / "climatology_raw.json"
OUT = DATA / "replay.json"

DUST_DATE = "2024-02-05"
FLOOD_DATE = "2024-08-19"
FLOOD_START = "2024-08-10"


def dust_series(raw: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = [
        row
        for row in raw
        if "2024-01-28" <= row["date"] <= DUST_DATE and row.get("season") == "2023/24"
    ]
    return rows


async def flood_series() -> list[dict[str, Any]]:
    rows = await openmeteo.fetch_season_archive(FLOOD_START, FLOOD_DATE)
    return [row for row in rows if row["date"] <= FLOOD_DATE][-10:]


def main() -> None:
    raw = json.loads(RAW.read_text())
    dust = dust_series(raw)
    if not dust or dust[-1]["date"] != DUST_DATE:
        raise SystemExit("dust replay day missing from climatology_raw.json")

    flood = asyncio.run(flood_series())
    if not flood or flood[-1]["date"] != FLOOD_DATE:
        raise SystemExit("flood replay fetch did not return the target day")

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": (
            "Historical replays for the demo. These are observed/reanalysis days, "
            "not forecasts and not current conditions. The UI labels them."
        ),
        "events": [
            {
                "id": "dust-2024-02-05",
                "kind": "dust",
                "date": DUST_DATE,
                "title_en": "February 2024 dust surge",
                "title_ha": "Guguwar ƙura ta Faburairu 2024",
                "context_en": (
                    "The dustiest day in the 605-day harmattan sample: 2,354 µg/m³ "
                    "daily mean dust, with 2,302 µg/m³ the next day."
                ),
                "context_ha": (
                    "Ranar da ƙura ta fi yawa a cikin kwanaki 605 da aka auna: "
                    "2,354 µg/m³ a matsakaici, sai 2,302 µg/m³ washegari."
                ),
                "source": "CAMS/ERA5 archive via Open-Meteo (climatology_raw.json)",
                "series": dust,
            },
            {
                "id": "flood-2024-08-19",
                "kind": "flood",
                "date": FLOOD_DATE,
                "title_en": "August 2024 flash-flood rain",
                "title_ha": "Ruwan ambaliya na Agusta 2024",
                "context_en": (
                    "A real rainy-season day with 38.7 mm in 24 h. The flood rule "
                    "puts this above the 30 mm high floor; the next day is included "
                    "in the 72-hour total."
                ),
                "context_ha": (
                    "Ranar ruwan sama ta gaske: 38.7 mm cikin awa 24. Dokar ambaliya "
                    "ta haɗa wannan da ruwan kwanaki uku."
                ),
                "source": "ERA5 archive via Open-Meteo, fetched 2026-11-15",
                "series": flood,
            },
        ],
    }
    OUT.write_text(json.dumps(payload, indent=1))
    print(f"wrote {OUT}: dust={len(dust)} rows, flood={len(flood)} rows")
    print("flood tail:", flood[-3:])


if __name__ == "__main__":
    main()
