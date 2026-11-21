#!/usr/bin/env python3
"""Post simulated Arduino readings to the Ƙura Alert API.

Useful before the hardware exists: the dashboard ground-node card lights up
with a "Simulated" badge, and you can test the full ingest → SQLite → UI path.

    python3 hardware/scripts/simulate_node.py --count 5 --interval 60
"""
from __future__ import annotations

import argparse
import json
import math
import random
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

DEFAULT_API = "http://127.0.0.1:8000"


def reading(step: int) -> dict:
    """A plausible Gombe harmattan reading with a slow daily dust cycle."""
    hour = datetime.now().hour
    daylight = max(0.0, math.sin((hour - 6) / 12 * math.pi))
    dust = max(8.0, 55 + 45 * daylight + 12 * math.sin(step / 3) + random.uniform(-6, 6))
    return {
        "device_id": "sim-gombe-01",
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "pm25": round(dust * 0.38, 1),
        "pm10": round(dust, 1),
        "dust_ugm3": round(dust, 1),
        "rain_mm": 0.0,
        "water_level_cm": round(max(0.0, 8 + 3 * math.sin(step / 5) + random.uniform(-1, 1)), 1),
        "temp_c": round(31 + 5 * daylight + random.uniform(-0.6, 0.6), 1),
        "humidity": round(max(12, 34 - 12 * daylight + random.uniform(-2, 2)), 1),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api", default=DEFAULT_API, help="API base URL")
    parser.add_argument("--count", type=int, default=1, help="number of readings (0 = forever)")
    parser.add_argument("--interval", type=float, default=60, help="seconds between readings")
    parser.add_argument("--key", default="demo", help="ingest key (KURA_INGEST_KEY)")
    args = parser.parse_args()

    url = f"{args.api.rstrip('/')}/api/v1/ingest"
    step = 0
    while args.count == 0 or step < args.count:
        payload = reading(step)
        body = json.dumps(payload).encode()
        req = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={"Content-Type": "application/json", "X-Api-Key": args.key},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                print(f"[{step + 1}] {res.status} {payload['pm10']} µg/m³ · {payload['water_level_cm']} cm")
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"[{step + 1}] failed: {exc}", file=sys.stderr)
            return 1
        step += 1
        if args.count == 0 or step < args.count:
            time.sleep(args.interval)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
