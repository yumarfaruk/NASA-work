// ─────────────────────────────────────────────────────────────────────────────
//  Ƙura Alert — Arduino field node
//
//  Reads PMS5003 dust, a tipping-bucket rain gauge, an HC-SR04 water-level
//  sensor and a DHT22, shows the numbers on a 16×2 I2C LCD with backlight,
//  beeps on a local threshold, and POSTs JSON to the Ƙura Alert API.
//
//  Board: Arduino UNO R4 WiFi (Arduino IDE → Boards → Arduino UNO R4 WiFi)
//  Libraries (Library Manager):
//    • ArduinoHttpClient
//    • DHT sensor library (Adafruit) + Adafruit Unified Sensor
//    • LiquidCrystal I2C (Frank de Brabander)
//
//  Wiring and BOM: ../README.md  ·  Diagram: ../wiring.svg
// ─────────────────────────────────────────────────────────────────────────────
#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

#include "config.h"

LiquidCrystal_I2C lcd(LCD_I2C_ADDRESS, LCD_COLS, LCD_ROWS);
DHT dht(PIN_DHT, DHT22);
WiFiClient wifi;
HttpClient http(wifi, API_HOST, API_PORT);

// ── Live readings ────────────────────────────────────────────────────────────
float pm1 = 0, pm25 = 0, pm10 = 0;
float temperature = NAN, humidity = NAN;
float waterLevelCm = 0;
volatile unsigned long rainTips = 0;
unsigned long lastPost = 0;
unsigned long lastScreen = 0;
unsigned long backlightUntil = 0;
unsigned long lastBeep = 0;
unsigned long lastWifiAttempt = 0;
uint8_t screen = 0;
bool alertActive = false;

// ── PMS5003 frame parser ─────────────────────────────────────────────────────
uint8_t frame[32];
uint8_t frameIndex = 0;

void readPms() {
  while (Serial1.available() > 0) {
    uint8_t byte = (uint8_t)Serial1.read();
    if (frameIndex == 0 && byte != 0x42) continue;
    if (frameIndex == 1 && byte != 0x4D) {
      frameIndex = 0;
      continue;
    }
    frame[frameIndex++] = byte;
    if (frameIndex < 32) continue;

    uint16_t checksum = 0;
    for (uint8_t i = 0; i < 30; i++) checksum += frame[i];
    uint16_t claimed = ((uint16_t)frame[30] << 8) | frame[31];
    if (checksum == claimed) {
      pm1 = ((uint16_t)frame[10] << 8) | frame[11];
      pm25 = ((uint16_t)frame[12] << 8) | frame[13];
      pm10 = ((uint16_t)frame[14] << 8) | frame[15];
    }
    frameIndex = 0;
  }
}

// ── Rain gauge ───────────────────────────────────────────────────────────────
void rainTick() {
  rainTips++;
}

// ── HC-SR04 water level ──────────────────────────────────────────────────────
float readWaterLevelCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(3);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long duration = pulseIn(PIN_ECHO, HIGH, 30000UL);
  if (duration == 0) return waterLevelCm;
  float distance = duration * 0.0343f / 2.0f;
  float level = SENSOR_HEIGHT_CM - distance;
  return level < 0 ? 0 : level;
}

// ── LCD helpers ──────────────────────────────────────────────────────────────
void wakeBacklight() {
  backlightUntil = millis() + BACKLIGHT_TIMEOUT_MS;
  lcd.backlight();
}

const char *dustBand(float value) {
  if (value < 50) return "LOW";
  if (value < 150) return "MODERATE";
  if (value < 300) return "HIGH";
  return "SEVERE";
}

void drawScreen() {
  lcd.clear();
  char line[17];

  if (screen == 0) {
    snprintf(line, sizeof(line), "Dust %-4s %3.0f", dustBand(pm10), pm10);
    lcd.setCursor(0, 0);
    lcd.print(line);
    snprintf(line, sizeof(line), "PM2.5 %3.0f ug/m3", pm25);
    lcd.setCursor(0, 1);
    lcd.print(line);
  } else if (screen == 1) {
    snprintf(line, sizeof(line), "Rain %5.1f mm", rainTips * RAIN_MM_PER_TIP);
    lcd.setCursor(0, 0);
    lcd.print(line);
    snprintf(line, sizeof(line), "Water %3.0f cm", waterLevelCm);
    lcd.setCursor(0, 1);
    lcd.print(line);
  } else {
    snprintf(line, sizeof(line), "T%4.1fC H%3.0f%%", temperature, humidity);
    lcd.setCursor(0, 0);
    lcd.print(line);
    lcd.setCursor(0, 1);
    lcd.print(WiFi.status() == WL_CONNECTED ? "WiFi OK  " : "WiFi --  ");
    lcd.print(alertActive ? "ALERT" : "kura");
  }
}

// ── Wi-Fi ────────────────────────────────────────────────────────────────────
void ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (millis() - lastWifiAttempt < 15000UL) return;
  lastWifiAttempt = millis();
  lcd.setCursor(0, 1);
  lcd.print("WiFi...         ");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

// ── API POST ─────────────────────────────────────────────────────────────────
void postReading() {
  if (WiFi.status() != WL_CONNECTED) return;

  char body[320];
  snprintf(
      body, sizeof(body),
      "{\"device_id\":\"%s\",\"pm25\":%.1f,\"pm10\":%.1f,\"dust_ugm3\":%.1f,"
      "\"rain_mm\":%.2f,\"water_level_cm\":%.1f,\"temp_c\":%.1f,\"humidity\":%.1f}",
      DEVICE_ID, pm25, pm10, pm10, rainTips * RAIN_MM_PER_TIP, waterLevelCm,
      temperature, humidity);

  http.beginRequest();
  http.post(API_PATH);
  http.sendHeader("Content-Type", "application/json");
  if (strlen(API_KEY) > 0) http.sendHeader("X-Api-Key", API_KEY);
  http.sendHeader("Content-Length", strlen(body));
  http.beginBody();
  http.print(body);
  http.endRequest();

  int status = http.responseStatusCode();
  Serial.print("POST ");
  Serial.println(status);
  http.stop();

  if (status >= 200 && status < 300) {
    // Reset the bucket counter only after the server accepted the reading.
    noInterrupts();
    rainTips = 0;
    interrupts();
  }
}

// ── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial1.begin(9600);          // PMS5003
  pinMode(PIN_RAIN, INPUT_PULLUP);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_BACKLIGHT, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(PIN_RAIN), rainTick, FALLING);

  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Kura Alert node");
  lcd.setCursor(0, 1);
  lcd.print(DEVICE_ID);

  dht.begin();
  delay(1500);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWifiAttempt = millis();
  wakeBacklight();
}

// ── Loop ─────────────────────────────────────────────────────────────────────
void loop() {
  readPms();

  if (millis() - lastScreen > SCREEN_ROTATE_MS) {
    lastScreen = millis();
    screen = (screen + 1) % 3;
    drawScreen();
  }

  // Refill the rolling averages slowly so a single bad frame does not spike us.
  static unsigned long lastSample = 0;
  if (millis() - lastSample > 5000UL) {
    lastSample = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) temperature = t;
    if (!isnan(h)) humidity = h;
    waterLevelCm = readWaterLevelCm();
  }

  if (digitalRead(PIN_BACKLIGHT) == LOW) wakeBacklight();
  if (millis() > backlightUntil) lcd.noBacklight();

  ensureWifi();

  alertActive = waterLevelCm >= WATER_ALERT_CM || pm10 >= DUST_ALERT_UGM3;
  if (alertActive) {
    wakeBacklight();
    if (millis() - lastBeep > 10000UL) {
      lastBeep = millis();
      tone(PIN_BUZZER, 2200, 180);
    }
  }

  unsigned long cadence = alertActive ? ALERT_POST_MS : POST_INTERVAL_MS;
  if (millis() - lastPost > cadence) {
    lastPost = millis();
    postReading();
    drawScreen();
  }
}
