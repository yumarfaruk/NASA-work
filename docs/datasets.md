# Datasets and freshness

Ƙura Alert uses open data only. No API key is required for the demo. The one
deliberate compromise is that NASA's near-real-time aerosol products lag, so
live conditions come from CAMS and NASA supplies the climatology, baseline and
imagery. That trade-off is shown in the UI, not hidden.

## What is used, and for what

| Source | Variables | Role in the app | Access | Freshness at build |
| --- | --- | --- | --- | --- |
| **CAMS global atmospheric composition** via Open-Meteo | `dust`, `aerosol_optical_depth`, `pm10`, `pm2_5` | Live dust, AOD, PM, 3-day outlook, 14-day evidence chart | `air-quality-api.open-meteo.com`, no key | Hourly model fields; daily means computed locally |
| **ERA5** via Open-Meteo | `wind_speed_10m`, `wind_direction_10m`, `relative_humidity_2m`, `temperature_2m`, `precipitation` | Wind and dryness inputs; rainfall for the flood score; 14-day rain chart | `api.open-meteo.com`, no key | Hourly; daily means/sums computed locally |
| **NASA POWER / MERRA-2** | `AOD_55` (aerosol optical depth at 550 nm) | Harmattan climatology, NASA seasonal baseline, CAMS cross-check, AERONET validation | `power.larc.nasa.gov`, no key | **Latest 2026-08-30 = 77-day lag** at build |
| **NASA GIBS / Worldview** | VIIRS true colour, MODIS Deep Blue AOD, OMI UV aerosol index | Satellite tab imagery and a link to Worldview | WMS, no key | 1–2 days, depending on layer |
| **AERONET — Ilorin, Nigeria** | Level 1.5 AOD at 500 nm | Ground-truth validation of MERRA-2 | `aeronet.gsfc.nasa.gov`, no key | 2025-01-01 → 2025-01-31 window at build |
| **MODIS MAIAC / VIIRS Deep Blue** | AOD | Documented validation track, not required for the demo | LAADS DAAC (account) | Cited only |

Derived, committed files:

| File | Contents | Built by |
| --- | --- | --- |
| `data/climatology_raw.json` | 605 harmattan days of CAMS/ERA5 daily means | `scripts/derive_thresholds.py` |
| `data/thresholds.json` | Percentiles, NASA baseline, 2025/26 season | `scripts/derive_thresholds.py` |
| `data/hindcast.json` | Known events, held-out seasons, NASA cross-check, sensitivity | `scripts/hindcast.py` (no network) |
| `data/replay.json` | Two real replay days: 5 Feb 2024 dust, 19 Aug 2024 flood | `scripts/build_replay.py` (network once) |

## Why CAMS for live dust

NASA's near-real-time dust fields (GEOS-CF, MERRA-2 aerosol) need Earthdata
credentials and large downloads. CAMS is the operational global composition
model, is free, returns JSON, and carries dust and AOD at the same grid. For a
36-hour build it is the responsible choice. NASA still anchors the science:
MERRA-2 defines what a normal and a dusty harmattan day look like, GIBS shows
the plume, and AERONET checks the reanalysis.

## Climatology sample

`data/climatology_raw.json` contains **605 harmattan days** (Nov–Mar) from four
seasons: 2022/23, 2023/24, 2024/25 and 2025/26. Daily means of hourly CAMS
dust/AOD and ERA5 wind/RH are stored for Gombe (10.2896 °N, 11.1675 °E).

`data/thresholds.json` is derived from that sample:

- empirical distributions (`p10`…`p95`, mean, full sorted sample) for dust,
  AOD, wind and RH;
- NASA MERRA-2 AOD percentiles (`p50 0.34`, `p90 0.64`) and the 2025/26
  seasonal series;
- CAMS-vs-MERRA-2 cross-check: **n = 605, r = 0.644, bias = +0.039 AOD**;
- the method string and generation timestamp.

Regenerate with:

```bash
make thresholds
# or: cd services/api && .venv/bin/python scripts/derive_thresholds.py
```

The script reuses `climatology_raw.json` when present. Delete it to re-fetch
the four seasons (about 1–2 minutes, network required).

## Validation

AERONET Ilorin is the nearest long-record sun-photometer site to Gombe
(~690 km south-west). It is a regional check, not a Gombe station.

| Metric | Value | Meaning |
| --- | --- | --- |
| Pearson r | **0.865** | MERRA-2 tracks the observed day-to-day aerosol load well |
| n | **30 days** | January 2025 daily means |
| Mean bias (AERONET − MERRA-2) | **+0.163 AOD** | MERRA-2 is slightly low for this window |
| Wavelength | 500 nm vs 550 nm | Small expected offset from the mismatch |

**This validates MERRA-2, not the live forecast.** It is a regional
reanalysis check; it does not tell you how often the 3-day CAMS forecast is
right in Gombe. Do not quote r = 0.865 as forecast accuracy.

The UI shows the scatter plot, the r/n/bias tiles and the caveat. The endpoint
is `/api/v1/validation`; it caches for 7 days.

## Cross-checks on the index

Two extra checks live in [`docs/hindcast.md`](hindcast.md) and
`/api/v1/hindcast`:

- **Held-out seasons:** thresholds trained on three harmattan seasons, tested on
  the fourth. Clean-decile recall 65/65; dusty-decile recall 24/65 (36.9 %).
- **NASA-labelled cross-check:** the 2025/26 season labelled by MERRA-2 AOD
  instead of CAMS AOD. Top decile 2/16 High/Severe, bottom decile 19/19
  Low/Moderate. CAMS and MERRA-2 AOD correlate at r = 0.644, so this is
  agreement between two models, not independent truth.

Both are **observed-day replays, not forecast verification**.

## Known data caveats

1. **MERRA-2 lag.** 77 days at build time. The NASA tab states the date and lag
   in a badge. We do not present MERRA-2 as "today".
2. **CAMS is a model, not a sensor.** It is good at synoptic dust transport,
   less good at a single market. The Arduino node exists to close that gap.
3. **AERONET is 690 km away.** Ilorin is humid and southern; Gombe is dry
   savannah. The correlation is encouraging, not a local calibration.
4. **Daily means hide dust storms.** A three-hour severe event can disappear in
   a 24-hour mean. The 3-day outlook is the decision surface; the 14-day chart
   is context.
5. **Rain forecast uncertainty.** Flood scores use the CAMS/ERA5 blend from
   Open-Meteo. The hard floors prevent a false "low" on a heavy-rain day, but
   the score is not a hydrological model.
6. **GIBS availability.** Some layers are delayed or blank for a date. The UI
   has an explicit "satellite image unavailable" state and a Worldview link.
7. **Replay is not live.** The two replay events are real past days, scored
   with today's model. They are labelled **Not a forecast** and never enter
   `/api/v1/forecast`.
8. **NASA AOD is a model too.** MERRA-2 is a reanalysis, not a sensor. The
   AERONET comparison is the nearest thing to ground truth in this repo.

## Licensing and attribution

All sources are open and require attribution, not payment. NASA POWER and GIBS
are US Government works; AERONET requests acknowledgement; Open-Meteo data is
CC-BY-4.0 (CAMS/ERA5 attribution). The dashboard footer lists every source and
links to it. Ƙura Alert itself is MIT licensed.
