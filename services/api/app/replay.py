"""Historical replay events for the demo.

These are real observed days, scored with today's model and thresholds. They
exist because a November demo should not have to wait for a dust storm: judges
can see High/Severe states without the team pretending the live day is dusty.

The UI labels every replay clearly. The API never mixes a replay into
`/api/v1/forecast`.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from . import advice, hazards, index
from .config import DATA_DIR

REPLAY_PATH = DATA_DIR / "replay.json"


def payload() -> dict[str, Any]:
    thresholds = index.load_thresholds()
    try:
        raw = json.loads(REPLAY_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return {
            "events": [],
            "count": 0,
            "note": "Replay data unavailable. Run scripts/build_replay.py.",
        }

    events = []
    for event in raw.get("events", []):
        series = event.get("series", [])
        row = next((item for item in series if item.get("date") == event.get("date")), None)
        if not row:
            continue
        day = advice.day_payload(row, thresholds)
        day["is_today"] = False
        day["flood"] = hazards.for_series(series).get(event["date"])
        day["data_mode"] = "replay"
        events.append(
            {
                "id": event["id"],
                "kind": event["kind"],
                "date": event["date"],
                "title_en": event["title_en"],
                "title_ha": event["title_ha"],
                "context_en": event["context_en"],
                "context_ha": event["context_ha"],
                "source": event.get("source"),
                "day": day,
            }
        )

    return {
        "events": events,
        "count": len(events),
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": raw.get("note"),
        "disclaimer": {
            "en": (
                "Historical replay: a real past day, not today's forecast. "
                "Shown to demonstrate High/Severe states."
            ),
            "ha": (
                "Bayanin tarihi ne: ranar da ta wuce, ba hasashen yau ba. "
                "An nuna shi don nuna matakan Haɗari."
            ),
        },
    }
