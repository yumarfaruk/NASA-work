from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class SubscribeRequest(BaseModel):
    phone: str = Field(min_length=7, max_length=24)
    language: str = Field(default="ha", pattern="^(ha|en|both)$")
    audience: str | None = Field(default=None, max_length=40)


class SubscribeResponse(BaseModel):
    ok: bool
    id: int | None = None
    duplicate: bool = False
    phone: str | None = None
    message: str


class LevelMeta(BaseModel):
    key: str
    en: str
    ha: str
    color: str
    blurb_en: str
    blurb_ha: str
    emoji: str


class Component(BaseModel):
    key: str
    label_en: str
    label_ha: str
    value: float | None
    unit: str
    percentile: float | None
    weight: float
    source: str


class DayForecast(BaseModel):
    date: str
    weekday_en: str
    weekday_ha: str
    date_label_en: str
    date_label_ha: str
    is_today: bool
    score: float
    level: str
    level_meta: LevelMeta
    headline: dict[str, str]
    advice: dict[str, dict[str, Any]]
    components: list[Component]
    percentiles: dict[str, float | None]
    basis: dict[str, Any]
    guardrails: list[str]
    flood: dict[str, Any] | None = None
    dust: float | None
    aod: float | None
    pm10: float | None
    wind: float | None
    wind_dir: float | None
    rh: float | None
    temp: float | None
    precip: float
    message: dict[str, str]


class Location(BaseModel):
    name: str
    state: str
    country: str
    lat: float
    lon: float
    timezone: str


class ForecastResponse(BaseModel):
    location: Location
    generated_at: str
    data_mode: str
    days: list[DayForecast]
    thresholds: dict[str, Any]
    sources: list[dict[str, str]]
    disclaimer: dict[str, str]
    nasa_latest: dict[str, Any] | None = None
    hazards: dict[str, Any] | None = None
    alerts: list[dict[str, Any]] = []
