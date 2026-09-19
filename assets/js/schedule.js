const { client: supabaseClient, loadFooter, t, localizeSlotLabels } = window.ReservationApp;

const DEADLINE = new Date("2026-10-17T23:00:00");
let scheduleLoaded = false;

loadFooter();

function closeSchedule() {
  document.querySelectorAll(".slot").forEach((cell) => {
    cell.classList.add("full");
    cell.style.pointerEvents = "none";
  });

  const message = document.createElement("p");
  message.className = "alert";
  message.dataset.closedNotice = "true";
  message.textContent = t("closed");
  document.querySelector(".container").prepend(message);
  localizeSlotLabels();
}

function goToEnrollPage(time, date) {
  if (!scheduleLoaded) return;

  const cell = document.querySelector('td[data-time="' + time + '"][data-date="' + date + '"]');
  if (!cell || cell.classList.contains("full")) {
    alert(t("fullMessage"));
    return;
  }

  const capacity = cell.dataset.capacity;
  window.location.href = "input.html?time=" + encodeURIComponent(time)
    + "&date=" + encodeURIComponent(date)
    + "&capacity=" + encodeURIComponent(capacity);
}

window.goToEnrollPage = goToEnrollPage;

function groupBySlot(enrollments) {
  return enrollments.reduce((counts, enrollment) => {
    const key = enrollment.time_slot + "_" + enrollment.date;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function renderAvailability(enrollments) {
  const counts = groupBySlot(enrollments);

  document.querySelectorAll("td[data-capacity]").forEach((cell) => {
    const key = cell.dataset.time + "_" + cell.dataset.date;
    const remaining = Number(cell.dataset.capacity) - (counts[key] || 0);
    cell.dataset.remaining = String(Math.max(remaining, 0));

    cell.classList.toggle("full", remaining <= 0);
    cell.classList.toggle("slot", remaining > 0);
    cell.style.pointerEvents = remaining > 0 ? "" : "none";
  });

  localizeSlotLabels();
}

async function loadSchedule() {
  const { data, error } = await supabaseClient
    .from("enrollments")
    .select("time_slot, date");

  if (error) {
    console.error(error.message);
    return;
  }

  renderAvailability(data);
  scheduleLoaded = true;
}

if (new Date() > DEADLINE) {
  closeSchedule();
} else {
  loadSchedule();
}

document.addEventListener("reservation-language-change", () => {
  const notice = document.querySelector("[data-closed-notice]");
  if (notice) notice.textContent = t("closed");
  localizeSlotLabels();
});
