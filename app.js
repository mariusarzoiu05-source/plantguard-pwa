function refreshData() {
  // SIMULARE temporară
  const value = Math.floor(Math.random() * 100);

  document.getElementById("moisture").textContent = value + "%";

  let status = "OK 🌿";

  if (value < 30) {
    status = "Uscat 💧";
  } else if (value < 60) {
    status = "Mediu 🌱";
  }

  document.getElementById("status").textContent = status;
}