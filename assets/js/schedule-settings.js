const settingsBody = document.querySelector("#schedule-settings tbody");

function timeLabel(minutes) {
  return Math.floor(minutes / 60) + ":" + String(minutes % 60).padStart(2, "0");
}

for (let minutes = 9 * 60; minutes < 17 * 60;) {
  const isBreak = minutes === 12 * 60;
  const end = minutes + (isBreak ? 60 : 30);
  const time = timeLabel(minutes) + " - " + timeLabel(end);
  const row = document.createElement("tr");
  const timeCell = document.createElement("td");
  timeCell.textContent = time;
  row.appendChild(timeCell);

  if (isBreak) {
    const cell = document.createElement("td");
    cell.className = "break";
    cell.colSpan = 4;
    row.appendChild(cell);
  } else {
    for (let column = 0; column < 4; column++) {
      const cell = document.createElement("td");
      const select = document.createElement("select");
      select.dataset.column = column;
      select.dataset.time = time;
      ["1", "2", "3", "-"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        option.selected = value === "-";
        select.appendChild(option);
      });
      cell.appendChild(select);
      row.appendChild(cell);
    }
  }
  settingsBody.appendChild(row);
  minutes = end;
}

function updateSettingsLabels() {
  const { t } = window.ReservationApp;
  const dates = document.querySelectorAll('#schedule-settings input[type="date"]');
  dates.forEach((input, index) => {
    input.setAttribute("aria-label", t("settingsDate") + " " + (index + 1));
  });
  settingsBody.querySelector(".break").textContent = t("break");
  settingsBody.querySelectorAll("select").forEach((select) => {
    const column = Number(select.dataset.column);
    const date = dates[column].value || t("settingsDate") + " " + (column + 1);
    select.setAttribute("aria-label", date + " " + select.dataset.time + " " + t("settingsSeats"));
  });
}

document.querySelector("#schedule-settings thead").addEventListener("change", updateSettingsLabels);
document.addEventListener("reservation-language-change", updateSettingsLabels);
updateSettingsLabels();
window.ReservationApp.loadFooter();

const saveButton = document.getElementById("save-settings");
const message = document.getElementById("settings-message");
const deadlineInput = document.getElementById("deadline");
let messageKey = "";
function showSettingsMessage(key) {
  messageKey = key;
  message.textContent = window.ReservationApp.t(key);
}
function populateSettings(config) {
  document.querySelectorAll('#schedule-settings input[type="date"]').forEach((input, index) => {
    input.value = config.dates[index];
  });
  deadlineInput.value = new Date(Date.parse(config.deadline) + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
  settingsBody.querySelectorAll("select").forEach((select) => {
    const value = window.ScheduleConfig.capacity(config, config.dates[Number(select.dataset.column)], select.dataset.time);
    select.value = value ? String(value) : "-";
  });
  updateSettingsLabels();
}
async function loadSettings() {
  populateSettings(window.ScheduleConfig.defaults());
  try {
    populateSettings(await window.ScheduleConfig.load());
    saveButton.disabled = false;
  } catch (error) {
    console.error(error);
    showSettingsMessage("settingsLoadFailed");
  }
}
saveButton.addEventListener("click", async () => {
  const config = {
    dates: Array.from(document.querySelectorAll('#schedule-settings input[type="date"]'), input => input.value),
    deadline: deadlineInput.value + ":00+09:00",
    capacities: window.ScheduleConfig.times.map(time =>
      Array.from(settingsBody.querySelectorAll("select"))
        .filter(select => select.dataset.time === time)
        .map(select => select.value === "-" ? 0 : Number(select.value)))
  };
  if (!window.ScheduleConfig.validate(config)) {
    showSettingsMessage("settingsInvalid");
    return;
  }
  const password = prompt(window.ReservationApp.t("adminPasswordPrompt"));
  if (password === null) return;
  saveButton.disabled = true;
  showSettingsMessage("settingsSaving");
  try {
    await window.ScheduleConfig.save(config, password);
    showSettingsMessage("settingsSaved");
  } catch (error) {
    console.error(error);
    showSettingsMessage("settingsSaveFailed");
  } finally {
    saveButton.disabled = false;
  }
});
document.addEventListener("reservation-language-change", () => {
  if (messageKey) showSettingsMessage(messageKey);
});
loadSettings();
