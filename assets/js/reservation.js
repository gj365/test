const { client: supabaseClient, formatJapaneseDate, loadFooter, t } = window.ReservationApp;

const parameters = new URLSearchParams(window.location.search);
const timeSlot = parameters.get("time");
const date = parameters.get("date");

loadFooter();

function renderSelectedSlot() {
  document.getElementById("time-slot").textContent = timeSlot || "";
  document.getElementById("date").textContent = date ? formatJapaneseDate(date) : "";
}

async function hasAvailability() {
  let config;
  try {
    config = await window.ScheduleConfig.load();
  } catch (error) {
    console.error(error);
    document.getElementById("alert-message").textContent = t("settingsLoadFailed");
    return false;
  }
  if (Date.now() >= Date.parse(config.deadline)) {
    document.getElementById("alert-message").textContent = t("closed");
    return false;
  }
  const capacity = window.ScheduleConfig.capacity(config, date, timeSlot);
  const canonicalDate = window.ScheduleConfig.dateKey(date);
  const matchingDates = [canonicalDate];
  if (canonicalDate.startsWith("2026-")) {
    const [, month, day] = canonicalDate.split("-").map(Number);
    matchingDates.push(month + "/" + day);
  }
  const { count, error } = await supabaseClient
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("time_slot", timeSlot)
    .in("date", matchingDates);

  if (error) {
    console.error("Enrollment check failed:", error.message);
    document.getElementById("alert-message").textContent = t("loadFailed");
    return false;
  }

  if (count >= capacity) {
    document.getElementById("alert-message").textContent = t("fullMessage");
    window.setTimeout(() => { window.location.href = "index.html"; }, 3000);
    return false;
  }

  return true;
}

document.getElementById("back").addEventListener("click", () => {
  window.location.href = "index.html";
});

document.getElementById("confirm").addEventListener("click", async () => {
  const submitButton = document.getElementById("confirm");
  if (submitButton.disabled) return;
  const name = document.getElementById("name").value.trim();
  const kana = document.getElementById("kana").value.trim();
  const nationality = document.getElementById("nationality").value.trim();
  const status = document.getElementById("status").value;

  if (!name || !kana || !nationality || !status) {
    alert(t("required"));
    return;
  }

  if (!timeSlot || !date || !/^(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})$/.test(date)) {
    window.location.href = "index.html";
    return;
  }

  submitButton.disabled = true;
  try {
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
    .insert([{ time_slot: timeSlot, date: window.ScheduleConfig.dateKey(date), name, kana, nationality, status }]);

    if (error) {
    console.error(error);
    alert(t("reservationFailed"));
    return;
    }

    alert(t("reservationSucceeded"));
    window.location.href = "index.html";
  } catch (error) {
    console.error(error);
    alert(t("reservationFailed"));
  } finally {
    submitButton.disabled = false;
  }
});

document.addEventListener("reservation-language-change", renderSelectedSlot);
renderSelectedSlot();
