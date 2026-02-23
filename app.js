let mode = "sim"; // sim / device
let deviceBaseUrl = localStorage.getItem("deviceBaseUrl") || "";

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

function refreshData() {
  // Pentru început: SIMULARE mereu (merge și fără placă)
  const soil = randInt(0, 100);
  const temp = randFloat(16, 30, 1);
  const hum = randInt(25, 80);

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

// inițializare UI
window.addEventListener("load", setupInstallButton);