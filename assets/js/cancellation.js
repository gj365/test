const { client: supabaseClient, formatDate, loadFooter, t } = window.ReservationApp;
const table = document.getElementById("result-table");
const tbody = table.querySelector("tbody");
const emptyMessage = document.getElementById("empty");
let reservation = null;
let reservationCode = "";

loadFooter();

/** 安全地向表格行写入纯文本单元格，避免用户资料被当作 HTML 执行。 */
function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value || "";
  row.appendChild(cell);
}

/** 将预约编号验证通过后返回的单条预约资料显示在页面上。 */
function renderReservation() {
  tbody.replaceChildren();
  emptyMessage.textContent = "";
  table.style.display = reservation ? "table" : "none";
  if (!reservation) return;

  const row = document.createElement("tr");
  appendCell(row, formatDate(reservation.slot_date));
  appendCell(row, reservation.time_slot);
  appendCell(row, reservation.name);
  appendCell(row, reservation.kana);
  appendCell(row, reservation.nationality);
  appendCell(row, reservation.status);

  const actionCell = document.createElement("td");
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "btn cancel";
  cancelButton.textContent = t("cancel");
  cancelButton.addEventListener("click", cancelReservation);
  actionCell.appendChild(cancelButton);
  row.appendChild(actionCell);
  tbody.appendChild(row);
}

/** 以预约编号为凭证取消记录，避免只凭姓名删除他人的预约。 */
async function cancelReservation() {
  if (!reservation) return;
  if (!confirm(t("cancelPrompt", formatDate(reservation.slot_date), reservation.time_slot))) return;

  const { data, error } = await supabaseClient.rpc("cancel_my_reservation", {
    p_reservation_code: reservationCode
  });

  if (error || !data) {
    console.error("取消预约失败：", error);
    alert(t("loadFailed"));
    return;
  }

  alert(t("cancelSucceeded"));
  window.location.href = "index.html";
}

// 点击查询时仅把预约编号交给数据库函数，不公开完整预约表。
document.getElementById("search").addEventListener("click", async () => {
  reservationCode = document.getElementById("reservation-code").value.trim().toUpperCase();
  if (!reservationCode) {
    alert(t("enterReservationCode"));
    return;
  }

  const { data, error } = await supabaseClient.rpc("find_my_reservation", {
    p_reservation_code: reservationCode
  });

  if (error) {
    console.error("预约查询失败：", error);
    alert(t("loadFailed"));
    return;
  }

  reservation = data && data.length ? data[0] : null;
  if (!reservation) {
    tbody.replaceChildren();
    table.style.display = "none";
    emptyMessage.textContent = t("noReservation");
    return;
  }

  renderReservation();
});

// 切换语言时重新绘制已有查询结果的日期、按钮与表格文字。
document.addEventListener("reservation-language-change", () => {
  if (reservation) renderReservation();
});
