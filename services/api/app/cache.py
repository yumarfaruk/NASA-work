"""Tiny atomic JSON cache. Keeps the demo alive when an upstream API blinks."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from .config import CACHE_DIR


def _path(key: str) -> Path:
    safe = "".join(c if c.isalnum() or c in "-_." else "_" for c in key)
    return CACHE_DIR / f"{safe}.json"


def read(key: str) -> dict[str, Any] | None:
    p = _path(key)
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text())
    except (json.JSONDecodeError, OSError):
        return None


def write(key: str, payload: Any) -> None:
    p = _path(key)
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, default=str))
    tmp.replace(p)


def age_seconds(key: str) -> float | None:
    p = _path(key)
    if not p.exists():
        return None
    return time.time() - p.stat().st_mtime


def fresh(key: str, ttl: int) -> dict[str, Any] | None:
    payload = read(key)
    age = age_seconds(key)
    if payload is not None and age is not None and age <= ttl:
        return payload
    return None
