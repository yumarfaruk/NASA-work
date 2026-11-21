# Demo script (5 minutes)

## Before the judges arrive

```bash
# Terminal 1 — API
cd kura-alert && make api

# Terminal 2 — dashboard
cd kura-alert && make web

# Terminal 3 — a ground reading (optional)
python3 hardware/scripts/simulate_node.py --count 1
```

Check:

- http://127.0.0.1:8000/health returns `ok: true`.
- http://127.0.0.1:3000 loads and the header says **Live data**.
- The ground-node card says **Simulated** (or **Live** for real hardware).
- Browser zoom is 100 %, one tab only, notifications off.
- If the venue Wi-Fi is dead, the page still loads from the bundled snapshot
  and the badge says **Offline snapshot**. Say that out loud; it is a feature.

## 0:00 — Open on the hero

"This is Gombe today. One number, one level, one action — in English or Hausa."

- Point at **21/100 — Low**.
- Read the headline: *Dust is low today in Gombe.*

## 0:30 — Switch to Hausa

- Click **HA** in the header.
- Read the headline and one advice card aloud.
- Say: "The Hausa copy is pending native-speaker review; it is flagged in the
  repo."

## 1:00 — Show the share message

- Point at the WhatsApp card.
- Toggle **Hausa / English** and **WhatsApp / SMS**.
- Click **Copy message**, then paste into a notes app (or just show the char
  count). Do **not** send a message during the demo.
- Say: "This is the whole product for a trader: a message they can forward."

## 1:30 — Move to tomorrow

- Click **Tomorrow** in the day strip.
- Point at the change in score and advice.
- Say: "Three days, so you can plan laundry, stock or a school run."

## 2:00 — Flood early warning

- Scroll to **Dust and flood, in one window**.
- Point at the rainfall bars and the 15/30/50 mm legend.
- Say: "Dust is the headline. Flood is the second hazard over the same three
  days. Today is dry, so flood is Low. But the rule has hard floors: 15 mm is a
  watch, 30 is high, 50 is severe. One heavy day cannot hide as low."
- Point at the ground-node card: dust, rain, water level, temperature,
  humidity, device id and last-reading time.

## 2:40 — Evidence

- Click the **NASA** tab.
- Point at the lag badge: **2026-08-30 · 77 days**.
- Say: "We do not pretend MERRA-2 is today. It gives the seasonal baseline;
  CAMS gives the live field."
- Point at the validation tiles: **r 0.87, n 30, bias 0.16** and the caveat.
- Say: "That validates MERRA-2, not the forecast. We label it that way."
- Click **Satellite**, show the true-colour/AOD layers, then back to **Live**.

## 3:10 — A real severe day

- Scroll to **Historical replay**.
- Show **5 Feb 2024 — 95.9/100, Severe**, then **19 Aug 2024 — 38.7 mm, High**.
- Point at the amber **Not a forecast** badge.
- Say: "November is calm, so we do not fake a storm. These are real past days,
  scored with today's model, kept separate from the forecast. This is what the
  app says when it matters."

## 3:40 — "Show me why"

- Scroll to **A formula you can audit**.
- Read the formula line and the four weights.
- Point at the level cuts and the flood thresholds.
- Say: "No hidden model. A judge can recompute this. On 605 real days, the five
  dustiest all score High or Severe, the five cleanest all score Low. Hide a
  season and clean days stay clean 65 out of 65. Dusty-day recall is 24 of 65 —
  modest, and in the repo. A ten percent weight change moves no levels."

## 4:10 — Hardware

- Open `hardware/README.md` on screen (or the wiring SVG).
- Point at the pin table: `D0` PMS TX, `D2` rain, `D3/D4` ultrasonic,
  `D5` DHT22, `D6` buzzer, `D7` backlight button, `SDA/SCL` LCD.
- Say: "An Arduino UNO R4 WiFi, a dust sensor, a rain gauge, a water-level
  sensor and a backlit LCD. It posts to the same API and warns locally without
  internet."

## 4:35 — Close

- Back to the top, Hausa message visible.
- "Open data, open code, a message a trader can use. Next: native-speaker
  review and a 50-person market pilot."

## If something breaks

| Problem | Recovery |
| --- | --- |
| API is down | Reload. The page uses the bundled snapshot; point at the **Offline snapshot** badge. |
| Wi-Fi is down | Same. The forecast snapshot and all UI still work; satellite may not load. |
| Satellite image is blank | Click another layer or say "GIBS is delayed; here is the Worldview link" and move on. |
| No sensor reading | Run `make simulate`; the card appears with a **Simulated** badge. |
| Chart is empty | It is the dry season; that is the correct state. Point at the "No rain recorded" note and the watch line. |
| A judge asks for High/Severe | Scroll to **Historical replay**. It is a real past day, clearly labelled **Not a forecast**. Do not fake the live day. |
| A judge asks "how accurate?" | Say the honest split: clean 65/65, dusty 24/65 at High/Severe, and r = 0.865 validates MERRA-2, not the forecast. Full tables in `docs/hindcast.md`. |
| A judge asks about the weights | Point at the sensitivity table in `docs/hindcast.md`: ±10 % moves 0/605 levels; equal weights move 18.5 %. |

## Do not

- Do not send a WhatsApp/SMS message from the demo phone.
- Do not claim official warning status.
- Do not call the replay "today"; it is a historical day and the badge says so.
- Do not quote r = 0.865 as forecast accuracy; it validates MERRA-2.
- Do not give medical advice; read the disclaimer.
- Do not say the Hausa is perfect.
