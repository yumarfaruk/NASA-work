"""Ƙura Alert API — FastAPI service for the Gombe harmattan dust forecast."""
from __future__ import annotations

import json
import os
from datetime import date, datetime, timezone
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import advice, cache, hazards, index, replay, sensors, store
from .config import (
    CACHE_TTL_SECONDS,
    DATA_DIR,
    EVIDENCE_DAYS,
    FALLBACK_DIR,
    FORECAST_DAYS,
    GOMBE,
)
from .schemas import ForecastResponse, SubscribeRequest, SubscribeResponse
from .sources import aeronet, gibs, openmeteo, power

app = FastAPI(
    title="Ƙura Alert API",
    description="Harmattan dust forecast and plain-language advice for Gombe, Nigeria.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SOURCES = [
    {
        "name": "NASA POWER — MERRA-2 AOD & GEOS-IT meteorology",
        "url": "https://power.larc.nasa.gov/",
        "role": "Harmattan climatology, percentile thresholds, NASA seasonal baseline",
    },
    {
        "name": "CAMS global atmospheric composition (via Open-Meteo)",
        "url": "https://open-meteo.com/en/docs/air-quality-api",
        "role": "Live dust concentration, AOD and the 3-day outlook",
    },
    {
        "name": "NASA GIBS / Worldview",
        "url": "https://www.earthdata.nasa.gov/data/tools/gibs",
        "role": "MODIS true colour, Deep Blue AOD and OMI UV aerosol imagery",
    },
    {
        "name": "AERONET — Ilorin, Nigeria",
        "url": "https://aeronet.gsfc.nasa.gov/",
        "role": "Ground-truth AOD used to validate the reanalysis",
    },
    {
        "name": "MODIS MAIAC & VIIRS Deep Blue AOD",
        "url": "https://ladsweb.modaps.eosdis.nasa.gov/",
        "role": "Documented satellite validation track (not required for the demo)",
    },
]


@app.get("/health")
def health() -> dict[str, Any]:
    thresholds = index.load_thresholds()
    return {
        "ok": True,
        "service": "kura-alert-api",
        "time_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "thresholds_generated_at": thresholds.get("generated_at"),
        "thresholds_days": thresholds.get("sample_days"),
    }


def _fallback(name: str) -> dict[str, Any] | None:
    path = FALLBACK_DIR / f"{name}.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None


def _cached(name: str, ttl: int) -> dict[str, Any] | None:
    payload = cache.fresh(name, ttl)
    if payload is None:
        return None
    payload["_cache"] = "fresh"
    return payload


@app.get("/api/v1/forecast", response_model=ForecastResponse)
async def forecast() -> Any:
    name = "forecast"
    hit = _cached(name, CACHE_TTL_SECONDS)
    if hit:
        return hit

    thresholds = index.load_thresholds()
    mode = "live"
    series: list[dict[str, Any]] = []
    try:
        series = await openmeteo.fetch_daily(past_days=EVIDENCE_DAYS, forecast_days=FORECAST_DAYS + 1)
    except Exception:  # noqa: BLE001 - demo must survive a dead uplink
        series = []

    today = openmeteo.today_local()
    upcoming = [d for d in series if d["date"] >= today][:FORECAST_DAYS]
    if not upcoming:
        stale = cache.read(name)
        if stale:
            stale["data_mode"] = "stale-cache"
            return stale
        fb = _fallback(name)
        if fb:
            fb["data_mode"] = "fallback"
            return fb
        raise HTTPException(status_code=503, detail="No forecast data available")

    days = [advice.day_payload(d, thresholds) for d in upcoming]
    flood = hazards.for_series(series)
    for day in days:
        day["flood"] = flood.get(day["date"])
    alert_list = hazards.alerts(days)

    def worst(levels: list[str]) -> str:
        order = ["low", "moderate", "high", "severe"]
        return max(levels, key=order.index) if levels else "low"

    payload = {
        "location": GOMBE,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "data_mode": mode,
        "days": days,
        "thresholds": index.thresholds_summary(thresholds),
        "sources": SOURCES,
        "disclaimer": advice.DISCLAIMER,
        "hazards": {
            "dust": worst([d["level"] for d in days]),
            "flood": worst([d["flood"]["level"] for d in days if d.get("flood")]),
            "alerts": len(alert_list),
        },
        "alerts": alert_list,
        "nasa_latest": {
            "date": thresholds.get("nasa", {}).get("latest_date"),
            "note": (
                "MERRA-2 aerosol products lag real time; NASA POWER supplies the "
                "climatology and seasonal baseline rather than today's value."
            ),
        },
    }
    cache.write(name, payload)
    return payload


@app.get("/api/v1/evidence")
async def evidence(days: int = EVIDENCE_DAYS) -> Any:
    name = "evidence"
    hit = _cached(name, CACHE_TTL_SECONDS)
    if hit:
        return hit

    thresholds = index.load_thresholds()
    try:
        series = await openmeteo.fetch_daily(past_days=max(days, 14), forecast_days=1)
    except Exception:  # noqa: BLE001
        fb = _fallback(name)
        if fb:
            fb["data_mode"] = "fallback"
            return fb
        raise HTTPException(status_code=503, detail="Evidence data unavailable")

    today = openmeteo.today_local()
    live = [row for row in series if row["date"] <= today][-days:]
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "data_mode": "live",
        "window_days": days,
        "live": live,
        "live_source": {
            "name": "CAMS via Open-Meteo",
            "note": "Daily mean dust surface concentration and AOD at Gombe.",
        },
        "nasa": {
            "latest_date": thresholds.get("nasa", {}).get("latest_date"),
            "lag_days": thresholds.get("nasa", {}).get("lag_days"),
            "season_label": thresholds.get("nasa", {}).get("season_label"),
            "series": thresholds.get("season_series", []),
            "percentiles": {
                "p50": thresholds.get("nasa", {}).get("p50"),
                "p90": thresholds.get("nasa", {}).get("p90"),
            },
            "source": "NASA POWER / MERRA-2 M2T1NXAER AOD_55 at 10.29°N, 11.17°E",
        },
        "crosscheck": thresholds.get("crosscheck", {}),
        "climatology": index.thresholds_summary(thresholds),
    }
    cache.write(name, payload)
    return payload


@app.get("/api/v1/validation")
async def validation() -> Any:
    """AERONET Ilorin daily AOD vs NASA MERRA-2 AOD for a harmattan month."""
    name = "validation"
    hit = cache.fresh(name, 7 * 24 * 3600)
    if hit:
        return hit

    try:
        start, end = aeronet.pick_validation_window()
        aero_rows = await aeronet.fetch_aod(start, end)
        aero_daily = aeronet.daily_mean(aero_rows)

        p = await power.fetch_daily(
            start.isoformat(),
            end.isoformat(),
            lat=8.487,
            lon=4.675,
            parameters="AOD_55",
        )
        pairs = []
        for day, value in p["days"].items():
            aod = value.get("AOD_55")
            if aod is not None and day in aero_daily:
                pairs.append((aod, aero_daily[day]))

        xs = [x for x, _ in pairs]
        ys = [y for _, y in pairs]
        bias = round(sum(y - x for x, y in pairs) / len(pairs), 3) if pairs else None
        payload = {
            "station": {
                "name": "Ilorin, Nigeria",
                "lat": 8.487,
                "lon": 4.675,
                "distance_km": 690,
                "note": "Nearest long-record AERONET site; regional check, not a Gombe station.",
            },
            "window": {"start": start.isoformat(), "end": end.isoformat()},
            "n_days": len(pairs),
            "pearson_r": aeronet.pearson(xs, ys) if pairs else None,
            "mean_bias_aeronet_minus_merra2": bias,
            "samples": [
                {"date": d, "aeronet_aod500": aero_daily[d], "merra2_aod550": v["AOD_55"]}
                for d, v in sorted(p["days"].items())
                if v.get("AOD_55") is not None and d in aero_daily
            ],
            "method": (
                "Daily mean AERONET level 1.5 AOD at 500 nm compared with NASA "
                "MERRA-2 AOD at 550 nm for the same calendar day."
            ),
            "caveat": "Wavelength mismatch (500 vs 550 nm) gives a small expected offset.",
        }
        cache.write(name, payload)
        return payload
    except Exception as exc:  # noqa: BLE001
        fb = _fallback(name)
        if fb:
            fb["data_mode"] = "fallback"
            return fb
        raise HTTPException(status_code=502, detail=f"Validation fetch failed: {exc}") from exc


@app.get("/api/v1/map")
def map_layers(day: str | None = None) -> dict[str, Any]:
    return gibs.payload(day)


@app.get("/api/v1/replay")
def replay_events() -> dict[str, Any]:
    """Real historical days, clearly labelled, for demoing high/severe states."""
    return replay.payload()


@app.get("/api/v1/hindcast")
def hindcast() -> dict[str, Any]:
    """Held-out-season checks and weight sensitivity, generated offline."""
    try:
        return json.loads((DATA_DIR / "hindcast.json").read_text())
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=404, detail="hindcast.json not built") from exc


@app.post("/api/v1/ingest")
async def ingest(
    payload: dict[str, Any],
    request: Request,
    x_api_key: str | None = Header(default=None),
) -> dict[str, Any]:
    """Arduino node endpoint.

    Set KURA_INGEST_KEY to require a shared key. If it is unset, only local
    requests are accepted, so a laptop demo works without a key but an exposed
    deployment cannot be written to anonymously.
    """
    expected = os.getenv("KURA_INGEST_KEY")
    client_host = request.client.host if request.client else ""
    if expected:
        if x_api_key != expected:
            raise HTTPException(status_code=401, detail="invalid ingest key")
    elif client_host not in {"127.0.0.1", "::1", "localhost", "testclient"}:
        raise HTTPException(
            status_code=401,
            detail="KURA_INGEST_KEY must be set for non-local ingest",
        )
    return sensors.add_reading(payload)


@app.get("/api/v1/sensors/latest")
def sensors_latest() -> dict[str, Any]:
    return sensors.latest()


@app.get("/api/v1/sensors/series")
def sensors_series(device_id: str | None = None, hours: int = 24) -> dict[str, Any]:
    return sensors.series(device_id=device_id, hours=max(1, min(hours, 168)))


@app.post("/api/v1/subscribe", response_model=SubscribeResponse)
async def subscribe(req: SubscribeRequest) -> Any:
    try:
        result = store.add_subscriber(req.phone, req.language, req.audience)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    message = (
        "You are already on the demo list."
        if result.get("duplicate")
        else "You are on the demo list. No messages are sent in this prototype."
    )
    return {**result, "message": message}


@app.get("/api/v1/stats")
def stats() -> dict[str, Any]:
    return store.stats()


@app.get("/api/v1/thresholds")
def thresholds() -> dict[str, Any]:
    return index.thresholds_summary(index.load_thresholds())


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception) -> JSONResponse:  # pragma: no cover
    return JSONResponse(status_code=500, content={"detail": "internal error", "error": str(exc)})
