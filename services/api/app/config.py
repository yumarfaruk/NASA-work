from __future__ import annotations

import os
from pathlib import Path

try:  # optional: load a repo-level .env for local demos
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - dotenv is only a convenience
    load_dotenv = None

APP_DIR = Path(__file__).resolve().parent.parent      # services/api
REPO_ROOT = APP_DIR.parent.parent                     # kura-alert
if load_dotenv is not None:
    load_dotenv(REPO_ROOT / ".env")

DATA_DIR = Path(os.getenv("KURA_DATA_DIR", REPO_ROOT / "data"))
CACHE_DIR = DATA_DIR / "cache"
FALLBACK_DIR = DATA_DIR / "fallback"
DB_PATH = Path(os.getenv("KURA_DB_PATH", DATA_DIR / "kura.db"))
THRESHOLDS_PATH = Path(
    os.getenv("KURA_THRESHOLDS", DATA_DIR / "thresholds.json")
)

GOMBE = {
    "name": "Gombe",
    "state": "Gombe State",
    "country": "Nigeria",
    "lat": 10.2896,
    "lon": 11.1675,
    "timezone": "Africa/Lagos",
}

ILORIN = {"lat": 8.487, "lon": 4.675}

CACHE_TTL_SECONDS = int(os.getenv("KURA_CACHE_TTL", "1800"))
EVIDENCE_DAYS = 14
FORECAST_DAYS = 3

USER_AGENT = "kura-alert/0.1 (NASA Space Apps Challenge 2026, Gombe)"

for _p in (DATA_DIR, CACHE_DIR, FALLBACK_DIR):
    _p.mkdir(parents=True, exist_ok=True)
