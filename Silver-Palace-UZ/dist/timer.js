const announcedDateStart = Date.parse("2026-12-14T00:00:00+08:00");
const timerFields = [
  ["days", 86400, Infinity],
  ["hours", 3600, 24],
  ["minutes", 60, 60],
  ["seconds", 1, 60],
].map(([id, unit, cycle]) => ({ element: document.getElementById(id), unit, cycle }));

function updateTimer() {
  const remaining = Math.max(0, Math.ceil((announcedDateStart - Date.now()) / 1000));
  for (const { element, unit, cycle } of timerFields) {
    element.textContent = String(Math.floor(remaining / unit) % cycle).padStart(2, "0");
  }
  if (remaining > 0) {
    setTimeout(updateTimer, 1000 - Date.now() % 1000);
  } else {
    document.getElementById("clock-note").textContent =
      "E’lon qilingan sana boshlandi. O‘yinning ochilganini va yuklab olish havolalarini rasmiy saytdan tekshiring.";
  }
}
updateTimer();
