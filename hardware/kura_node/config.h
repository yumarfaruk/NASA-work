// ─────────────────────────────────────────────────────────────────────────────
//  Ƙura Alert — field node configuration
//  Edit this file, flash, and the node starts posting to your API.
//  Reference build: Arduino UNO R4 WiFi (5 V logic, built-in Wi-Fi)
// ─────────────────────────────────────────────────────────────────────────────
#pragma once

// ── Wi-Fi ────────────────────────────────────────────────────────────────────
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// ── API ──────────────────────────────────────────────────────────────────────
// Laptop running the FastAPI service (same LAN as the node).
#define API_HOST "192.168.1.50"
#define API_PORT 8000
#define API_PATH "/api/v1/ingest"
#define API_KEY "demo"          // must match KURA_INGEST_KEY if you set one
#define DEVICE_ID "gombe-01"

// ── Pins (Arduino UNO R4 WiFi) ───────────────────────────────────────────────
#define PIN_PMS_RX 0            // Serial1 RX  ← PMS5003 TX
#define PIN_PMS_TX 1            // Serial1 TX  → PMS5003 RX (via divider)
#define PIN_RAIN 2              // tipping-bucket reed switch (INT)
#define PIN_TRIG 3              // HC-SR04 trigger
#define PIN_ECHO 4              // HC-SR04 echo
#define PIN_DHT 5               // DHT22 data (10 kΩ pull-up to 3.3 V)
#define PIN_BUZZER 6            // active buzzer (+ via NPN if > 20 mA)
#define PIN_BACKLIGHT 7         // momentary button to GND (INPUT_PULLUP)
#define PIN_LCD_SDA SDA         // I2C LCD backpack
#define PIN_LCD_SCL SCL

// ── Hardware calibration ─────────────────────────────────────────────────────
#define RAIN_MM_PER_TIP 0.2794f // 8" bucket: 0.2794 mm per tip (0.011 in)
#define SENSOR_HEIGHT_CM 60.0f  // HC-SR04 height above the dry channel bed
#define WATER_ALERT_CM 25.0f    // local buzzer + LCD warning
#define DUST_ALERT_UGM3 300.0f  // local PM10 warning

// ── Timing ───────────────────────────────────────────────────────────────────
#define POST_INTERVAL_MS 300000UL   // 5 min normal cadence
#define ALERT_POST_MS 60000UL       // 1 min while an alert is active
#define BACKLIGHT_TIMEOUT_MS 60000UL
#define SCREEN_ROTATE_MS 4000UL

// ── LCD ──────────────────────────────────────────────────────────────────────
#define LCD_I2C_ADDRESS 0x27
#define LCD_COLS 16
#define LCD_ROWS 2
