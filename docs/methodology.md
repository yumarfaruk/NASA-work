# Methodology

Ƙura Alert is deliberately **rule-based**. Every score can be recomputed by
hand from the JSON the API returns, and every threshold comes from a named
sample of real harmattan days. There is no black box to defend.

## 1. The dust index

```
score = 100 × (0.50 · p_dust + 0.25 · p_AOD + 0.15 · p_wind + 0.10 · p_dryness)
```

| Term | Input | Source | Weight |
| --- | --- | --- | --- |
| `p_dust` | Daily mean surface dust concentration (µg/m³) | CAMS via Open-Meteo | 0.50 |
| `p_AOD` | Daily mean aerosol optical depth at 550 nm | CAMS via Open-Meteo | 0.25 |
| `p_wind` | Daily mean 10 m wind speed (km/h) | ERA5 via Open-Meteo | 0.15 |
| `p_dryness` | `1 − p_RH`, where RH is daily mean relative humidity | ERA5 via Open-Meteo | 0.10 |

### Percentile transform

Each raw value is converted to an empirical percentile **against the same
calendar window in every season**, not against the whole year:

- target day ± 21 days (43-day window);
- four harmattan seasons, Nov–Mar 2022/23 → 2025/26;
- 605 usable days in total;
- at most 4 × 43 = 172 comparison days per target, usually ~143.

So a November score is compared with November, not with a dusty February. This
matters in Gombe: the early-season dust front and the late-season dry haze have
different distributions.

The percentile is the fraction of comparison days below the observed value.
`0.90` means "dustier/drier/windier than 90 % of normal days in this window".

### Worked example (2026-11-15, live data)

| Input | Value | Percentile |
| --- | --- | --- |
| Dust | 49.9 µg/m³ | 0.042 |
| AOD | 0.132 | 0.035 |
| Wind | 11.0 km/h | 0.587 |
| RH | 18.3 % → dryness | 0.951 |

```
100 × (0.50×0.042 + 0.25×0.035 + 0.15×0.587 + 0.10×0.951)
= 100 × (0.021 + 0.0088 + 0.0881 + 0.0951)
= 21.3  →  Low
```

The clean-air cap (below) did not bind because the raw score was already 21.3.

### Guardrails

Two rules stop the formula producing a silly answer:

1. **Clean-air cap.**
   - dust percentile < 0.15 → score capped at **44** (Low);
   - dust percentile < 0.30 → score capped at **55** (Moderate).
   This prevents a hot, dry, windy day with clean air from being labelled a
   dust event. Wind and dryness cannot outvote the absence of dust.
2. **Rain washout.**
   - ≥ 5 mm rain → **−20** points;
   - ≥ 2 mm rain → **−10** points.
   Rain scavenges particles and settles dust. The flood model is kept separate
   so the same rain can raise flood risk while lowering dust risk.

### Levels

| Score | Level | English | Hausa (pending review) |
| --- | --- | --- | --- |
| 0–49 | Low | Low | Ƙarami |
| 50–74 | Moderate | Moderate | Matsakaici |
| 75–89 | High | High | Yawa |
| 90–100 | Severe | Severe | Haɗari |

The cuts are at the 50th, 75th and 90th percentiles of the composite index,
matching the empirical distribution of the four input percentiles.

### Hindcast and weight sensitivity

The formula is applied out of sample in two ways, and both are published:

- **Known events.** The five dustiest real days in the sample score **5/5 High
  or Severe** (4 Severe); the five cleanest score **5/5 Low**.
- **Held-out seasons.** Train the seasonal percentiles on three seasons and
  test on the fourth. Clean-decile recall is **65/65**; dusty-decile recall is
  **24/65 (36.9 %)** at High/Severe. The clean side is strong, the dusty side
  is modest, and we say so.
- **NASA cross-check.** Relabelling the held-out 2025/26 season with NASA
  MERRA-2 AOD gives 2/16 High/Severe in the top decile and 19/19 Low/Moderate
  in the bottom. CAMS and MERRA-2 AOD correlate at r = 0.644; this is
  cross-source agreement, not forecast skill.
- **Weights.** Scaling every weight by ±10 % changes **0 of 605** level
  labels. Equal weights change 18.5 %; dropping wind and dryness changes
  19.3 %. The weights are hand-picked, not fitted, and the tests show how much
  that matters.

Full tables, methods and caveats: [`docs/hindcast.md`](hindcast.md). Raw
numbers: [`data/hindcast.json`](../data/hindcast.json). This is a **historical
replay of the index**, not a 3-day-ahead forecast verification; no archived
forecast runs were available.

## 2. Flood early warning

Flood is a second hazard over the same three-day window. It uses the rainfall
forecast, not the dust index.

```
flood_raw = 100 × (0.55 · min(1, rain_24 / 50)
                 + 0.30 · min(1, rain_72 / 90)
                 + 0.15 · min(1, rain_7_prior / 120))
```

- `rain_24` = forecast rain for the day, in mm;
- `rain_72` = the day plus the previous two days;
- `rain_7_prior` = the seven days before the day (antecedent saturation).

Hard floors make a single heavy-rain day impossible to report as low:

| 24 h rain | Floor | Minimum level |
| --- | --- | --- |
| ≥ 15 mm | 50 | Moderate / Watch |
| ≥ 30 mm | 75 | High |
| ≥ 50 mm | 90 | Severe |

The floors are intentionally conservative. A 45 mm day is High even if the rest
of the week was dry, because urban drains in Gombe are not sized for that
intensity. The score and all three rain totals are returned, so a user can see
why. The UI also plots the 15/30/50 mm reference lines.

### Flood copy

Four levels with a headline and one action each, in English and Hausa. The
advice is practical: clear drains, raise stock, avoid low roads, do not cross
running water. It does not claim to predict river discharge.

## 3. Alerts

A banner alert is emitted when **either** hazard reaches High or Severe:

```json
{
  "hazard": "dust" | "flood",
  "level": "high" | "severe",
  "date": "2026-11-16",
  "en": "…",
  "ha": "…"
}
```

`/api/v1/forecast` also returns a `hazards` summary with the worst dust level,
the worst flood level and the alert count. The top banner shows the first alert;
the warning panel always shows both hazards for the selected day.

## 4. What the dashboard shows, and why

| Surface | Purpose |
| --- | --- |
| Gauge | One number and one level for the selected day, with the four input bars |
| Day strip | Compare three days without opening a chart |
| WhatsApp/SMS card | The actual message a user would send, in Hausa or English |
| Flood + ground node panel | The second hazard and the physical sensor reading side by side |
| Advice cards | Laundry, market, school, health — concrete actions, not adjectives |
| Evidence tabs | Live CAMS series, NASA MERRA-2 baseline, satellite imagery |
| Historical replay | Two real past days (dust and flood), labelled **Not a forecast** |
| How it works | The formula, weights, cuts and flood thresholds in the page |
| Subscribe | Demo capture of a phone number; no messages are sent |

Health advice is **general guidance, not medical advice**. Both languages carry
that disclaimer in the footer and in share messages.

## 5. Data modes and failure behaviour

| Mode | When | What the user sees |
| --- | --- | --- |
| `live` | Open-Meteo fetch succeeds | Fresh data, "Live data" badge |
| `stale-cache` | Fetch fails but a recent cache exists | Cached forecast, "Cached data" badge |
| `fallback` | Fetch and cache fail; bundled snapshot used | "Offline snapshot" badge |

The Next.js app also bundles JSON snapshots in `apps/web/lib/fallback/`, so a
dead API or a dead uplink still produces a complete page. A missing API gets
`data_mode: fallback` and the UI label, never a blank screen.

The API caches live responses for 30 minutes (`KURA_CACHE_TTL`). Sensor data is
separate and always current; it is read from SQLite.

## 6. Reproducibility

```bash
# Rebuild thresholds from the committed raw sample (no network):
cd services/api && .venv/bin/python scripts/derive_thresholds.py

# Rebuild the hindcast and sensitivity tables (no network):
.venv/bin/python scripts/hindcast.py

# Rebuild the two replay events (network required once):
.venv/bin/python scripts/build_replay.py

# Re-fetch the four seasons (network, ~1–2 min):
rm ../data/climatology_raw.json && .venv/bin/python scripts/derive_thresholds.py

# Test the core rules:
.venv/bin/pytest -q
```

`data/thresholds.json`, `data/replay.json` and `data/hindcast.json` are
committed, so the demo is deterministic even if the archive hosts are down. The
API records `generated_at` and exposes it at `/health` and
`/api/v1/thresholds`.

### Ingest and demo data

`/api/v1/ingest` is the only write endpoint. If `KURA_INGEST_KEY` is unset, it
accepts local requests only (`127.0.0.1` / `::1`); set a strong key before the
node posts from another machine or before exposing the API. The subscriber
form is demo-only: numbers are stored in a git-ignored SQLite file and no
messages are sent.

## 7. What this model is not

- Not a machine-learning model. No fitted weights and no hidden layers; the
  held-out-season checks test a fixed rule, not a trained predictor.
- Not an official NiMet or NEMA forecast. It is a hackathon prototype.
- Not a hydrological flood model. It is a rainfall-threshold early warning.
- Not a medical service. Health copy is general guidance.
- Not calibrated to a Gombe sensor yet. The Arduino node is the start of that
  calibration; the AERONET check is regional (Ilorin, ~690 km away) and
  validates MERRA-2, not the live CAMS forecast.
- Not a verified 3-day forecast. The hindcast applies the index to observed
  days; it does not measure forecast skill.
