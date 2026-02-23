let mode = "sim"; // sim / device
let deviceBaseUrl = localStorage.getItem("deviceBaseUrl") || "";

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