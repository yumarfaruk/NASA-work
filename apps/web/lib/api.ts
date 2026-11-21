import type {
  Evidence,
  Forecast,
  MapData,
  ReplayData,
  SensorLatest,
  SubscriberStats,
  Validation,
} from "./types";

import forecastFallback from "./fallback/forecast.json";
import evidenceFallback from "./fallback/evidence.json";
import validationFallback from "./fallback/validation.json";
import mapFallback from "./fallback/map.json";
import statsFallback from "./fallback/stats.json";
import replayFallback from "./fallback/replay.json";

const API_BASE = process.env.KURA_API_URL ?? "http://127.0.0.1:8000";
const TIMEOUT_MS = Number(process.env.KURA_FETCH_TIMEOUT ?? 15000);

type Loaded<T> = { data: T; live: boolean };

async function fetchJson<T>(path: string, fallback: T): Promise<Loaded<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: (await res.json()) as T, live: true };
  } catch {
    return { data: fallback, live: false };
  }
}

const EMPTY_SENSORS: SensorLatest = {
  devices: [],
  count: 0,
  note: "Sensor API unreachable.",
};

export async function getDashboardData() {
  const [forecast, evidence, validation, map, sensors, stats, replay] = await Promise.all([
    fetchJson<Forecast>("/api/v1/forecast", forecastFallback as unknown as Forecast),
    fetchJson<Evidence>("/api/v1/evidence", evidenceFallback as unknown as Evidence),
    fetchJson<Validation>("/api/v1/validation", validationFallback as unknown as Validation),
    fetchJson<MapData>("/api/v1/map", mapFallback as unknown as MapData),
    fetchJson<SensorLatest>("/api/v1/sensors/latest", EMPTY_SENSORS),
    fetchJson<SubscriberStats>("/api/v1/stats", statsFallback as unknown as SubscriberStats),
    fetchJson<ReplayData>("/api/v1/replay", replayFallback as unknown as ReplayData),
  ]);

  return {
    forecast: forecast.data,
    evidence: evidence.data,
    validation: validation.data,
    map: map.data,
    sensors: sensors.data,
    stats: stats.data,
    replay: replay.data,
    degraded: !forecast.live,
  };
}

export async function subscribeToAlerts(input: {
  phone: string;
  language: string;
  audience?: string;
}) {
  const res = await fetch(`${API_BASE}/api/v1/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return (await res.json()) as {
    ok: boolean;
    id: number | null;
    duplicate: boolean;
    phone: string | null;
    message: string;
  };
}

export async function getStats(): Promise<SubscriberStats> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/stats`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SubscriberStats;
  } catch {
    return statsFallback as unknown as SubscriberStats;
  }
}
