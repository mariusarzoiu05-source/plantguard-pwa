let mode = "sim"; // sim / device
let deviceBaseUrl = localStorage.getItem("deviceBaseUrl") || "";
const SETUP_BASE = "http://192.168.4.1"; // portal ESP32 AP
let plantName = localStorage.getItem("plantName") || "Planta mea";

function applyPlantName() {
  const el = document.getElementById("plantName");
  if (el) el.textContent = plantName;
}

function editPlantName() {
  const input = prompt("Cum se numește planta?", plantName);
  if (!input) return;

  plantName = input.trim();
  if (!plantName) return;

  localStorage.setItem("plantName", plantName);
  applyPlantName();
}

function toggleMode() {
  mode = (mode === "sim") ? "device" : "sim";
  document.getElementById("modeBtn").textContent =
    "Mod: " + (mode === "sim" ? "Simulare" : "Device");

  if (mode === "device") {
    const input = prompt(
      "Introdu adresa dispozitivului (ex: http://192.168.1.45)\n\nLeave blank ca să rămâi pe Simulare.",
      deviceBaseUrl || "http://192.168.1.45"
    );

    if (!input) {
      mode = "sim";
      document.getElementById("modeBtn").textContent = "Mod: Simulare";
      return;
    }

    deviceBaseUrl = input.trim().replace(/\/+$/, "");
    localStorage.setItem("deviceBaseUrl", deviceBaseUrl);
  }
  // când se încarcă pagina, afișează numele salvat
}

async function refreshData() {
  const isDevice = (mode === "device" && deviceBaseUrl);

  if (isDevice) {
    const url = deviceBaseUrl.replace(/\/+$/, "") + "/data";
    console.log("Fetching:", url);

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const text = await res.text();
      console.log("Raw response:", text);

      const data = JSON.parse(text);
      const soil = Number(data.soil);
      const temp = Number(data.temp);
      const hum  = Number(data.hum);

      if (!Number.isFinite(soil) || !Number.isFinite(temp) || !Number.isFinite(hum)) {
        throw new Error("Bad numbers: " + JSON.stringify(data));
      }

      renderData(soil, temp, hum);
      return;
    } catch (e) {
      console.warn("DEVICE FAILED:", e);
      // arată pe UI că e fallback, ca să știi sigur
      document.getElementById("humMeta").textContent =
        "Device error: " + (e?.message || e);
    }
  }

  // SIMULARE
  const soil = randInt(0, 100);
  const temp = randFloat(16, 30, 1);
  const hum = randInt(25, 80);
  renderData(soil, temp, hum);
}

function renderData(soil, temp, hum) {
  // PLANT
  document.getElementById("soilValue").textContent = soil + "%";
  document.getElementById("soilStatus").textContent =
    soil < 30 ? "Uscat 💧" :
    soil < 60 ? "Mediu 🌱" :
    "OK 🌿";

  // AMBIENT
  document.getElementById("tempValue").textContent = temp.toFixed(1) + "°C";
  document.getElementById("tempStatus").textContent =
    temp < 18 ? "Rece 🧊" :
    temp < 26 ? "Confort ✅" :
    "Cald 🔥";

  document.getElementById("humMeta").textContent = "Umiditate aer: " + hum + "%";
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 1) {
  const v = Math.random() * (max - min) + min;
  const p = Math.pow(10, decimals);
  return Math.round(v * p) / p;
}
window.addEventListener("load", applyPlantName);

let deferredPrompt = null;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    (navigator.standalone === true);
}

function setupInstallButton() {
  const btn = document.getElementById("installBtn");
  const hint = document.getElementById("installHint");
  if (!btn) return;

  // Dacă deja e instalată ca app, ascundem tot
  if (isStandalone()) {
    btn.style.display = "none";
    if (hint) hint.style.display = "none";
    return;
  }

  // iOS: nu există prompt -> doar arătăm instrucțiuni
  if (isIOS()) {
    btn.style.display = "block";
    btn.textContent = "Adaugă pe ecran";
    if (hint) hint.style.display = "block";
    btn.onclick = () => {
      alert("Pe iPhone: deschide în Safari → Share (⤴︎) → Add to Home Screen.");
    };
    return;
  }

  // Android: butonul apare doar când avem deferredPrompt
  btn.onclick = async () => {
    if (!deferredPrompt) {
      alert("Instalarea nu e disponibilă încă. Deschide site-ul în Chrome și mai încearcă.");
      return;
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;

    // după ce user decide, ascundem butonul ca să nu fie spam
    btn.style.display = "none";
    if (hint) hint.style.display = "none";

    console.log("Install choice:", choice);
  };
}

// Android/Chrome: capturează promptul
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const btn = document.getElementById("installBtn");
  if (btn && !isStandalone()) {
    btn.style.display = "block";
  }
});

// după instalare
window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  const btn = document.getElementById("installBtn");
  const hint = document.getElementById("installHint");
  if (btn) btn.style.display = "none";
  if (hint) hint.style.display = "none";
});

function showSetupStatus(msg) {
  const el = document.getElementById("wifiSetupStatus");
  if (!el) return;
  el.style.display = "block";
  el.textContent = msg;
}

async function openWifiSetup() {
  showSetupStatus("Caut dispozitivul (http://192.168.4.1) ...");

  // 1) încearcă scan
  let networks = [];
  try {
    const res = await fetch(SETUP_BASE + "/scan", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    networks = await res.json();
  } catch (e) {
    // aici intră des dacă PWA e pe HTTPS și browser blochează mixed content
    showSetupStatus(
      "Nu pot accesa portalul ESP32 din aplicație (posibil blocaj HTTPS→HTTP).\n" +
      "Conectează-te la Wi-Fi-ul ESP32 (PlantGuard-Setup) și deschide direct: http://192.168.4.1"
    );
    return;
  }

  if (!Array.isArray(networks) || networks.length === 0) {
    showSetupStatus("Nu am găsit rețele. Încearcă din nou.");
    return;
  }

  // 2) user alege SSID
  const ssidList = networks.map(n => n.ssid).filter(Boolean);
  const ssid = prompt(
    "Alege SSID (copie exact din listă):\n\n" + ssidList.slice(0, 20).join("\n"),
    ssidList[0] || ""
  );
  if (!ssid) { showSetupStatus("Anulat."); return; }

  const pass = prompt("Parola Wi-Fi pentru: " + ssid + "\n(Lasă gol dacă e rețea deschisă)", "");
  if (pass === null) { showSetupStatus("Anulat."); return; }

  // 3) trimite save
  showSetupStatus("Trimit datele către ESP32...");

  try {
    const res2 = await fetch(SETUP_BASE + "/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ssid, pass })
    });
    const j = await res2.json().catch(() => ({}));
    if (!res2.ok || !j.ok) throw new Error(j.err || ("HTTP " + res2.status));

    showSetupStatus(
      "Salvat ✅. Dispozitivul se restartează și încearcă să se conecteze.\n" +
      "1) Revino pe Wi-Fi-ul tău normal.\n" +
      "2) Apoi treci pe Mod: Device și introdu IP-ul (îl vezi în Serial Monitor)."
    );
  } catch (e) {
    showSetupStatus("Eroare la /save: " + (e?.message || e));
  }
}

let guideStep = Number(localStorage.getItem("guideStep") || "1");

const guideSteps = [
  {
    title: "Pasul 1: Conectează-te la placa ESP32",
    text:
`• Deschide Wi-Fi pe telefon/laptop
• Conectează-te la: PlantGuard-Setup
• Parola (dacă ai păstrat-o): 12345678`
  },
  {
    title: "Pasul 2: Deschide portalul de configurare",
    text:
`• Deschide în browser:
  http://192.168.4.1
• Introdu rețeaua ta (SSID) + parola și apasă Save
• Așteaptă 20–30 secunde (placa se restartează)`
  },
  {
    title: "Pasul 3: Revino pe Wi-Fi normal",
    text:
`• Reconectează telefonul/laptopul la Wi-Fi-ul tău normal
• Deschide iar PlantGuard (PWA) de pe Vercel
• Treci pe Mod: Device`
  },
  {
    title: "Pasul 4: Introdu IP-ul plăcii",
    text:
`• IP-ul îl vezi în Serial Monitor după conectare
  (ex: 192.168.1.45)
• În PlantGuard: Mod → Device → introdu IP-ul
• Apoi apasă Refresh`
  }
];

function setGuideMsg(msg) {
  const el = document.getElementById("guideMsg");
  if (!el) return;
  el.style.display = msg ? "block" : "none";
  el.textContent = msg || "";
}

function renderGuide() {
  const box = document.getElementById("guideBox");
  if (!box || box.style.display === "none") return;

  const step = Math.max(1, Math.min(guideSteps.length, guideStep));
  const data = guideSteps[step - 1];

  const progress = document.getElementById("guideProgress");
  const title = document.getElementById("guideTitle");
  const text = document.getElementById("guideText");

  if (progress) progress.textContent = `${step}/${guideSteps.length}`;
  if (title) title.textContent = data.title;
  if (text) text.textContent = data.text;

  localStorage.setItem("guideStep", String(step));
}

function toggleGuide() {
  const box = document.getElementById("guideBox");
  if (!box) return;
  const isOpen = box.style.display !== "none";
  box.style.display = isOpen ? "none" : "block";
  setGuideMsg("");
  renderGuide();
}

function nextStep() {
  guideStep = Math.min(guideSteps.length, guideStep + 1);
  setGuideMsg("");
  renderGuide();
}

function prevStep() {
  guideStep = Math.max(1, guideStep - 1);
  setGuideMsg("");
  renderGuide();
}

async function copyPortalLink() {
  const link = "http://192.168.4.1";
  try {
    await navigator.clipboard.writeText(link);
    setGuideMsg("Copiat ✅\nAcum lipește în browser (când ești conectat la PlantGuard-Setup).");
  } catch {
    setGuideMsg("Nu pot copia automat.\nLink: http://192.168.4.1");
  }
}

function openPortal() {
  // Pe HTTPS e posibil să fie blocat / să nu meargă dacă nu ești pe Wi-Fi-ul ESP
  setGuideMsg("Dacă nu se deschide, e normal.\nConectează-te la PlantGuard-Setup și deschide manual: http://192.168.4.1");
  try { window.open("http://192.168.4.1", "_blank"); } catch {}
}

function quickDeviceSetup() {
  const input = prompt("IP-ul plăcii (ex: http://192.168.1.45)", deviceBaseUrl || "http://192.168.1.45");
  if (!input) return;
  deviceBaseUrl = input.trim().replace(/\/+$/, "");
  localStorage.setItem("deviceBaseUrl", deviceBaseUrl);

  mode = "device";
  const btn = document.getElementById("modeBtn");
  if (btn) btn.textContent = "Mod: Device";

  setGuideMsg("Salvat ✅\nAcum apasă Refresh ca să citești /data.");
}

// ===== AUTO-REFRESH (la 10 secunde) =====
let autoRefreshTimer = null;
let isRefreshing = false;

async function safeRefresh() {
  if (isRefreshing) return;          // evită suprapuneri dacă durează fetch-ul
  if (document.hidden) return;       // nu refresh când app e în background
  isRefreshing = true;
  try {
    await refreshData();
  } finally {
    isRefreshing = false;
  }
}

function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  safeRefresh(); // ia date imediat când pornește
  autoRefreshTimer = setInterval(safeRefresh, 10000);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = null;
}

// pornește după ce se încarcă pagina
window.addEventListener("load", () => {
  startAutoRefresh();
});

// oprește/porneste când schimbi tab-ul (economisește baterie + evită bug-uri)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopAutoRefresh();
  else startAutoRefresh();
});

window.addEventListener("load", () => {
  setupInstallButton();
  applyPlantName();
});