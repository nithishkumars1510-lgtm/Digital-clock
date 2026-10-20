
const clockDisplay = document.getElementById("clockDisplay");
const dayDisplay = document.getElementById("dayDisplay");
const dateDisplay = document.getElementById("dateDisplay");
const formatToggle = document.getElementById("formatToggle");
const themeToggle = document.getElementById("themeToggle");

let use24Hour = false;

function updateClock() {
    const now = new Date();

    clockDisplay.textContent = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: !use24Hour
    });

    dayDisplay.textContent = now.toLocaleDateString("en-GB", {
        weekday: "long"
    });

    dateDisplay.textContent = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

formatToggle.addEventListener("click", () => {
    use24Hour = !use24Hour;

    formatToggle.textContent = use24Hour
        ? "Switch to 12-hour"
        : "Switch to 24-hour";

    updateClock();
});

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");

    const lightOn = document.body.classList.contains("light-theme");

    themeToggle.textContent = lightOn
        ? "Dark theme"
        : "Light theme";
});

updateClock();
setInterval(updateClock, 1000);