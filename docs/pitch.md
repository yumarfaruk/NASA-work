# 3-minute pitch

**Say it slowly. Point at the screen. Do not read the slides.**

## 0:00–0:30 — The problem

> "In Gombe, every harmattan morning starts with the same question: is today a
> laundry day, or will the dust ruin everything?
>
> National forecasts are in English, city-scale, and not where people actually
> talk — WhatsApp. And in the rainy season, the same drains flood with almost
> no local warning.
>
> We built Ƙura Alert: a three-day dust forecast first, with flood early
> warning as a second signal over the same window, in Hausa and English, in a
> message a trader can forward."

*Show the hero: 21/100, Low, the Hausa message.*

## 0:30–1:15 — What it does

> "One number. One level. One action. Laundry, market, school, health. Dust is
> the headline; flood is the second hazard because the same three days decide
> both.
>
> Tap WhatsApp and the message is ready in Hausa. Tap tomorrow and the advice
> changes. The flood panel uses the same three-day window: 24-hour rain,
> 72-hour rain, and how wet the ground already is. At 15 millimetres you get a
> watch; at 50 you get a severe floor. A single heavy day can never be reported
> as low."

*Toggle Hausa. Select tomorrow. Point at the flood thresholds.*

## 1:15–2:00 — Why it is credible

> "This is not a black box. The score is 50 % dust, 25 % aerosol optical depth,
> 15 % wind, 10 % dryness. Each input is ranked against the same weeks in four
> real harmattan seasons — 605 days. A clean-air cap stops a dry windy day
> being called dusty.
>
> The live field is CAMS. NASA MERRA-2 anchors the climatology and the seasonal
> baseline — and we show its 77-day lag instead of hiding it. AERONET Ilorin
> gives us an independent check on MERRA-2: r equals 0.865 over 30 days. The
> scatter plot and the caveat are on the page.
>
> On the 605 real days, the five dustiest all score High or Severe and the five
> cleanest all score Low. When we hide a season from the thresholds, clean days
> stay clean 65 out of 65 times; dusty days reach High or Severe 24 of 65 times.
> That is modest, and we say so. Changing every weight by ten percent moves no
> levels at all."

*Open the NASA tab, then the evidence chart. If asked for a severe state, open
the historical replay.*

## 2:00–2:35 — The ground node

> "Models are not measurements. So we built a node: an Arduino UNO R4 WiFi with
> a PMS5003 dust sensor, a tipping-bucket rain gauge, an ultrasonic water level
> and a 16×2 LCD with a backlight. It shows the numbers at the stall, beeps on
> a local threshold, and posts to the same API. It keeps working when the
> internet does not.
>
> The full bill of materials, pin map and wiring diagram are in the repo. No
> hardware today? The simulator posts realistic readings and the dashboard
> badges them as simulated."

*Show the ground-node card and `hardware/README.md` pin table.*

## 2:35–3:00 — Close

> "Ƙura Alert is open data, open code, and a message a trader can actually use.
> The next step is a native-speaker review and a 50-person pilot in Gombe
> market.
>
> Know what the dust will do, before you step out."

*Pause. Leave the Hausa message on screen.*

---

## If a judge interrupts

| Question | Answer |
| --- | --- |
| "Why not just use NASA data live?" | NASA aerosol products lag ~77 days and need Earthdata. CAMS is the operational live field; NASA anchors the climatology and validation. We label the lag. |
| "Is this AI?" | No. It is a weighted percentile index with guardrails. That is a feature: every number is auditable. |
| "How accurate is it?" | The AERONET check is r = 0.865, n = 30, bias +0.163 AOD — that validates MERRA-2, not the forecast. On observed days, clean-decile recall is 65/65; dusty-decile recall is 24/65 at High/Severe. The ground node is how we close that gap. |
| "That recall is low." | Yes. Moderate is the honest watch band in the late harmattan, and the advice copy treats it that way. We would rather miss a Moderate than cry Severe on a clear day. |
| "Why show old days?" | Because a November demo has no dust storm. The replay uses real February 2024 and August 2024 days, scored with today's model, and labels them **Not a forecast**. |
| "Does it send real messages?" | Not in the prototype. The WhatsApp/SMS button opens the user's own app with the text. Delivery needs a provider and consent. |
| "Hausa quality?" | Written by a non-native speaker, flagged in the UI and docs, with a review sheet for a native speaker. We would not launch without that review. |
| "Flood accuracy?" | It is a rainfall-threshold early warning, not a hydrological model. Hard floors are conservative; the score and rain totals are shown. |
| "What is new?" | The combination: local dust + flood in one window, bilingual share-ready messages, NASA evidence, and a cheap ground node — all offline-tolerant, with the validation limits stated. |
