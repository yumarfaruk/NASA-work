# Hindcast and weight sensitivity

A calm November demo should not hide how the index behaves. This page records
the checks behind the claim "the score is auditable". Everything here is
generated from committed data by
[`services/api/scripts/hindcast.py`](../services/api/scripts/hindcast.py) and
served at `/api/v1/hindcast`. The raw numbers are in
[`data/hindcast.json`](../data/hindcast.json).

## What this is, and what it is not

**It is** the current index applied to real observed days, with the seasonal
percentile thresholds trained on *other* seasons. That is a genuine
out-of-sample test of the rule, not of a forecast.

**It is not a forecast skill score.** No archived forecast fields were
available, so we cannot say "the 3-day-ahead forecast caught this event". The
labels come from the same CAMS/ERA5 archive that feeds the inputs, which makes
this an easier test than a real forecast. Read the recall numbers as an upper
bound, not a promise.

## The checks

| Check | Question it answers |
| --- | --- |
| **Known events** | Does the index recognise the dustiest and cleanest real days? |
| **Held-out seasons** | Does it still work on a season whose thresholds it never saw? |
| **NASA cross-check** | Do NASA MERRA-2 AOD labels agree with the CAMS-scored index? |
| **Weight sensitivity** | How much does the answer move if the hand-picked weights are wrong? |

## 1. Known events

The five dustiest and five cleanest days in the 605-day sample, each scored
with thresholds trained on the other three seasons.

### Dustiest days

| Date | Season | Dust (µg/m³) | AOD | Score | Level |
| --- | --- | ---: | ---: | ---: | --- |
| 2024-02-05 | 2023/24 | 2,353.8 | 0.768 | 95.9 | **Severe** |
| 2024-02-06 | 2023/24 | 2,302.1 | 0.765 | 92.9 | **Severe** |
| 2024-02-04 | 2023/24 | 2,051.0 | 0.807 | 95.2 | **Severe** |
| 2024-02-07 | 2023/24 | 1,954.9 | 0.703 | 87.3 | **High** |
| 2024-02-03 | 2023/24 | 1,902.0 | 0.902 | 92.9 | **Severe** |

**5/5 High or Severe, 4 of them Severe.**

### Cleanest days

| Date | Season | Dust (µg/m³) | AOD | Score | Level |
| --- | --- | ---: | ---: | ---: | --- |
| 2022-12-14 | 2022/23 | 0.0 | 0.031 | 14.2 | **Low** |
| 2022-12-15 | 2022/23 | 0.0 | 0.037 | 16.3 | **Low** |
| 2023-11-04 | 2023/24 | 28.2 | 0.347 | 16.3 | **Low** |
| 2025-11-11 | 2025/26 | 31.2 | 0.151 | 16.4 | **Low** |
| 2024-11-14 | 2024/25 | 32.5 | 0.095 | 18.1 | **Low** |

**5/5 Low.** Several were held down by the clean-air cap, which is the
guardrail doing its job.

## 2. Held-out seasons

For each harmattan season, the percentile thresholds are trained on the other
three seasons. Days are labelled dusty or clean by the **top and bottom decile
of that season's own CAMS AOD** — not by the index score, which would be
circular.

| Held-out season | Days | Dusty days | Caught (High/Severe) | Clean days | Correctly Low/Moderate |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2022/23 | 151 | 16 | 3 (18.8 %) | 17 | 17 (100 %) |
| 2023/24 | 152 | 17 | 17 (100 %) | 16 | 16 (100 %) |
| 2024/25 | 151 | 16 | 2 (12.5 %) | 16 | 16 (100 %) |
| 2025/26 | 151 | 16 | 2 (12.5 %) | 16 | 16 (100 %) |
| **Pooled** | **605** | **65** | **24 (36.9 %)** | **65** | **65 (100 %)** |

### How to read this honestly

- **The clean side is strong.** 65/65 clean-decile days were Low or Moderate.
  The index does not cry dust on a clear day. That is the failure mode that
  destroys trust in an alerting product.
- **The dusty side is modest.** 24/65 = **36.9 % recall** at High/Severe. Many
  genuinely dusty days land in Moderate. The 2023/24 season is an outlier at
  17/17 because it contains the exceptional February 2024 plume; the other
  three seasons catch only 2–3 of 16 each.
- **Why:** a day can have high AOD but only moderate surface dust, or high dust
  with moderate AOD and light wind. The equal weighting of the four inputs
  spreads the score, so a day must be dusty *and* dry *and* windy to reach 75.
  That is a deliberate bias toward fewer false alarms.
- **Implication for users:** treat **Moderate** as "watch" in the late
  harmattan, not "ignore". The advice copy already does this. A future version
  should calibrate the Moderate band against local dust observations, not just
  archive AOD.

## 3. NASA cross-check

A second, source-independent label: the held-out 2025/26 season labelled by
**NASA MERRA-2 `AOD_55`** from POWER instead of CAMS AOD, then scored with the
CAMS/ERA5 index.

| Check | Result |
| --- | --- |
| NASA AOD top decile (p90 = 0.64) | 2/16 High or Severe (12.5 %) |
| NASA AOD bottom decile (p10 = 0.22) | 19/19 Low or Moderate (100 %) |
| Top five NASA AOD days | 1 High, 4 Moderate |
| Bottom five NASA AOD days | 5/5 Low |

The top five NASA AOD days: 2026-02-18 (AOD 1.58, score 75.7, High), then
2026-02-17, 2026-02-20, 2026-02-19 and 2026-03-31 (Moderate, 65–73).

**Caveat:** CAMS AOD and MERRA-2 AOD are correlated at **r = 0.644** over the
605 days. This checks cross-source agreement, not independent forecast skill.
The two products disagree on individual days, and the low dusty-side recall
reflects that as much as it reflects the index.

## 4. Weight sensitivity

The weights (0.50 dust, 0.25 AOD, 0.15 wind, 0.10 dryness) are **hand-picked,
not fitted** to labels. We therefore test how much the level answer changes
when they move. "Changed" means the Low/Moderate/High/Severe label differs from
the baseline for that day.

| Scenario | Weights (dust / AOD / wind / dryness) | Days changing level | Share |
| --- | --- | ---: | ---: |
| Baseline | 0.50 / 0.25 / 0.15 / 0.10 | 0 | 0 % |
| Plausible +10 % | 0.55 / 0.275 / 0.165 / 0.11 | 0 | 0 % |
| Plausible −10 % | 0.45 / 0.225 / 0.135 / 0.09 | 0 | 0 % |
| Equal weights | 0.25 / 0.25 / 0.25 / 0.25 | 112 | **18.5 %** |
| Dust-heavy | 0.65 / 0.15 / 0.10 / 0.10 | 46 | 7.6 % |
| AOD-heavy | 0.35 / 0.40 / 0.15 / 0.10 | 47 | 7.8 % |
| Wind + dryness heavy | 0.35 / 0.15 / 0.30 / 0.20 | 98 | 16.2 % |
| No wind or dryness | 0.65 / 0.35 / 0.00 / 0.00 | 117 | 19.3 % |

- **Small perturbations do not matter.** Scaling every weight by ±10 % moves
  **0 of 605 days**, because the score is normalised and the relative weights
  are unchanged.
- **Large reweighting does matter.** Equal weights move 18.5 % of days, almost
  all by one band near a cut. Dropping wind and dryness moves 19.3 % and pushes
  more days into Severe, because the composite loses its moderating terms.
- **What this means:** the headline levels are robust to honest uncertainty in
  the weights, but they are not invariant. The dashboard exposes the four input
  percentiles so a user can see *why* a day scored where it did, and the
  formula is short enough to recompute.

## 5. Reproduce it

```bash
make hindcast    # rebuilds data/hindcast.json from committed data, no network
make test        # includes replay and hindcast endpoint checks
```

The script is deterministic: it reads `data/climatology_raw.json` and
`data/thresholds.json`, trains thresholds per held-out season, and writes the
JSON. Nothing is fetched. Change the sample or the index and the numbers change
with it.

## 6. Open items

- **No archived forecast fields.** We test the index, not the 3-day-ahead
  forecast. A proper hindcast needs stored forecast runs; that is the next data
  task.
- **AOD labels are not ground truth.** Both CAMS and MERRA-2 are models. The
  only true observation is the AERONET sun photometer at Ilorin, ~690 km away,
  and the Arduino node once it is calibrated.
- **Moderate-band calibration.** The weak dusty-side recall is a calibration
  problem, not a reason to hide the number. It is stated here and in the
  README.
