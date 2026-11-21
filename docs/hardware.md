# Hardware architecture (short version)

The field node is the **ground-truth leg** of Ƙura Alert. The dashboard says
what the models expect; the node says what is actually happening at a market
gate or school yard in Gombe.

```
                  ┌──────────────────────────────┐
 PMS5003 ──UART──►│                              │
 rain gauge ─INT─►│   Arduino UNO R4 WiFi        │──Wi-Fi──► POST /api/v1/ingest
 HC-SR04 ─GPIO───►│   local thresholds + LCD     │           (SQLite → dashboard)
 DHT22 ──1-wire──►│                              │
                  └──────────┬───────────────────┘
                             │ I2C
                    16×2 LCD with backlight
                             │
                     buzzer + backlight button
```

**Why this board.** The UNO R4 WiFi has 5 V logic (PMS5003 and HC-SR04 are
5 V parts), a built-in Wi-Fi radio (no ESP-01), a dedicated I2C header, and
enough RAM for the JSON POST. A classic UNO works but needs an ESP8266 and a
level shifter.

**Why these sensors.**

- **PMS5003** measures PM1/PM2.5/PM10 by laser scattering. It is the closest
  cheap proxy for the dust people actually breathe.
- **Tipping-bucket rain gauge** gives a digital pulse per 0.2794 mm. It is
  both a flood input and the physical explanation for a dust washout.
- **HC-SR04** points down at a drain or channel bed. It is a local water-level
  check, not a river gauge.
- **DHT22** provides temperature and humidity, which explain harmattan dryness
  and help flag sensor drift.
- **16×2 I2C LCD with backlight** makes the node useful with no phone and no
  internet: it rotates dust, rain/water and climate screens, and it wakes on a
  button press.

**Local behaviour.** The node beeps and keeps the backlight on when water is
≥ 25 cm or PM10 is ≥ 300 µg/m³. It posts every five minutes normally, and
every minute during an alert. Readings are buffered in the bucket counter
until the API accepts them, so a dropped POST does not lose rainfall.

**Data contract.** `POST /api/v1/ingest` with `device_id`, `pm25`, `pm10`,
`dust_ugm3`, `rain_mm`, `water_level_cm`, `temp_c`, `humidity`. A shared
`X-Api-Key` is controlled by `KURA_INGEST_KEY`; if the key is unset, only local
requests are accepted, so a LAN node needs a key. Device ids that start with
`sim-` are badged **Simulated** in the UI.

Full bill of materials, pin-by-pin wiring, flashing and calibration:
[`hardware/README.md`](../hardware/README.md). Diagram:
[`hardware/wiring.svg`](../hardware/wiring.svg).
