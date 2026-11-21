# Product requirements — Ƙura Alert

**Event:** NASA Space Apps Challenge 2026, Gombe local event (14–15 Nov 2026)
**Product:** A bilingual harmattan dust forecast and flood early warning for
Gombe, Nigeria, with an optional Arduino ground node.
**Status:** Working prototype, built in one weekend.

## 1. Problem

Every November–March, harmattan dust crosses Gombe. It settles on laundry and
market goods, closes visibility, irritates eyes and throats, and is dangerous
for people with asthma. Most residents have no local, plain-language forecast:
national bulletins are in English, city-scale, and not on WhatsApp where people
actually communicate. In the rainy season the same drains and low roads create
short, intense flash floods with almost no local warning.

The result is a daily guess: *Is today a laundry day? Should the children walk
to school? Do I cover the stall? Is the drain likely to overflow?*

## 2. Users

| Persona | Context | What they need |
| --- | --- | --- |
| **Aisha, market trader** | Sells grain and fabrics in an open stall; Android phone; WhatsApp | A short Hausa message at 6 a.m.: is today dusty, and should she cover stock? |
| **Malam Musa, teacher** | Primary school; 40 children; no reliable internet in class | A clear school action: masks, windows, outdoor play, or keep children in |
| **Hauwa, parent/carer** | Child with asthma; low data; reads Hausa more easily than English | A severity word and one health precaution, not a chart |
| **Aminu, clinic/community health worker** | Sees respiratory complaints; needs to plan | A local, explainable risk signal and a record of ground dust |
| **Judge / reviewer** | 3 minutes; sceptical of "AI told me" | Traceable data, a formula, validation, and a working demo |

## 3. Jobs to be done

1. **"Tell me today's dust risk in a word."** One number, one level, one action.
2. **"Tell me in Hausa, in language I use at the market."** Short, spoken copy.
3. **"Let me send it to my family/group."** One-tap WhatsApp or SMS.
4. **"Tell me if rain will flood my street."** A second, independent hazard.
5. **"Show me why."** The data, the formula, the sample and the validation.
6. **"Work when the network is bad."** Cached/bundled forecast and a node that
   warns locally without internet.
7. **"Measure what is actually here."** A cheap Arduino node posting ground
   dust, rain and water level to the same dashboard.

## 4. Scope (v0.1)

### Must ship

- Three-day dust risk with Low / Moderate / High / Severe.
- Bilingual English/Hausa UI, advice and share messages.
- WhatsApp share and SMS hand-off, with copy-to-clipboard fallback.
- Advice for laundry, market/goods, school and health (non-medical).
- Flood early warning from 24 h / 72 h / prior-7-day rainfall.
- Evidence tab: live CAMS series, NASA MERRA-2 baseline, satellite imagery.
- Validation panel: AERONET Ilorin r/n/bias with caveat.
- Subscribe form (demo capture, no messages sent).
- Arduino node: dust, rain, water level, temperature/humidity + I2C LCD with
  backlight, local buzzer, API ingest.
- Offline fallback snapshots and a clear data-mode badge.
- Reproducible thresholds and a test suite.

### Should ship

- A scenario/demo mode to show High/Severe without waiting for weather —
  **shipped** as a labelled historical replay of real days.
- A sensor series chart (API exists; UI currently shows latest only).
- Swahili/French/other Nigerian languages.

### Out of scope

- Sending real WhatsApp/SMS messages (requires a paid provider and consent
  process).
- Official warning authority status or NiMet integration.
- Hydrological river modelling.
- User accounts, alerts history, or personalised health advice.
- A production-grade auth/rate-limit layer for sensor ingestion. The prototype
  has a shared key plus a local-only default, not a full auth service.

## 5. Functional requirements

| ID | Requirement | Acceptance |
| --- | --- | --- |
| F1 | Forecast endpoint | `GET /api/v1/forecast` returns three days, scores, levels, advice, messages, flood and alerts |
| F2 | Explainability | Each day returns the four input values, percentiles, weights, guardrails and sample size |
| F3 | Bilingual | Every user-facing string has `en` and `ha`; language toggle persists |
| F4 | Share | WhatsApp `wa.me` link and `sms:` link are generated from the current message; copy works |
| F5 | Flood | Each day has a flood score, level, 24 h/72 h/7 d rain and an action |
| F6 | Evidence | Live 14-day chart, NASA seasonal chart with lag, satellite layers, validation scatter |
| F7 | Resilience | API failure falls back to cache, then to bundled JSON; the badge states which |
| F8 | Subscribe | Phone validation, dedupe, stats; no outbound message |
| F9 | Sensor ingest | JSON POST; `X-Api-Key` when `KURA_INGEST_KEY` is set, otherwise local requests only; latest/series endpoints; `sim-` badge |
| F10 | Hardware | Documented BOM, pin map, firmware, simulator, local LCD/buzzer behaviour |
| F11 | Reproducibility | `make install`, `make api`, `make web`, `make test` work from a clean clone |
| F12 | Replay and hindcast | `/api/v1/replay` returns real past days labelled not-a-forecast; `/api/v1/hindcast` returns held-out-season and weight-sensitivity tables |

## 6. Non-functional requirements

- **Performance:** first page under 3 s on a laptop demo; charts client-side.
- **Accessibility:** text contrast, 44 px targets, semantic buttons, `aria`
  labels on the gauge and tabs, language attribute switched at runtime.
- **Low bandwidth:** no web fonts, no heavy map library, SVG UI, JSON API.
- **Safety:** no medical claims; disclaimers in both languages; data lag stated.
- **Maintainability:** one copy file per language surface, typed API contracts,
  small modules, tests for the rules.
- **Cost:** zero API keys, zero paid services for the demo.

## 7. Success metrics (hackathon)

| Metric | Target | Result |
| --- | --- | --- |
| End-to-end demo | Forecast → message → flood → evidence → node | Works |
| Data provenance | Every number traceable | Yes, formula and sources on-page |
| Validation | Independent ground truth | AERONET r = 0.865, n = 30 |
| Offline survival | Kill API, page still works | Bundled fallback |
| Hardware story | A judge can see what connects to what | Pin map + wiring + simulator |
| Copy coverage | Hausa for all primary actions | Yes, flagged for native review |

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Hausa copy is not native-quality | Trust and comprehension | Flagged in UI/docs; review sheet; single-file fixes |
| NASA aerosol data lags 77 days | "This is not today" | Show the date and lag; use CAMS for live; explain why |
| CAMS is a global model | Local error | Ground node; percentile framing; no false precision |
| No rain during demo | Flood feature looks dead | Explain dry-season state; scenario data available; show thresholds |
| Satellite imagery missing | Broken-looking tab | Explicit empty state + Worldview link |
| Hardware unavailable at demo | Half the story missing | Simulator posts realistic `sim-` readings; wiring diagram |
| Health advice overreach | Harm | "General guidance, not medical advice"; no diagnosis |
| Single weekend, small team | Bugs | Typed contracts, fallback snapshots, tests, narrow scope |

## 9. Future work

1. Native-speaker copy review and a Gombe pilot with 50 traders.
2. Real WhatsApp Business / SMS delivery with consent and opt-out.
3. Calibrate the PMS5003 against a reference monitor; add a second node.
4. Add a scenario mode for training and demos.
5. Add sensor-series charts and a node health/ops view.
6. Explore GEOS-CF for near-real-time NASA dust instead of CAMS.
7. Partner with NiMet/NEMA/SEMA for official cross-checks.
