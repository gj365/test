const { client: supabaseClient, formatJapaneseDate, loadFooter, t } = window.ReservationApp;

let reservations = [];

loadFooter();

if (prompt(t("adminPasswordPrompt")) !== "uec.nihongo2026") {
  alert(t("adminPasswordFailed"));
  window.location.href = "index.html";
}

/** 将开始时间转成小数小时用于排序。 */
function convertToDecimalTime(timeRange) {
  const [hour, minute] = timeRange.split(" - ")[0].split(":").map(Number);
  return hour + minute / 60;
}

/** 按浏览器本地时区格式化登记时间。 */
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

/** 以纯文本创建单元格，避免用户输入被解释为 HTML。 */
function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value || "";
  row.appendChild(cell);
}

/** 根据已加载预约重建管理列表。 */
function renderReservations() {
  const tbody = document.querySelector("#result-table tbody");
  tbody.replaceChildren();

  reservations.forEach((enrollment) => {
    const row = document.createElement("tr");
    appendCell(row, formatJapaneseDate(enrollment.date));
    appendCell(row, enrollment.time_slot);
    appendCell(row, enrollment.name);
    appendCell(row, enrollment.kana);
    appendCell(row, enrollment.nationality);
    appendCell(row, enrollment.status);
    appendCell(row, enrollment.email);
    appendCell(row, formatDateTime(enrollment.created_at));
    tbody.appendChild(row);
  });
}

/** 读取预约，按日期及开始时间排序后展示。 */
async function loadReservations() {
  const { data, error } = await supabaseClient.from("exam_reservations")
    .select("*, slot:exam_slots(exam_date, starts_at, ends_at)");

  if (error) {
    alert(t("loadFailed"));
    console.error(error);
    return;
  }

  reservations = data.map(window.ReservationApp.flattenReservation).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return convertToDecimalTime(a.time_slot) - convertToDecimalTime(b.time_slot);
  });
  renderReservations();
}

/** 转义双引号并包裹 CSV 字段。 */
function escapeCsv(value) {
  return '"' + String(value || "").replaceAll('"', '""') + '"';
}

/** 将当前预约及翻译后的表头导出为 UTF-8 CSV。 */
function exportCSV() {
  const headers = Array.from(document.querySelectorAll("#result-table thead th"))
    .map((header) => escapeCsv(header.textContent));
  const rows = reservations.map((enrollment) => [
    formatJapaneseDate(enrollment.date),
    enrollment.time_slot,
    enrollment.name,
    enrollment.kana,
    enrollment.nationality,
    enrollment.status,
    enrollment.email,
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
document.addEventListener("reservation-language-change", renderReservations);
loadReservations();
