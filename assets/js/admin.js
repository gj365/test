const { client: supabaseClient, formatJapaneseDate, loadFooter, t } = window.ReservationApp;

let enrollments = [];

loadFooter();

if (prompt(t("adminPasswordPrompt")) !== "uec.nihongo2026") {
  alert(t("adminPasswordFailed"));
  window.location.href = "index.html";
}

function convertToDecimalTime(timeRange) {
  const [hour, minute] = timeRange.split(" - ")[0].split(":").map(Number);
  return hour + minute / 60;
}

function formatDateTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return yyyy + "-" + mm + "-" + dd + " " + hh + ":" + min + ":" + ss;
}

function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value || "";
  row.appendChild(cell);
}

function renderEnrollments() {
  const tbody = document.querySelector("#result-table tbody");
  tbody.replaceChildren();

  enrollments.forEach((enrollment, index) => {
    const row = document.createElement("tr");
    appendCell(row, index + 1);
    appendCell(row, formatJapaneseDate(enrollment.date));
    appendCell(row, enrollment.time_slot);
    appendCell(row, enrollment.name);
    appendCell(row, enrollment.kana);
    appendCell(row, enrollment.nationality);
    appendCell(row, enrollment.status);
    appendCell(row, formatDateTime(enrollment.created_at));
    tbody.appendChild(row);
  });
}

async function loadEnrollments() {
  const { data, error } = await supabaseClient.from("enrollments").select("*");

  if (error) {
    alert(t("loadFailed"));
    console.error(error);
    return;
  }

  enrollments = data.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return convertToDecimalTime(a.time_slot) - convertToDecimalTime(b.time_slot);
  });
  renderEnrollments();
}

function escapeCsv(value) {
  return '"' + String(value || "").replaceAll('"', '""') + '"';
}

function exportCSV() {
  const headers = Array.from(document.querySelectorAll("#result-table thead th"))
    .map((header) => escapeCsv(header.textContent));
  const rows = enrollments.map((enrollment, index) => [
    index + 1,
    formatJapaneseDate(enrollment.date),
    enrollment.time_slot,
    enrollment.name,
    enrollment.kana,
    enrollment.nationality,
    enrollment.status,
    formatDateTime(enrollment.created_at)
  ].map(escapeCsv));

  const csv = "\ufeff" + [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ReservationList.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

document.getElementById("export-btn").addEventListener("click", exportCSV);
document.addEventListener("reservation-language-change", renderEnrollments);
loadEnrollments();
