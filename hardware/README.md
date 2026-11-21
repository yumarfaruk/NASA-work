# Ƙura Alert — Arduino field node

The dashboard forecasts dust from satellites and models. This node is the
**ground truth**: a cheap Arduino station that measures what is actually in the
air and on the ground in Gombe, then posts it to the same API.

```
 PMS5003 ──┐                                  ┌── 16×2 LCD (I2C, backlight)
 rain gauge├──► Arduino UNO R4 WiFi ──Wi-Fi──► │   Ƙura Alert API  /api/v1/ingest
 HC-SR04 ──┤        (local alerts)            └── buzzer + backlight button
 DHT22 ────┘
```

Everything below is written so someone who has never wired a sensor can build
it. "What is what, and which pin is which" is the table in
[Pin map](#pin-map--what-is-what).

---

## 1. What the node measures

| Measurement | Sensor | Why it matters |
| --- | --- | --- |
| PM1.0 / PM2.5 / PM10 | **PMS5003** laser particle counter | Dust actually reaching people, not a model average |
| Rainfall | **tipping-bucket rain gauge** (reed switch) | Flood early warning; also suppresses dust |
| Water level | **HC-SR04** ultrasonic distance | Local flash-flood watch in a channel or drain |
| Temperature + humidity | **DHT22** | Harmattan dryness and sensor health |
| Local display | **16×2 I2C LCD with backlight** | Works with no phone, no internet, at the stall or in the classroom |

The node is deliberately independent of the cloud: it beeps and shows a
warning even when Wi-Fi is down.

---

## 2. Bill of materials

Prices are rough Nigerian market/online estimates (2026) and will vary.

| # | Part | Spec | Qty | Approx. price |
| --- | --- | --- | --- | --- |
| 1 | Arduino UNO R4 WiFi | 5 V, built-in Wi-Fi, I2C | 1 | ₦95,000 |
| 2 | PMS5003 dust sensor | 5 V, UART 9600, 3.3 V logic | 1 | ₦28,000 |
| 3 | Tipping-bucket rain gauge | 0.2794 mm per tip, reed switch | 1 | ₦18,000 |
| 4 | HC-SR04 ultrasonic | 5 V, trigger/echo | 1 | ₦2,500 |
| 5 | DHT22 | temperature + humidity | 1 | ₦4,000 |
| 6 | LCD 16×2 + I2C backpack | address `0x27` (some are `0x3F`) | 1 | ₦6,500 |
| 7 | Active buzzer | 5 V, ≤ 30 mA | 1 | ₦800 |
| 8 | Momentary button | backlight wake | 1 | ₦300 |
| 9 | Resistors | 10 kΩ (DHT pull-up), 1 kΩ + 2 kΩ (PMS RX divider) | 3 | ₦300 |
| 10 | 5 V power | USB power bank or 5 V/2 A adapter | 1 | ₦12,000 |
| 11 | Enclosure + cable gland | IP54 box, zip ties, mast | 1 | ₦8,000 |

> **Classic UNO instead?** It works electrically, but you need an ESP-01/ESP8266
> for Wi-Fi and a 3.3 V level shifter for the PMS5003. The R4 WiFi removes both
> headaches, so it is the reference build.

---

## 3. Pin map — what is what

### Arduino UNO R4 WiFi

| Component | Component pin | Arduino pin | Wire colour | Notes |
| --- | --- | --- | --- | --- |
| PMS5003 | VCC | **5V** | red | 100 mA peak; do not power from 3.3 V |
| PMS5003 | GND | **GND** | black | common ground |
| PMS5003 | TX | **D0 / Serial1 RX** | blue | sensor transmits → board receives |
| PMS5003 | RX | **D1 / Serial1 TX** | green | via 1 kΩ + 2 kΩ divider to 3.3 V logic |
| PMS5003 | SET / RESET | **3.3V** | orange | keep high for normal operation |
| Rain gauge | reed A | **D2** | yellow | `INPUT_PULLUP`, interrupt on FALLING |
| Rain gauge | reed B | **GND** | black | |
| HC-SR04 | VCC | **5V** | red | |
| HC-SR04 | TRIG | **D3** | blue | output pulse |
| HC-SR04 | ECHO | **D4** | green | 5 V echo is fine on R4 |
| HC-SR04 | GND | **GND** | black | |
| DHT22 | VCC | **3.3V** | red | 3.3 V is enough and safer |
| DHT22 | DATA | **D5** | yellow | 10 kΩ pull-up to 3.3 V |
| DHT22 | GND | **GND** | black | |
| LCD I2C | VCC | **5V** | red | backpack has contrast pot |
| LCD I2C | GND | **GND** | black | |
| LCD I2C | SDA | **SDA** | blue | dedicated I2C pin on R4 WiFi |
| LCD I2C | SCL | **SCL** | green | |
| Buzzer | + | **D6** | purple | use NPN transistor if > 20 mA |
| Buzzer | − | **GND** | black | |
| Button | leg 1 | **D7** | grey | `INPUT_PULLUP`, other leg to GND |
| Button | leg 2 | **GND** | black | wakes the LCD backlight |

**Pin summary, one line each:**

- `D0` = PMS5003 TX (Serial1 RX)
- `D1` = PMS5003 RX (Serial1 TX, through divider)
- `D2` = rain gauge pulse
- `D3` = HC-SR04 trigger
- `D4` = HC-SR04 echo
- `D5` = DHT22 data
- `D6` = buzzer
- `D7` = backlight button
- `SDA` / `SCL` = LCD
- `5V` / `GND` = power rails

A drawing of the same table is in [`wiring.svg`](wiring.svg).

```
                 ┌───────────────────────────────┐
  PMS5003 TX ────┤ D0  (Serial1 RX)              │
  PMS5003 RX ◄───┤ D1  (Serial1 TX)   UNO R4     │
  rain pulse ────┤ D2                 WiFi       ├──── USB / 5 V power
  HC-SR04 trig ──┤ D3                            │
  HC-SR04 echo ──┤ D4                            │
  DHT22 data ────┤ D5                            │
  buzzer + ──────┤ D6                            │
  button ────────┤ D7                            │
  LCD SDA ───────┤ SDA                           │
  LCD SCL ───────┤ SCL                           │
                 └───────────────────────────────┘
```

---

## 4. Assembly

1. **Mount the rain gauge** on a mast 1 m above ground, clear of walls. Level it
   with the bubble; a tilted bucket under-reads.
2. **Mount the PMS5003** inside the enclosure with its inlet exposed through a
   downward-facing louvre. Keep it away from the exhaust of the other sensors.
3. **Mount the HC-SR04** above the channel bed, pointing straight down at the
   water. Record the dry distance — this is `SENSOR_HEIGHT_CM`.
4. **Wire per the pin map** with the node powered off. Double-check the PMS RX
   divider before applying 5 V.
5. **Set the LCD address**: run an I2C scanner if the display stays blank, then
   change `LCD_I2C_ADDRESS` in `config.h` between `0x27` and `0x3F`.
6. **Seal and strain-relieve** every cable gland. Gombe dust + rain finds every
   gap; add a small silica bag inside the box.
7. **Power** from a 5 V/2 A adapter for a fixed site, or a 10,000 mAh power bank
   for a demo (≈ 12–16 h with the backlight timeout on).

---

## 5. Flash the firmware

1. Install the Arduino IDE and the **Arduino UNO R4 WiFi** board package.
2. Library Manager → install:
   - `ArduinoHttpClient`
   - `DHT sensor library` (Adafruit) and `Adafruit Unified Sensor`
   - `LiquidCrystal I2C` (Frank de Brabander)
3. Open `kura_node/kura_node.ino`.
4. Edit `kura_node/config.h`:
   - Wi-Fi name and password
   - `API_HOST` = the laptop/server running FastAPI on the same LAN
   - `DEVICE_ID` = e.g. `gombe-market-01`
   - `API_KEY` = same value as `KURA_INGEST_KEY` on the server
   - `SENSOR_HEIGHT_CM` and `RAIN_MM_PER_TIP`
5. Select the board and port, then **Upload**.
6. Open Serial Monitor at **115200 baud**. You should see `POST 200` every five
   minutes (or every minute during an alert).

The LCD boots with `Kura Alert node` / device id, then rotates three screens:

| Screen | Line 1 | Line 2 |
| --- | --- | --- |
| Dust | `Dust HIGH 212` | `PM2.5 48 ug/m3` |
| Water | `Rain 12.3 mm` | `Water 18 cm` |
| Climate | `T31.2C H22%` | `WiFi OK  kura` |

**Backlight:** on at boot and on any button press; auto-off after 60 s to save
power. It stays on and the buzzer chirps while `Water ≥ 25 cm` or
`PM10 ≥ 300 µg/m³`. All of these are configurable in `config.h`.

---

## 6. What the node sends

`POST /api/v1/ingest` with `Content-Type: application/json`:

```json
{
  "device_id": "gombe-market-01",
  "pm25": 48.0,
  "pm10": 212.0,
  "dust_ugm3": 212.0,
  "rain_mm": 12.3,
  "water_level_cm": 18.0,
  "temp_c": 31.2,
  "humidity": 22.0
}
```

Test it from a laptop before flashing:

```bash
# The API must have a key set, because this request is not from 127.0.0.1
# when the node is on the LAN. Start the API with:
#   KURA_INGEST_KEY=demo uvicorn app.main:app --host 0.0.0.0 --port 8000

curl -X POST http://localhost:8000/api/v1/ingest \
  -H 'Content-Type: application/json' \
  -H 'X-Api-Key: demo' \
  -d '{"device_id":"bench-test","pm25":20,"pm10":55,"rain_mm":0,"water_level_cm":4,"temp_c":30,"humidity":25}'
```

If `KURA_INGEST_KEY` is unset, `/api/v1/ingest` accepts **local requests
only** (`127.0.0.1` / `::1`). That keeps a laptop demo working without a key
while refusing anonymous writes from an exposed deployment. Set a strong key
before the node posts from another machine or before deploying.

Read it back:

```bash
curl http://localhost:8000/api/v1/sensors/latest
```

The dashboard's **Ground node** card shows the latest reading, marked
`Simulated` for ids beginning with `sim-` and `Live` otherwise.

> The server keeps readings in SQLite (`data/kura.db`). That file is git-ignored;
> only the code and the derived climatology are committed.

---

## 7. No hardware today? Use the simulator

```bash
python3 hardware/scripts/simulate_node.py --api http://localhost:8000 --count 5 --interval 60
```

It posts realistic readings under `sim-gombe-01`, clearly badged as simulated in
the UI. Useful for testing the full path before the soldering iron is hot.

---

## 8. Calibration

| Item | How |
| --- | --- |
| Rain gauge | Dump a known volume (e.g. 100 ml) through a 20 cm funnel; count tips; adjust `RAIN_MM_PER_TIP` until total ≈ measured mm. Typical reed value is 0.2794 mm. |
| Water level | With the channel dry, measure the distance from the sensor face to the bed = `SENSOR_HEIGHT_CM`. Verify with a ruler at 10 cm and 30 cm. |
| Dust | Compare a 10-minute PMS average with a reference monitor or the nearest purifier display; apply a scale factor in firmware if needed. |
| Backlight | Change `BACKLIGHT_TIMEOUT_MS`; button always wakes it. |

---

## 9. Field placement, power and upkeep

- Put the node **where people are**: market gate, school yard, clinic, motor park.
- Keep the dust inlet at breathing height (1.5–2 m) and away from cooking smoke.
- Solar option: 6 V/6 W panel → CN3065 charger → 3.7 V 18650 ×2 → 5 V boost.
  Budget ≈ 3 W average with the backlight timeout enabled.
- Weekly: wipe the PMS inlet, check the rain bucket for leaves, empty the silica.
- Monthly: re-level the bucket and check the cable glands.

---

## 10. Limits, said plainly

- A single PMS5003 is a **low-cost optical** sensor. Humidity above ~85 % can
  bias readings; the harmattan is dry, so this is acceptable here.
- The HC-SR04 has a ~3 m range and a wide cone; it is a **local** water-level
  check, not a river gauge.
- This node does **not** replace NiMet, NEMA or local flood warnings. It adds a
  second, local signal to the dashboard.
- The prototype does not authenticate readings beyond a shared key, and has no
  over-the-air updates. Both are on the roadmap.

---

## 11. Files in this folder

| File | What it is |
| --- | --- |
| `README.md` | This guide: BOM, wiring, flashing, calibration |
| `wiring.svg` | Pin-to-pin wiring diagram |
| `kura_node/kura_node.ino` | Firmware |
| `kura_node/config.h` | Wi-Fi, API, pins, thresholds — edit this |
| `scripts/simulate_node.py` | Posts fake `sim-` readings for testing |
| `../docs/hardware.md` | Short architecture note for the pitch |
