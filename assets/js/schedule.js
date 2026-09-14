const { client: supabaseClient, loadFooter, t, localizeSlotLabels } = window.ReservationApp;

const DEADLINE = new Date("2026-09-23T23:59:59");
let scheduleLoaded = false;

loadFooter();

/** Disables every bookable slot and shows the deadline-closed notice. */
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

/** Opens the reservation form for an available date and time. */
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

/** Counts existing reservations by their combined date-and-time key. */
function groupBySlot(enrollments) {
  return enrollments.reduce((counts, enrollment) => {
    const key = enrollment.time_slot + "_" + enrollment.date;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

/** Calculates remaining seats and updates the timetable's visual state. */
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

/** Retrieves reservations from Supabase, then refreshes the timetable. */
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

// Choose the appropriate timetable state as soon as the page opens.
if (new Date() > DEADLINE) {
  closeSchedule();
} else {
  loadSchedule();
}

// Refresh labels that depend on the selected language without reloading schedule data.
document.addEventListener("reservation-language-change", () => {
  const notice = document.querySelector("[data-closed-notice]");
  if (notice) notice.textContent = t("closed");
  localizeSlotLabels();
});
