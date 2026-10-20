const mainZoneSelect = document.getElementById("mainZone");
const customZoneSelect = document.getElementById("customZone");
const customClocks = document.getElementById("customClocks");

const accentColor = document.getElementById("accentColor");
const formatBtn = document.getElementById("formatBtn");
const analogBtn = document.getElementById("analogBtn");
const themeBtn = document.getElementById("themeBtn");
const notifyBtn = document.getElementById("notifyBtn");

const greetingEl = document.getElementById("greeting");
const dateText = document.getElementById("dateText");

const clockHours = document.getElementById("clockHours");
const clockMinutes = document.getElementById("clockMinutes");
const clockSeconds = document.getElementById("clockSeconds");
const clockAmPm = document.getElementById("clockAmPm");

const digitalClock = document.getElementById("digitalClock");
const analogClock = document.getElementById("analogClock");
const hourHand = document.getElementById("hourHand");
const minuteHand = document.getElementById("minuteHand");
const secondHand = document.getElementById("secondHand");

const alarmTime = document.getElementById("alarmTime");
const alarmStatus = document.getElementById("alarmStatus");

const stopwatchDisplay = document.getElementById("stopwatchDisplay");
const countdownDisplay = document.getElementById("countdownDisplay");
const pomodoroDisplay = document.getElementById("pomodoroDisplay");
const pomodoroStatus = document.getElementById("pomodoroStatus");

const weatherText = document.getElementById("weatherText");

const zones = {
  "Asia/Kolkata": "India — IST",
  "Asia/Singapore": "Singapore — SGT",
  "Europe/London": "United Kingdom — GMT/BST",
  "America/New_York": "USA — EST/EDT",
  "America/Chicago": "USA — CST/CDT",
  "America/Denver": "USA — MST/MDT",
  "America/Los_Angeles": "USA — PST/PDT",
  "Asia/Dubai": "UAE — GST",
  "Australia/Sydney": "Australia — AEST/AEDT",
  "Europe/Paris": "France — CET/CEST",
  "Asia/Tokyo": "Japan — JST"
};

let use24Hour = false;
let showAnalog = false;
let themeIndex = 0;
const themes = ["dark", "light", "amoled"];
const themeNames = ["Dark", "Light", "AMOLED"];

let customZoneList =
  JSON.parse(localStorage.getItem("customZones")) || ["Asia/Kolkata"];

let alarmValue = localStorage.getItem("alarmValue") || "";
let stopwatchRunning = false;
let stopwatchTime = 0;
let stopwatchInterval = null;

let countdownTime = 0;
let countdownInterval = null;

let pomodoroTime = 25 * 60;
let pomodoroInterval = null;
let pomodoroFocus = true;

function fillZoneDropdowns() {
  const options = Object.entries(zones)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");

  mainZoneSelect.innerHTML = options;
  customZoneSelect.innerHTML = options;
}

function getZoneTime(zone) {
  const now = new Date();

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);

  const [hh, mm, ss] = time.split(":").map(Number);

  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(now);

  return { hh, mm, ss, date };
}

function formatHour(hour) {
  if (use24Hour) return String(hour).padStart(2, "0");
  return String(hour % 12 === 0 ? 12 : hour % 12).padStart(2, "0");
}

function getAmPm(hour) {
  return use24Hour ? "" : hour >= 12 ? "PM" : "AM";
}

function greeting(hour) {
  if (hour >= 5 && hour < 12) return "Good Morning ☀️";
  if (hour >= 12 && hour < 17) return "Good Afternoon 🌤️";
  if (hour >= 17 && hour < 21) return "Good Evening 🌆";
  return "Good Night 🌙";
}

function updateMainClock() {
  const zone = mainZoneSelect.value;
  const { hh, mm, ss, date } = getZoneTime(zone);

  greetingEl.textContent = greeting(hh);
  dateText.textContent = date;

  clockHours.textContent = formatHour(hh);
  clockMinutes.textContent = String(mm).padStart(2, "0");
  clockSeconds.textContent = String(ss).padStart(2, "0");
  clockAmPm.textContent = getAmPm(hh);

  if (showAnalog) {
    hourHand.style.transform = `rotate(${(hh % 12) * 30 + mm * 0.5}deg)`;
    minuteHand.style.transform = `rotate(${mm * 6 + ss * 0.1}deg)`;
    secondHand.style.transform = `rotate(${ss * 6}deg)`;
  }

  checkAlarm(hh, mm);
  renderCustomClocks();
}

function renderCustomClocks() {
  customClocks.innerHTML = "";

  customZoneList.forEach(zone => {
    const { hh, mm, ss, date } = getZoneTime(zone);

    const card = document.createElement("div");
    card.className = "clock-card";

    card.innerHTML = `
      <h3>${zones[zone]}</h3>
      <p class="time">
        ${formatHour(hh)}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}
        ${getAmPm(hh)}
      </p>
      <p class="date">${date}</p>
      <button class="remove-btn">Remove</button>
    `;

    card.querySelector(".remove-btn").onclick = () => {
      customZoneList = customZoneList.filter(item => item !== zone);
      localStorage.setItem("customZones", JSON.stringify(customZoneList));
      renderCustomClocks();
    };

    customClocks.appendChild(card);
  });
}

function applyAccent(color) {
  document.documentElement.style.setProperty("--accent", color);

  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  document.documentElement.style.setProperty(
    "--accent-soft",
    `rgba(${r}, ${g}, ${b}, 0.20)`
  );

  localStorage.setItem("accent", color);
}

async function requestNotification() {
  if (!("Notification" in window)) {
    alert("Your browser does not support notifications.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    new Notification("Notifications enabled ✅", {
      body: "Alarm reminders will appear here."
    });
  }
}

function sendNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function checkAlarm(hh, mm) {
  if (!alarmValue) return;

  const [alarmH, alarmM] = alarmValue.split(":").map(Number);

  if (hh === alarmH && mm === alarmM && Number(clockSeconds.textContent) === 0) {
    sendNotification("⏰ Alarm!", `Your ${alarmValue} alarm is ringing.`);
    alarmStatus.textContent = "⏰ Alarm ringing!";
  }
}

function startStopwatch() {
  if (stopwatchRunning) return;

  stopwatchRunning = true;

  stopwatchInterval = setInterval(() => {
    stopwatchTime++;

    const h = String(Math.floor(stopwatchTime / 3600)).padStart(2, "0");
    const m = String(Math.floor((stopwatchTime % 3600) / 60)).padStart(2, "0");
    const s = String(stopwatchTime % 60).padStart(2, "0");

    stopwatchDisplay.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

function stopStopwatch() {
  stopwatchRunning = false;
  clearInterval(stopwatchInterval);
}

function resetStopwatch() {
  stopStopwatch();
  stopwatchTime = 0;
  stopwatchDisplay.textContent = "00:00:00";
}

function startCountdown() {
  clearInterval(countdownInterval);

  const minutes = Number(document.getElementById("countdownMinutes").value);
  countdownTime = minutes * 60;

  countdownInterval = setInterval(() => {
    if (countdownTime <= 0) {
      clearInterval(countdownInterval);
      countdownDisplay.textContent = "00:00";
      sendNotification("⏳ Countdown Finished", "Your countdown timer has ended.");
      return;
    }

    countdownTime--;

    const m = String(Math.floor(countdownTime / 60)).padStart(2, "0");
    const s = String(countdownTime % 60).padStart(2, "0");

    countdownDisplay.textContent = `${m}:${s}`;
  }, 1000);
}

function resetCountdown() {
  clearInterval(countdownInterval);
  countdownTime = 0;
  countdownDisplay.textContent = "05:00";
}

function startPomodoro() {
  clearInterval(pomodoroInterval);

  pomodoroInterval = setInterval(() => {
    if (pomodoroTime <= 0) {
      clearInterval(pomodoroInterval);

      if (pomodoroFocus) {
        pomodoroFocus = false;
        pomodoroTime = 5 * 60;
        pomodoroStatus.textContent = "Break time ☕";
        sendNotification("🍅 Focus Complete", "Take a 5-minute break.");
      } else {
        pomodoroFocus = true;
        pomodoroTime = 25 * 60;
        pomodoroStatus.textContent = "Focus session";
        sendNotification("☕ Break Complete", "Start your next focus session.");
      }
    }

    pomodoroTime--;

    const m = String(Math.floor(pomodoroTime / 60)).padStart(2, "0");
    const s = String(pomodoroTime % 60).padStart(2, "0");

    pomodoroDisplay.textContent = `${m}:${s}`;
  }, 1000);
}

function resetPomodoro() {
  clearInterval(pomodoroInterval);
  pomodoroFocus = true;
  pomodoroTime = 25 * 60;
  pomodoroDisplay.textContent = "25:00";
  pomodoroStatus.textContent = "Focus session";
}

async function loadWeather() {
  if (!navigator.geolocation) {
    weatherText.textContent = "Geolocation is not supported.";
    return;
  }

  weatherText.textContent = "Loading weather...";

  navigator.geolocation.getCurrentPosition(async position => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      weatherText.textContent = `
        🌡️ ${data.current.temperature_2m}°C •
        💧 ${data.current.relative_humidity_2m}% •
        🌬️ ${data.current.wind_speed_10m} km/h
      `;
    } catch {
      weatherText.textContent = "Weather data unavailable.";
    }
  });
}

mainZoneSelect.addEventListener("change", updateMainClock);

accentColor.addEventListener("input", event => applyAccent(event.target.value));

formatBtn.addEventListener("click", () => {
  use24Hour = !use24Hour;
  formatBtn.textContent = use24Hour ? "24H" : "12H";
  updateMainClock();
});

analogBtn.addEventListener("click", () => {
  showAnalog = !showAnalog;

  digitalClock.classList.toggle("hidden", showAnalog);
  analogClock.classList.toggle("hidden", !showAnalog);
  analogBtn.textContent = showAnalog ? "Digital" : "Analog";
});

themeBtn.addEventListener("click", () => {
  themeIndex = (themeIndex + 1) % themes.length;
  document.body.dataset.theme = themes[themeIndex];
  themeBtn.textContent = themeNames[themeIndex];
  localStorage.setItem("theme", themes[themeIndex]);
});

notifyBtn.addEventListener("click", requestNotification);

document.getElementById("addClockBtn").addEventListener("click", () => {
  const zone = customZoneSelect.value;

  if (!customZoneList.includes(zone)) {
    customZoneList.push(zone);
    localStorage.setItem("customZones", JSON.stringify(customZoneList));
    renderCustomClocks();
  }
});

document.getElementById("setAlarmBtn").addEventListener("click", () => {
  alarmValue = alarmTime.value;

  if (!alarmValue) {
    alarmStatus.textContent = "Please select a time.";
    return;
  }

  localStorage.setItem("alarmValue", alarmValue);
  alarmStatus.textContent = `Alarm set for ${alarmValue}`;
  requestNotification();
});

document.getElementById("clearAlarmBtn").addEventListener("click", () => {
  alarmValue = "";
  localStorage.removeItem("alarmValue");
  alarmStatus.textContent = "No alarm set";
});

document.getElementById("startStopwatch").addEventListener("click", startStopwatch);
document.getElementById("stopStopwatch").addEventListener("click", stopStopwatch);
document.getElementById("resetStopwatch").addEventListener("click", resetStopwatch);

document.getElementById("startCountdown").addEventListener("click", startCountdown);
document.getElementById("resetCountdown").addEventListener("click", resetCountdown);

document.getElementById("startPomodoro").addEventListener("click", startPomodoro);
document.getElementById("resetPomodoro").addEventListener("click", resetPomodoro);

document.getElementById("weatherBtn").addEventListener("click", loadWeather);

document.getElementById("fontSelect").addEventListener("change", event => {
  document.documentElement.style.setProperty("--clock-font", event.target.value);
  localStorage.setItem("clockFont", event.target.value);
});

document.getElementById("sizeRange").addEventListener("input", event => {
  document.documentElement.style.setProperty(
    "--clock-size",
    event.target.value + "px"
  );
  localStorage.setItem("clockSize", event.target.value);
});

document.getElementById("glowRange").addEventListener("input", event => {
  document.documentElement.style.setProperty("--glow", event.target.value + "px");
  localStorage.setItem("glow", event.target.value);
});

document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (key === "t") formatBtn.click();
  if (key === "a") analogBtn.click();
  if (key === "d") themeBtn.click();

  if (key === "f") {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }
});

fillZoneDropdowns();

const savedAccent = localStorage.getItem("accent");
if (savedAccent) {
  accentColor.value = savedAccent;
  applyAccent(savedAccent);
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  document.body.dataset.theme = savedTheme;
  themeIndex = themes.indexOf(savedTheme);
  themeBtn.textContent = themeNames[themeIndex];
}

const savedFont = localStorage.getItem("clockFont");
if (savedFont) {
  document.getElementById("fontSelect").value = savedFont;
  document.documentElement.style.setProperty("--clock-font", savedFont);
}

const savedSize = localStorage.getItem("clockSize");
if (savedSize) {
  document.getElementById("sizeRange").value = savedSize;
  document.documentElement.style.setProperty("--clock-size", savedSize + "px");
}

const savedGlow = localStorage.getItem("glow");
if (savedGlow) {
  document.getElementById("glowRange").value = savedGlow;
  document.documentElement.style.setProperty("--glow", savedGlow + "px");
}

if (alarmValue) {
  alarmTime.value = alarmValue;
  alarmStatus.textContent = `Alarm set for ${alarmValue}`;
}

updateMainClock();
setInterval(updateMainClock, 1000);