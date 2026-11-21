"""Sensor ingestion for the Arduino ground node.

The firmware posts one JSON reading every five minutes:

    {"device_id":"gombe-01","pm25":18.2,"pm10":41.0,"dust_ugm3":41.0,
     "rain_mm":0.6,"water_level_cm":12.4,"temp_c":31.2,"humidity":22.5}

Readings live next to the subscribers in SQLite. A device id starting with
"sim-" is shown in the UI with a "simulated" badge.
"""
from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Any

from .config import DB_PATH
from .store import _conn

SCHEMA = """
CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    ts TEXT NOT NULL,
    pm25 REAL,
    pm10 REAL,
    dust_ugm3 REAL,
    rain_mm REAL,
    water_level_cm REAL,
    temp_c REAL,
    humidity REAL,
    raw TEXT
);
CREATE INDEX IF NOT EXISTS idx_sensor_device_ts ON sensor_readings (device_id, ts DESC);
"""


def init() -> None:
    with _conn() as conn:
        conn.executescript(SCHEMA)


def add_reading(payload: dict[str, Any]) -> dict[str, Any]:
    init()
    device = str(payload.get("device_id") or "unknown")[:40]
    ts = payload.get("ts") or datetime.now(timezone.utc).isoformat(timespec="seconds")
    with _conn() as conn:
        cur = conn.execute(
            """INSERT INTO sensor_readings
               (device_id, ts, pm25, pm10, dust_ugm3, rain_mm, water_level_cm, temp_c, humidity, raw)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                device,
                ts,
                payload.get("pm25"),
                payload.get("pm10"),
                payload.get("dust_ugm3"),
                payload.get("rain_mm"),
                payload.get("water_level_cm"),
                payload.get("temp_c"),
                payload.get("humidity"),
                str(payload)[:2000],
            ),
        )
        return {"ok": True, "id": cur.lastrowid, "device_id": device, "ts": ts}


def latest() -> dict[str, Any]:
    init()
    with _conn() as conn:
        rows = conn.execute(
            """SELECT * FROM sensor_readings
               WHERE id IN (SELECT MAX(id) FROM sensor_readings GROUP BY device_id)
               ORDER BY ts DESC"""
        ).fetchall()
    devices = []
    for row in rows:
        d = dict(row)
        d["simulated"] = str(d["device_id"]).startswith("sim-")
        d.pop("raw", None)
        devices.append(d)
    return {
        "devices": devices,
        "count": len(devices),
        "note": "Ground readings from the Arduino node; empty until a node checks in.",
    }


def series(device_id: str | None = None, hours: int = 24) -> dict[str, Any]:
    init()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat(timespec="seconds")
    query = "SELECT device_id, ts, pm25, pm10, dust_ugm3, rain_mm, water_level_cm, temp_c, humidity FROM sensor_readings WHERE ts >= ?"
    args: list[Any] = [cutoff]
    if device_id:
        query += " AND device_id = ?"
        args.append(device_id)
    query += " ORDER BY ts ASC LIMIT 2000"
    with _conn() as conn:
        rows = [dict(r) for r in conn.execute(query, args).fetchall()]
    return {"hours": hours, "count": len(rows), "readings": rows}
