# 🌱 PlantGuard PWA

PlantGuard este o aplicație web progresivă (PWA) pentru monitorizarea umidității solului și a condițiilor ambientale folosind un **ESP32 + DHT22 + senzor de umiditate sol**.

Aplicația este optimizată pentru mobil, poate fi instalată pe ecranul principal și funcționează atât în mod simulare, cât și conectată la dispozitiv real.

---

## 🚀 Funcționalități

- 📊 Afișare umiditate sol (%)
- 🌡️ Temperatură ambientală (°C)
- 💧 Umiditate aer (%)
- 📱 Instalare ca aplicație (PWA)
- 📶 Ghid pas-cu-pas pentru configurare ESP32
- 🔄 Mod Simulare pentru testare fără hardware
- 💾 Salvare locală setări (localStorage)

---

## 🏗️ Arhitectură

### 🔹 Variantă Locală (LAN)

- ESP32 rulează un server HTTP
- Endpoint principal:
  http://<device-ip>/data

- PWA face `fetch()` către dispozitiv

⚠️ Funcționează doar dacă telefonul/laptopul este conectat la aceeași rețea Wi-Fi.

---

### 🔹 Setup Wi-Fi ESP32

1. ESP32 pornește hotspot:  PlantGuard-Setup
2. Utilizatorul accesează: http://192.168.4.1

3. Introduce SSID + parolă
4. ESP32 salvează credențialele și se conectează la rețeaua locală

---

## 📁 Structura proiectului
plantguard-pwa/
│
├── index.html # Interfața principală
├── app.js # Logică aplicație
├── sw.js # Service Worker (PWA)
├── manifest.webmanifest
├── icon-192.png
├── icon-512.png
└── README.md



---

## 🧠 Moduri de funcționare

### 🔸 Mod Simulare
Generează valori random pentru testare UI.

### 🔸 Mod Device
Citește date reale de la:
http://<device-ip>/data



IP-ul este introdus manual în aplicație.

---

## 📦 Instalare PWA

### Android
1. Deschide aplicația în Chrome
2. Apasă "Add to Home Screen"

### iPhone
1. Deschide în Safari
2. Share → Add to Home Screen

---

## 🔌 ESP32 – Endpoint JSON

Dispozitivul răspunde cu:

```json
{
  "soil": 58,
  "raw": 2430,
  "temp": 23.5,
  "hum": 46
}
