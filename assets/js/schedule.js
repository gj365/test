const { loadFooter, t, localizeSlotLabels, formatJapaneseDate } = window.ReservationApp;
let deadline = null;
let scheduleLoaded = false;
let currentSlots = [];
loadFooter();

/** 截止后锁定全部场次，并显示停止受理提示。 */
function closeSchedule() {
  document.querySelectorAll("td[data-capacity]").forEach((cell) => {
    cell.classList.add("full");
    cell.style.pointerEvents = "none";
    cell.tabIndex = -1;
    cell.setAttribute("aria-disabled", "true");
  });
  document.getElementById("schedule-status").textContent = t("closed");
  localizeSlotLabels();
}

/** 打开选中的可预约场次；提交时重新从数据库读取名额。 */
function goToEnrollPage(time, date) {
  if (!scheduleLoaded) return;
  if (new Date() > deadline) { closeSchedule(); return; }
  const cell = [...document.querySelectorAll("td[data-capacity]")]
    .find((element) => element.dataset.time === time && element.dataset.date === date);
  if (!cell || cell.classList.contains("full")) return;
  const slot = currentSlots.find((item) => item.date === date && item.time_slot === time);
  window.location.href = "input.html?" + new URLSearchParams({ slot: slot.id, time, date });
}

/** 按数据库配置绘制首页矩阵；零名额显示横线，保留午休间隔。 */
function renderAvailability() {
  const table = document.getElementById("schedule");
  const grid = window.ScheduleStore.grid(currentSlots);
  const slots = new Map(currentSlots.map((slot) => [slot.date + "|" + slot.time_slot, slot]));
  table.querySelector("thead").replaceChildren();
  table.querySelector("tbody").replaceChildren();
  const header = document.createElement("tr");
  [t("scheduleHeaders")[0], ...grid.dates.map(formatJapaneseDate)].forEach((text) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = text;
    header.appendChild(th);
  });
  table.querySelector("thead").appendChild(header);
  grid.times.forEach((time, index) => {
    if (index && grid.times[index - 1].endsWith(" - 12:00") && time.startsWith("13:00 - ")) {
      const row = document.createElement("tr");
      const label = document.createElement("td");
      label.textContent = "12:00 - 13:00";
      const rest = document.createElement("td");
      rest.colSpan = grid.dates.length;
      rest.className = "break";
      rest.textContent = t("break");
      row.append(label, rest);
      table.querySelector("tbody").appendChild(row);
    }
    const row = document.createElement("tr");
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = time;
    row.appendChild(label);
    grid.dates.forEach((isoDate) => {
      const cell = document.createElement("td");
      const date = window.ScheduleStore.enrollmentDate(isoDate);
      const capacity = grid.capacities.get(isoDate + "|" + time) || 0;
      cell.className = "slot1";
      cell.textContent = "-";
      if (capacity > 0) {
        const remaining = Math.max(capacity - (slots.get(isoDate + "|" + time).booked || 0), 0);
        Object.assign(cell.dataset, { time, date, capacity: String(capacity), remaining: String(remaining) });
        cell.className = remaining ? "slot" : "full";
        cell.tabIndex = remaining ? 0 : -1;
        cell.setAttribute("role", "button");
        cell.setAttribute("aria-disabled", String(!remaining));
        cell.addEventListener("click", () => goToEnrollPage(time, date));
        cell.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); goToEnrollPage(time, date); }
        });
      }
      row.appendChild(cell);
    });
    table.querySelector("tbody").appendChild(row);
  });
  localizeSlotLabels();
  if (new Date() > deadline) closeSchedule();
}

/** 加载配置及预约人数；失败时明确提示，避免把默认容量展示为真实余位。 */
async function loadSchedule() {
  document.getElementById("schedule-status").textContent = t("loadingSchedule");
  try {
    const settings = await window.ScheduleStore.load();
    deadline = new Date(settings.deadline);
    currentSlots = settings.slots;
    scheduleLoaded = true;
    document.getElementById("schedule-status").textContent = "";
    renderAvailability();
  } catch (error) {
    console.error(error);
    document.getElementById("schedule-status").textContent = t(error.message) || t("loadFailed");
  }
}

// 翻译动态日期标题，避免静态文案覆盖管理后保存的日期。
document.addEventListener("reservation-language-change", () => { if (scheduleLoaded) renderAvailability(); });
loadSchedule();
