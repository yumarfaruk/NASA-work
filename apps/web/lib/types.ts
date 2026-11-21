export type Lang = "en" | "ha";

export interface LevelMeta {
  key: string;
  en: string;
  ha: string;
  color: string;
  blurb_en: string;
  blurb_ha: string;
  emoji: string;
}

export interface Component {
  key: string;
  label_en: string;
  label_ha: string;
  value: number | null;
  unit: string;
  percentile: number | null;
  weight: number;
  source: string;
}

export interface AdviceItem {
  en: string;
  ha: string;
  icon: string;
}

export interface FloodRisk {
  score: number;
  level: string;
  level_meta: { key: string; en: string; ha: string; color: string; emoji: string };
  rain_24h: number;
  rain_72h: number;
  rain_7d_prior: number;
  headline: { en: string; ha: string };
  advice: { en: string; ha: string };
  guardrails: string[];
  thresholds: { watch_mm: number; high_mm: number; severe_mm: number };
}

export interface DayForecast {
  date: string;
  weekday_en: string;
  weekday_ha: string;
  date_label_en: string;
  date_label_ha: string;
  is_today: boolean;
  score: number;
  level: string;
  level_meta: LevelMeta;
  headline: { en: string; ha: string };
  advice: Record<"laundry" | "market" | "school" | "health", AdviceItem>;
  components: Component[];
  percentiles: Record<string, number | null>;
  basis: { seasonal: boolean; window_days: number; sample_days: number };
  guardrails: string[];
  flood: FloodRisk | null;
  dust: number | null;
  aod: number | null;
  pm10: number | null;
  wind: number | null;
  wind_dir: number | null;
  rh: number | null;
  temp: number | null;
  precip: number;
  message: Record<"whatsapp_en" | "whatsapp_ha" | "sms_en" | "sms_ha", string>;
}

export interface LocationInfo {
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface ThresholdSummary {
  sample_days: number;
  seasons: string[];
  method: string;
  generated_at: string | null;
  cuts: Record<string, number>;
  weights: Record<string, number>;
  window_days?: number;
  references: Record<string, number | null>;
  seasonal_references?: Record<string, { p50: number; p90: number; n: number }>;
}

export interface Forecast {
  location: LocationInfo;
  generated_at: string;
  data_mode: string;
  days: DayForecast[];
  thresholds: ThresholdSummary;
  sources: { name: string; url: string; role: string }[];
  disclaimer: { en: string; ha: string };
  nasa_latest: { date: string | null; note: string } | null;
  hazards: { dust: string; flood: string; alerts: number };
  alerts: { hazard: string; level: string; date: string; en: string; ha: string }[];
}

export interface LivePoint {
  date: string;
  dust: number | null;
  aod: number | null;
  pm10: number | null;
  pm25: number | null;
  wind: number | null;
  wind_dir: number | null;
  rh: number | null;
  temp: number | null;
  precip: number;
}

export interface NasaSeriesPoint {
  date: string;
  aod: number;
}

export interface Evidence {
  generated_at: string;
  data_mode: string;
  window_days: number;
  live: LivePoint[];
  live_source: { name: string; note: string };
  nasa: {
    latest_date: string | null;
    lag_days: number | null;
    season_label: string | null;
    series: NasaSeriesPoint[];
    percentiles: { p50: number | null; p90: number | null };
    source: string;
  };
  crosscheck: {
    n?: number;
    pearson_r?: number | null;
    mean_bias_merra2_minus_cams?: number | null;
    window?: string;
    note?: string;
  };
  climatology: ThresholdSummary;
}

export interface ValidationSample {
  date: string;
  aeronet_aod500: number;
  merra2_aod550: number;
}

export interface Validation {
  station: { name: string; lat: number; lon: number; distance_km: number; note: string };
  window: { start: string; end: string };
  n_days: number;
  pearson_r: number | null;
  mean_bias_aeronet_minus_merra2: number | null;
  samples: ValidationSample[];
  method: string;
  caveat: string;
  data_mode?: string;
}

export interface MapLayer {
  id: string;
  label: string;
  note: string;
  url: string;
}

export interface MapData {
  date: string;
  bbox: { lat_min: number; lon_min: number; lat_max: number; lon_max: number };
  marker: { lat: number; lon: number; left_pct: number; top_pct: number };
  layers: MapLayer[];
  attribution: string;
  worldview_url: string;
}

export interface SubscriberStats {
  total: number;
  by_language: Record<string, number>;
  by_audience: Record<string, number>;
}

export interface SensorReading {
  id: number;
  device_id: string;
  ts: string;
  pm25: number | null;
  pm10: number | null;
  dust_ugm3: number | null;
  rain_mm: number | null;
  water_level_cm: number | null;
  temp_c: number | null;
  humidity: number | null;
  simulated?: boolean;
}

export interface SensorLatest {
  devices: SensorReading[];
  count: number;
  note: string;
}

export interface ReplayEvent {
  id: string;
  kind: "dust" | "flood";
  date: string;
  title_en: string;
  title_ha: string;
  context_en: string;
  context_ha: string;
  source: string | null;
  day: DayForecast;
}

export interface ReplayData {
  events: ReplayEvent[];
  count: number;
  generated_at: string;
  note: string;
  disclaimer: { en: string; ha: string };
}
