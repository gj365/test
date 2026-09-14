const { client: supabaseClient, formatJapaneseDate, loadFooter, t } = window.ReservationApp;

const parameters = new URLSearchParams(window.location.search);
const timeSlot = parameters.get("time");
const date = parameters.get("date");
const capacity = Number(parameters.get("capacity"));

loadFooter();

/** Displays the selected date and time using the currently active language. */
function renderSelectedSlot() {
  document.getElementById("time-slot").textContent = timeSlot || "";
  document.getElementById("date").textContent = date ? formatJapaneseDate(date) : "";
}

/** Checks whether the selected slot still has at least one available seat. */
async function hasAvailability() {
  const { count, error } = await supabaseClient
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("time_slot", timeSlot)
    .eq("date", date);

  if (error) {
    console.error("Enrollment check failed:", error.message);
    return false;
  }

  if (count >= capacity) {
    document.getElementById("alert-message").textContent = t("fullMessage");
    window.setTimeout(() => { window.location.href = "index.html"; }, 3000);
    return false;
  }

  return true;
}

// Return without changing the reservation data when the visitor chooses another slot.
document.getElementById("back").addEventListener("click", () => {
  window.location.href = "index.html";
});

// Validate, confirm, and submit the reservation after the primary button is pressed.
document.getElementById("confirm").addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const kana = document.getElementById("kana").value.trim();
  const nationality = document.getElementById("nationality").value.trim();
  const status = document.getElementById("status").value;

  if (!name || !kana || !nationality || !status) {
    alert(t("required"));
    return;
  }

  if (!timeSlot || !date || !Number.isFinite(capacity)) {
    window.location.href = "index.html";
    return;
  }

  const available = await hasAvailability();
  if (!available) return;

  const confirmed = confirm(t("reservationPrompt", {
    date: formatJapaneseDate(date),
    time: timeSlot,
    name,
    kana,
    nationality,
    status: document.getElementById("status").selectedOptions[0].textContent
  }));
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("enrollments")
    .insert([{ time_slot: timeSlot, date, name, kana, nationality, status }]);

  if (error) {
    console.error(error);
    alert(t("reservationFailed"));
    return;
  }

  alert(t("reservationSucceeded"));
  window.location.href = "index.html";
});

// Keep the date format synchronized when the visitor changes language.
document.addEventListener("reservation-language-change", renderSelectedSlot);
renderSelectedSlot();
