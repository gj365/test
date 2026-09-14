const { client: supabaseClient, formatDate, loadFooter, t } = window.ReservationApp;
let reservations = [];
let isStaff = false;

loadFooter();

/** 将时段起始时间转换为可排序的数字。 */
function convertToDecimalTime(timeRange) {
  const [hour, minute] = timeRange.split(" - ")[0].split(":").map(Number);
  return hour + minute / 60;
}

/** 格式化数据库的建立时间，供管理页面和 CSV 使用。 */
function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.getFullYear() + "-"
    + String(date.getMonth() + 1).padStart(2, "0") + "-"
    + String(date.getDate()).padStart(2, "0") + " "
    + String(date.getHours()).padStart(2, "0") + ":"
    + String(date.getMinutes()).padStart(2, "0");
}

/** 安全地向表格行写入纯文本单元格。 */
function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value || "";
  row.appendChild(cell);
}

/** 根据当前语言显示已取得的管理用预约列表。 */
function renderReservations() {
  const tbody = document.querySelector("#result-table tbody");
  tbody.replaceChildren();

  reservations.forEach((enrollment) => {
    const row = document.createElement("tr");
    appendCell(row, formatDate(enrollment.slot_date));
    appendCell(row, enrollment.time_slot);
    appendCell(row, enrollment.name);
    appendCell(row, enrollment.kana);
    appendCell(row, enrollment.nationality);
    appendCell(row, enrollment.status);
    appendCell(row, formatDateTime(enrollment.created_at));
    tbody.appendChild(row);
  });
}

/** 只通过受 staff_users 保护的 RPC 读取预约列表。 */
async function loadReservations() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    showStaffLogin();
    return;
  }

  const { data, error } = await supabaseClient.rpc("get_admin_reservations");

  if (error) {
    console.error("管理列表载入失败：", error);
    showStaffLogin();
    return;
  }

  reservations = data.sort((a, b) => {
    if (a.slot_date !== b.slot_date) return a.slot_date.localeCompare(b.slot_date);
    return convertToDecimalTime(a.time_slot) - convertToDecimalTime(b.time_slot);
  });
  isStaff = true;
  renderReservations();
  loadSlots();
  loadSettings();
}

/** 显示工作人员登入说明，并开放 Google OAuth 登录按钮。 */
function showStaffLogin() {
  const message = document.getElementById("admin-message");
  message.textContent = t("staffOnly");
  message.hidden = false;
  document.getElementById("staff-login").hidden = false;
  document.getElementById("export-btn").disabled = true;
  document.querySelector(".admin-tabs").hidden = true;
  document.querySelectorAll("[data-admin-panel]").forEach((panel) => { panel.hidden = true; });
}

/** 切换管理页面的预约列表、时段设置和系统设置三个区域。 */
function showAdminPanel(view) {
  document.querySelectorAll("[data-admin-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.adminPanel !== view;
  });
  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
}

/** 读取并显示可预约时段、名额和单个时段的开放状态。 */
async function loadSlots() {
  if (!isStaff) return;
  const { data, error } = await supabaseClient.rpc("get_admin_slots");
  if (error) {
    console.error("时段设置载入失败：", error);
    return;
  }

  const tbody = document.querySelector("#slot-table tbody");
  tbody.replaceChildren();
  data.forEach((slot) => {
    const row = document.createElement("tr");
    [slot.slot_date, slot.time_slot, slot.capacity, slot.is_open ? "✓" : "—"].forEach((value) => appendCell(row, value));
    tbody.appendChild(row);
  });
}

/** 把数据库保存的开放时间转换为 datetime-local 输入框需要的格式。 */
function toLocalInputValue(dateString) {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** 读取系统总开关与开放、关闭时间。 */
async function loadSettings() {
  if (!isStaff) return;
  const { data, error } = await supabaseClient.rpc("get_admin_settings");
  if (error || !data.length) {
    console.error("系统设置载入失败：", error);
    return;
  }

  const settings = data[0];
  document.getElementById("system-enabled").checked = settings.is_enabled;
  document.getElementById("booking-opens-at").value = toLocalInputValue(settings.booking_opens_at);
  document.getElementById("booking-closes-at").value = toLocalInputValue(settings.booking_closes_at);
}

/** 为 CSV 单元格转义双引号和可能被表格软件识别的公式前缀。 */
function escapeCsv(value) {
  const text = String(value || "").replaceAll('"', '""');
  return '"' + (/^[=+\-@]/.test(text) ? "'" + text : text) + '"';
}

/** 使用当前显示语言导出已载入的预约资料。 */
function exportCSV() {
  const headers = Array.from(document.querySelectorAll("#result-table thead th"))
    .map((header) => escapeCsv(header.textContent));
  const rows = reservations.map((enrollment) => [
    formatDate(enrollment.slot_date),
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

// 绑定导出按钮，并在切换语言后刷新日期与表头。
document.getElementById("export-btn").addEventListener("click", exportCSV);
// 管理选项卡只切换画面，不会改变数据库资料。
document.querySelectorAll("[data-admin-tab]").forEach((button) => {
  button.addEventListener("click", () => showAdminPanel(button.dataset.view));
});
// 保存一个时段；相同日期和时间会更新容量与开放状态。
document.getElementById("slot-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const { error } = await supabaseClient.rpc("save_admin_slot", {
    p_slot_date: document.getElementById("slot-date").value,
    p_time_slot: document.getElementById("slot-time").value.trim(),
    p_capacity: Number(document.getElementById("slot-capacity").value),
    p_is_open: document.getElementById("slot-open").checked
  });
  if (error) {
    console.error("时段保存失败：", error);
    alert(t("loadFailed"));
    return;
  }
  alert(t("saved"));
  loadSlots();
});
// 保存系统总开关与接受预约的时间范围。
document.getElementById("settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const { error } = await supabaseClient.rpc("save_admin_settings", {
    p_is_enabled: document.getElementById("system-enabled").checked,
    p_opens_at: new Date(document.getElementById("booking-opens-at").value).toISOString(),
    p_closes_at: new Date(document.getElementById("booking-closes-at").value).toISOString()
  });
  if (error) {
    console.error("系统设置保存失败：", error);
    alert(t("loadFailed"));
    return;
  }
  alert(t("saved"));
});
document.getElementById("staff-login").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) console.error("工作人员登录跳转失败：", error);
});
document.addEventListener("reservation-language-change", renderReservations);
loadReservations();
