"""SQLite store for demo subscribers (no SMS is sent)."""
from __future__ import annotations

import re
import sqlite3
from datetime import datetime, timezone
from typing import Any

from .config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'ha',
    audience TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(phone, language)
);
"""


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def normalise_phone(raw: str) -> str | None:
    digits = re.sub(r"[^\d+]", "", raw.strip())
    if digits.startswith("00"):
        digits = "+" + digits[2:]
    if digits.startswith("0") and len(digits) == 11:
        digits = "+234" + digits[1:]
    if not re.fullmatch(r"\+?\d{10,15}", digits):
        return None
    return digits


def add_subscriber(phone: str, language: str, audience: str | None) -> dict[str, Any]:
    clean = normalise_phone(phone)
    if not clean:
        raise ValueError("invalid phone number")
    lang = language if language in {"ha", "en", "both"} else "ha"
    with _conn() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO subscribers (phone, language, audience, created_at) VALUES (?, ?, ?, ?)",
                (clean, lang, audience, datetime.now(timezone.utc).isoformat(timespec="seconds")),
            )
            return {"ok": True, "id": cur.lastrowid, "duplicate": False, "phone": clean}
        except sqlite3.IntegrityError:
            row = conn.execute(
                "SELECT id FROM subscribers WHERE phone = ? AND language = ?", (clean, lang)
            ).fetchone()
            return {"ok": True, "id": row["id"] if row else None, "duplicate": True, "phone": clean}


def stats() -> dict[str, Any]:
    with _conn() as conn:
        total = conn.execute("SELECT COUNT(*) AS n FROM subscribers").fetchone()["n"]
        by_lang = {
            row["language"]: row["n"]
            for row in conn.execute(
                "SELECT language, COUNT(*) AS n FROM subscribers GROUP BY language"
            )
        }
        by_audience = {
            row["audience"] or "unknown": row["n"]
            for row in conn.execute(
                "SELECT audience, COUNT(*) AS n FROM subscribers GROUP BY audience"
            )
        }
    return {"total": total, "by_language": by_lang, "by_audience": by_audience}
